import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { parseOtaEmail, OTA_FROM, OTA_SUBJECT, type OtaPlatform, type OtaBooking } from '@/lib/otaEmailParser';
import { isUrgentTourDate } from '@/lib/reservationUrgency';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';
import { getHawaiiDateStr } from '@/lib/timeUtils';
import { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';
import { getPickupLocations, resolveNearestPickup } from '@/lib/nearestPickup';
import { imapAccounts } from '@/lib/imapAccounts';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * OTA(클룩·GetYourGuide·Viator·여기어때) 예약 메일 자동 수집 Cron.
 * - 5분마다 Gmail IMAP 에서 아직 처리하지 않은 메일을 플랫폼별로 검색
 * - 신규 예약 → reservations INSERT (상태 '안내필요')  ← 운영자가 직접 안내 후 '예약확정' 으로 변경
 * - 취소     → 기존 예약 UPDATE (상태 '취소요청')      ← '취소' 로 바로 바꾸지 않는다. 눈으로 확인 후 마감.
 * - 부분취소 → 인원만 '남은 수량' 으로 줄이고 상태 '안내필요' ← 남은 손님이 있으므로 취소요청으로 보내지 않는다.
 * - 변경     → 기존 예약의 픽업/인원/날짜만 갱신 (GYG "Booking detail change") ← INSERT 하지 않는다.
 * - 픽업이 호텔 주소로만 오면 가장 가까운 픽업 장소로 치환 (원문 주소는 note 에 보존)
 * - 날짜·인원·픽업 변경, 부분취소, 취소는 **투어일과 무관하게 항상 Discord 알림**
 *   (무엇이 어떻게 바뀌었는지까지 알림에 싣는다. 놓치면 손님이 엉뚱한 시간에 기다린다)
 * - 처리한 메일에는 `OceanstarDone` 키워드를 붙이고 다음부터 그 키워드로 걸러낸다.
 *   (읽음 여부로 거르면 사람이 먼저 열어본 메일을 놓친다)
 * - 파싱/매칭 실패 시 표식을 붙이지 않아 메일이 안읽음으로 남는다 (수동 대응 가능)
 */

const PLATFORMS: OtaPlatform[] = ['klook', 'gyg', 'viator', 'yeogi'];

/**
 * 처리 완료 표식. `\Seen`(읽음)에 기대면 **사람이 Gmail 에서 먼저 열어본 메일을 영원히 건너뛴다.**
 * Gmail 은 permanentFlags 에 `\*` 를 주므로 임의 키워드를 붙일 수 있다(실측 확인).
 * 읽음 처리도 그대로 유지해서 받은편지함이 보이던 대로 보이게 둔다.
 */
const PROCESSED = 'OceanstarDone';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accounts = imapAccounts();
        if (accounts.length === 0) {
            return NextResponse.json({ error: 'Email credentials not configured' }, { status: 500 });
        }

        let inserted = 0;
        let cancelled = 0;
        let partial = 0;
        let updated = 0;
        let unmatched = 0;
        let skipped = 0;
        let alertsSent = 0;
        let errors = 0;

        // 수신 주소를 옮기는 동안에는 두 메일함을 한 번에 훑는다 (imapAccounts 주석 참고).
        // 한 계정이 접속에 실패해도 나머지는 계속 돌려야 그 함에 온 예약을 놓치지 않는다.
        for (const account of accounts) {
            const client = new ImapFlow({
                host: 'imap.gmail.com',
                port: 993,
                secure: true,
                auth: account,
                logger: false,
            });

            try {
                await client.connect();
                await client.mailboxOpen('INBOX');

                const pickupLocations = await getPickupLocations();

                for (const platform of PLATFORMS) {
                    const messages = await searchEmails(client, OTA_FROM[platform], OTA_SUBJECT[platform]);

                    for (const msg of messages) {
                        try {
                            const booking = parseOtaEmail(msg.html, msg.subject, msg.from);
                            if (!booking) {
                                // 안읽음으로 남겨 다음 cron 에서 재시도 + 사람 눈에 띄게 한다.
                                console.log(`[OTA Cron] 파싱 스킵 (${platform}): ${msg.subject}`);
                                skipped++;
                                continue;
                            }

                            // OTA 는 픽업 장소가 아니라 묵는 호텔 주소를 준다.
                            // 가장 가까운 픽업 장소로 바꾸되 원문 주소는 note 에 남긴다.
                            if ((booking.kind === 'new' || booking.kind === 'update') && booking.pickupLocation) {
                                const resolved = await resolveNearestPickup(booking.pickupLocation, pickupLocations);
                                if (resolved !== booking.pickupLocation) {
                                    booking.note = [booking.note, `주소: ${booking.pickupLocation}`]
                                        .filter(Boolean).join(' / ');
                                    booking.pickupLocation = resolved;
                                }
                            }

                            const { outcome, detail } = booking.kind === 'new' ? await handleNew(booking)
                                : booking.kind === 'update' ? await handleUpdate(booking)
                                    : booking.kind === 'partial_cancel' ? await handlePartialCancel(booking)
                                        : await handleCancel(booking);

                            if (outcome === 'error') { errors++; continue; }
                            if (outcome === 'inserted') inserted++;
                            if (outcome === 'cancelled') cancelled++;
                            if (outcome === 'partial') partial++;
                            if (outcome === 'updated') updated++;
                            if (outcome === 'unmatched') unmatched++;
                            if (outcome === 'duplicate') skipped++;

                            if (await notify(booking, outcome, detail)) alertsSent++;

                            await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                        } catch (msgError) {
                            console.error(`[OTA Cron] ${platform} 처리 중 오류:`, msgError);
                            errors++;
                        }
                    }
                }
            } catch (accountError) {
                console.error(`[OTA Cron] ${account.user} 처리 실패:`, accountError);
                errors++;
            } finally {
                await client.logout().catch(() => { });
            }
        }

        return NextResponse.json({
            success: true,
            inserted,
            cancelled,
            partial,
            updated,
            unmatched,
            skipped,
            alertsSent,
            errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[OTA Cron] 전체 오류:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

type Outcome = 'inserted' | 'duplicate' | 'cancelled' | 'partial' | 'updated' | 'unmatched' | 'error';

/** detail 은 Discord 알림에 실을 "무엇이 바뀌었는지" 요약. */
type Result = { outcome: Outcome; detail?: string };

type Target = {
    id: string; status: string; note: string | null;
    pax: string | null; pickup_location: string | null;
    tour_date: string | null; option: string | null;
};

/** 1순위 예약번호, 2순위 출처+이름+투어일 (수기로 넣어 order_id 가 빈 건 대비) */
async function findTarget(b: OtaBooking): Promise<Target | null> {
    const cols = 'id, status, note, pax, pickup_location, tour_date, option';

    const { data: byOrder } = await supabaseServer
        .from('reservations').select(cols).eq('order_id', b.orderId).maybeSingle();
    if (byOrder) return byOrder as Target;

    if (!b.name) return null;

    // 예약번호가 이미 붙어 있는 행은 다른 예약이다. 같은 손님이 같은 날 두 번 예약했을 때
    // 엉뚱한 쪽을 취소·변경하지 않도록 번호가 빈 행만 본다.
    const { data: byName } = await supabaseServer
        .from('reservations').select(cols)
        .eq('source', b.source).eq('name', b.name).eq('tour_date', b.tourDate)
        .is('order_id', null)
        .maybeSingle();
    return (byName as Target) ?? null;
}

/** 신규 예약 → '안내필요' 로 INSERT */
async function handleNew(b: OtaBooking): Promise<Result> {
    const { data: existing } = await supabaseServer
        .from('reservations')
        .select('id')
        .eq('order_id', b.orderId)
        .maybeSingle();

    if (existing) {
        console.log(`[OTA Cron] 이미 존재하는 예약: ${b.orderId}`);
        return { outcome: 'duplicate' };
    }

    const { error } = await supabaseServer.from('reservations').insert({
        order_id: b.orderId,
        name: b.name,
        tour_date: b.tourDate,
        source: b.source,
        status: '안내필요',
        option: b.option,
        pax: b.pax,
        adult_count: b.adultCount,
        child_count: b.childCount,
        pickup_location: b.pickupLocation,
        contact: b.contact,
        booker_email: b.bookerEmail || null,
        note: b.note,
        receipt_date: await getDynamicReceiptDateStr(),
        is_admin_checked: false,
    });

    if (error) {
        console.error('[OTA Cron] INSERT 실패:', error);
        return { outcome: 'error' };
    }
    return { outcome: 'inserted' };
}

/** 취소 메일 → 기존 예약을 '취소요청' 으로. 없으면 unmatched (INSERT 하지 않는다) */
async function handleCancel(b: OtaBooking, preloaded?: Target): Promise<Result> {
    const target = preloaded ?? await findTarget(b);

    if (!target) {
        console.warn(`[OTA Cron] 취소 메일인데 매칭 예약 없음: ${b.orderId}`);
        return { outcome: 'unmatched' };
    }

    // 이미 마감된 건은 되살리지 않는다.
    if (target.status === '취소' || target.status === '취소요청') return { outcome: 'duplicate' };

    const reason = b.note.match(/취소사유: ([^/]+)/)?.[1]?.trim();
    const stamp = `[OTA 취소메일 수신: ${getHawaiiDateStr()} / ${b.source}${reason ? ` / 사유: ${reason}` : ''}]`;

    const { error } = await supabaseServer
        .from('reservations')
        .update({
            status: '취소요청',
            cancel_requested_at: new Date().toISOString(),
            is_admin_checked: false,
            note: `${target.note || ''} ${stamp}`.trim(),
        })
        .eq('id', target.id);

    if (error) {
        console.error('[OTA Cron] 취소 UPDATE 실패:', error);
        return { outcome: 'error' };
    }
    return {
        outcome: 'cancelled',
        detail: `${target.status} → 취소요청${reason ? ` / 사유 ${reason}` : ''}`,
    };
}

/**
 * GYG "Booking detail change" → 기존 예약의 픽업·인원·날짜만 갱신한다.
 *
 * 이 메일에는 고객명·연락처가 없다. 신규로 처리하면 이름 자리에 안내 문장이 들어간
 * 가짜 예약이 생기므로, **매칭되는 예약이 없으면 아무것도 만들지 않는다.**
 * 인원은 총원만 오고 성인/아동 구분이 없어서 pax 만 갱신하고 adult/child 는 건드리지 않는다.
 */
async function handleUpdate(b: OtaBooking): Promise<Result> {
    const target = await findTarget(b);

    if (!target) {
        console.warn(`[OTA Cron] 변경 메일인데 매칭 예약 없음: ${b.orderId}`);
        return { outcome: 'unmatched' };
    }
    if (target.status === '취소') return { outcome: 'duplicate' };

    // 날짜·옵션·인원·픽업 네 가지를 모두 본다. 날짜만 바뀌는 변경도 실제로 온다.
    const changes: string[] = [];
    if (b.tourDate && b.tourDate !== target.tour_date) {
        changes.push(`투어일 ${target.tour_date || '?'} → ${b.tourDate}`);
    }
    if (b.option && b.option !== target.option) {
        changes.push(`옵션 ${target.option || '(없음)'} → ${b.option}`);
    }
    if (b.pickupLocation && b.pickupLocation !== target.pickup_location) {
        changes.push(`픽업 ${target.pickup_location || '(없음)'} → ${b.pickupLocation}`);
    }
    if (b.pax && b.pax !== target.pax) {
        changes.push(`인원 ${target.pax || '?'} → ${b.pax} (성인/아동 구분 확인 필요)`);
    }

    // 바뀐 게 없으면 상태도 알림도 건드리지 않는다.
    if (changes.length === 0) return { outcome: 'duplicate' };

    const stamp = `[${b.source} 예약변경 수신: ${getHawaiiDateStr()} / ${changes.join(' / ')}]`;

    const { error } = await supabaseServer
        .from('reservations')
        .update({
            tour_date: b.tourDate,
            option: b.option || undefined,
            pax: b.pax || undefined,
            pickup_location: b.pickupLocation || undefined,
            status: '안내필요',
            is_admin_checked: false,
            note: `${target.note || ''} ${stamp}`.trim(),
        })
        .eq('id', target.id);

    if (error) {
        console.error('[OTA Cron] 변경 UPDATE 실패:', error);
        return { outcome: 'error' };
    }
    return { outcome: 'updated', detail: changes.join(' / ') };
}

/**
 * 부분 취소 → 인원만 '남은 수량' 으로 줄이고 '안내필요' 로 올려 둔다.
 *
 * 취소요청으로 보내면 안 된다. 취소요청 화면의 처리 버튼은 상태를 '취소' 로 마감하는데,
 * 부분 취소는 남은 손님이 있어서 그렇게 닫히면 그 손님까지 사라진다.
 * 남은 인원이 0이면 사실상 전체 취소이므로 그때만 취소요청으로 넘긴다.
 */
async function handlePartialCancel(b: OtaBooking): Promise<Result> {
    const target = await findTarget(b);

    if (!target) {
        console.warn(`[OTA Cron] 부분취소 메일인데 매칭 예약 없음: ${b.orderId}`);
        return { outcome: 'unmatched' };
    }
    if (target.status === '취소') return { outcome: 'duplicate' };

    const remaining = b.adultCount + b.childCount;
    if (remaining === 0) return handleCancel(b, target);

    // 같은 메일을 다시 읽어도 두 번 쓰거나 두 번 알리지 않는다.
    if (target.pax === b.pax) return { outcome: 'duplicate' };

    const cancelledQty = b.note.match(/취소수량: ([^/]+)/)?.[1]?.trim();
    const stamp = `[${b.source} 부분취소 수신: ${getHawaiiDateStr()}`
        + `${cancelledQty ? ` / 취소 ${cancelledQty}` : ''}`
        + ` / ${target.pax || '?'} → ${b.pax}]`;

    const { error } = await supabaseServer
        .from('reservations')
        .update({
            pax: b.pax,
            adult_count: b.adultCount,
            child_count: b.childCount,
            option: b.option || undefined,
            status: '안내필요',
            is_admin_checked: false,
            note: `${target.note || ''} ${stamp}`.trim(),
        })
        .eq('id', target.id);

    if (error) {
        console.error('[OTA Cron] 부분취소 UPDATE 실패:', error);
        return { outcome: 'error' };
    }
    return {
        outcome: 'partial',
        detail: `인원 ${target.pax || '?'} → ${b.pax}${cancelledQty ? ` / 취소분 ${cancelledQty}` : ''}`,
    };
}

/**
 * 변경·부분취소·취소는 **투어일과 무관하게 항상** 알린다.
 * 놓치면 손님이 엉뚱한 날·시간에 기다리게 되므로 조용히 넘어가서는 안 된다.
 * 신규 예약만 기존 MRT cron 과 동일하게 당일/전날일 때만 알린다.
 */
async function notify(b: OtaBooking, outcome: Outcome, detail?: string): Promise<boolean> {
    const kindLabel = b.kind === 'partial_cancel' ? '부분취소' : b.kind === 'update' ? '예약변경' : '취소';

    const title =
        outcome === 'cancelled' ? '❌ [취소요청] OTA 취소 접수'
            : outcome === 'partial' ? '✂️ [부분취소] 인원이 줄었습니다'
                : outcome === 'updated' ? '🔄 [예약변경] 날짜·인원·픽업이 바뀌었습니다'
                    : outcome === 'unmatched' ? `⚠️ [${kindLabel}] 매칭되는 예약을 못 찾음`
                        : outcome === 'inserted' && isUrgentTourDate(b.tourDate) ? '🚨 [안내필요] OTA 긴급 예약!'
                            : null;

    if (!title) return false;

    const sent = await sendDiscordUrgentAlert({
        title,
        customerName: b.name || '(메일에 이름 없음)',
        tourDate: b.tourDate,
        option: b.option,
        pax: b.pax,
        source: b.source,
        orderNumber: b.orderId,
        pickupLocation: b.pickupLocation || undefined,
        detail,
    });

    // 알림이 실패해도 DB 는 이미 갱신됐고 상태가 '안내필요'/'취소요청' 이라
    // 대시보드 종 알림에는 남는다. 로그만 크게 남긴다.
    if (!sent) console.error(`[OTA Cron] ⚠️ Discord 알림 실패 — ${title} / ${b.orderId}`);
    return sent;
}

/**
 * 아직 처리 표식이 없는 메일 + 발신자 + 제목 + 최근 2일 (시간대 차이 고려).
 * 제목 검색어는 플랫폼마다 여러 개일 수 있어서(GYG) 합집합을 만든다.
 */
async function searchEmails(
    client: ImapFlow,
    from: string,
    subjects: string[],
): Promise<Array<{ uid: number; subject: string; html: string; from: string }>> {
    const results: Array<{ uid: number; subject: string; html: string; from: string }> = [];
    const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const uidSet = new Set<number>();
    for (const subject of subjects) {
        const found = await client.search({ unKeyword: PROCESSED, from, subject, since }, { uid: true });
        for (const uid of found || []) uidSet.add(uid);
    }

    for (const uid of uidSet) {
        try {
            const message = await client.fetchOne(String(uid), { source: true }, { uid: true });
            if (!message || !message.source) continue;

            const source = message.source.toString();
            const parsed = await simpleParser(source);

            results.push({
                uid,
                subject: parsed.subject || message.envelope?.subject || '',
                html: parsed.html || parsed.textAsHtml || source,
                from: parsed.from?.text || from,
            });
        } catch (fetchError) {
            console.error(`[OTA Cron] UID ${uid} fetch 실패:`, fetchError);
        }
    }

    return results;
}
