import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { parseOtaEmail, OTA_FROM, OTA_SUBJECT, type OtaPlatform, type OtaBooking } from '@/lib/otaEmailParser';
import { isUrgentTourDate } from '@/lib/reservationUrgency';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';
import { getHawaiiDateStr } from '@/lib/timeUtils';
import { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';
import { getPickupLocations, resolveNearestPickup } from '@/lib/nearestPickup';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * OTA(클룩·GetYourGuide·Viator·여기어때) 예약 메일 자동 수집 Cron.
 * - 5분마다 Gmail IMAP 의 UNSEEN 메일을 플랫폼별로 검색
 * - 신규 예약 → reservations INSERT (상태 '안내필요')  ← 운영자가 직접 안내 후 '예약확정' 으로 변경
 * - 취소     → 기존 예약 UPDATE (상태 '취소요청')      ← '취소' 로 바로 바꾸지 않는다. 눈으로 확인 후 마감.
 * - 부분취소 → 인원만 '남은 수량' 으로 줄이고 상태 '안내필요' ← 남은 손님이 있으므로 취소요청으로 보내지 않는다.
 * - 픽업이 호텔 주소로만 오면 가장 가까운 픽업 장소로 치환 (원문 주소는 note 에 보존)
 * - 취소는 투어일과 무관하게 항상 Discord 알림
 * - 파싱/매칭 실패 시 \Seen 을 붙이지 않아 메일이 안읽음으로 남는다 (수동 대응 가능)
 */

const PLATFORMS: OtaPlatform[] = ['klook', 'gyg', 'viator', 'yeogi'];

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // OTA 메일이 별도 계정(hioceanstar)으로 오면 전용 자격증명을 쓰고,
        // 기존 계정으로 전달(forward)해 두었으면 그대로 IMAP_EMAIL 을 쓴다.
        const email = process.env.IMAP_EMAIL_OTA || process.env.IMAP_EMAIL;
        const password = process.env.IMAP_PW_OTA || process.env.IMAP_PW;
        if (!email || !password) {
            return NextResponse.json({ error: 'Email credentials not configured' }, { status: 500 });
        }

        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: { user: email, pass: password },
            logger: false,
        });

        await client.connect();

        let inserted = 0;
        let cancelled = 0;
        let partial = 0;
        let unmatched = 0;
        let skipped = 0;
        let alertsSent = 0;
        let errors = 0;

        try {
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
                        if (booking.kind === 'new' && booking.pickupLocation) {
                            const resolved = await resolveNearestPickup(booking.pickupLocation, pickupLocations);
                            if (resolved !== booking.pickupLocation) {
                                booking.note = [booking.note, `주소: ${booking.pickupLocation}`]
                                    .filter(Boolean).join(' / ');
                                booking.pickupLocation = resolved;
                            }
                        }

                        const done = booking.kind === 'new' ? await handleNew(booking)
                            : booking.kind === 'partial_cancel' ? await handlePartialCancel(booking)
                                : await handleCancel(booking);

                        if (done === 'error') { errors++; continue; }
                        if (done === 'inserted') inserted++;
                        if (done === 'cancelled') cancelled++;
                        if (done === 'partial') partial++;
                        if (done === 'unmatched') unmatched++;
                        if (done === 'duplicate') skipped++;

                        if (await notify(booking, done)) alertsSent++;

                        await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
                    } catch (msgError) {
                        console.error(`[OTA Cron] ${platform} 처리 중 오류:`, msgError);
                        errors++;
                    }
                }
            }
        } finally {
            await client.logout();
        }

        return NextResponse.json({
            success: true,
            inserted,
            cancelled,
            partial,
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

type Outcome = 'inserted' | 'duplicate' | 'cancelled' | 'partial' | 'unmatched' | 'error';

type Target = { id: string; status: string; note: string | null; pax: string | null };

/** 1순위 예약번호, 2순위 출처+이름+투어일 (수기로 넣어 order_id 가 빈 건 대비) */
async function findTarget(b: OtaBooking): Promise<Target | null> {
    const cols = 'id, status, note, pax';

    const { data: byOrder } = await supabaseServer
        .from('reservations').select(cols).eq('order_id', b.orderId).maybeSingle();
    if (byOrder) return byOrder as Target;

    if (!b.name) return null;

    const { data: byName } = await supabaseServer
        .from('reservations').select(cols)
        .eq('source', b.source).eq('name', b.name).eq('tour_date', b.tourDate)
        .maybeSingle();
    return (byName as Target) ?? null;
}

/** 신규 예약 → '안내필요' 로 INSERT */
async function handleNew(b: OtaBooking): Promise<Outcome> {
    const { data: existing } = await supabaseServer
        .from('reservations')
        .select('id')
        .eq('order_id', b.orderId)
        .maybeSingle();

    if (existing) {
        console.log(`[OTA Cron] 이미 존재하는 예약: ${b.orderId}`);
        return 'duplicate';
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
        return 'error';
    }
    return 'inserted';
}

/** 취소 메일 → 기존 예약을 '취소요청' 으로. 없으면 unmatched (INSERT 하지 않는다) */
async function handleCancel(b: OtaBooking, preloaded?: Target): Promise<Outcome> {
    const target = preloaded ?? await findTarget(b);

    if (!target) {
        console.warn(`[OTA Cron] 취소 메일인데 매칭 예약 없음: ${b.orderId}`);
        return 'unmatched';
    }

    // 이미 마감된 건은 되살리지 않는다.
    if (target.status === '취소' || target.status === '취소요청') return 'duplicate';

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
        return 'error';
    }
    return 'cancelled';
}

/**
 * 부분 취소 → 인원만 '남은 수량' 으로 줄이고 '안내필요' 로 올려 둔다.
 *
 * 취소요청으로 보내면 안 된다. 취소요청 화면의 처리 버튼은 상태를 '취소' 로 마감하는데,
 * 부분 취소는 남은 손님이 있어서 그렇게 닫히면 그 손님까지 사라진다.
 * 남은 인원이 0이면 사실상 전체 취소이므로 그때만 취소요청으로 넘긴다.
 */
async function handlePartialCancel(b: OtaBooking): Promise<Outcome> {
    const target = await findTarget(b);

    if (!target) {
        console.warn(`[OTA Cron] 부분취소 메일인데 매칭 예약 없음: ${b.orderId}`);
        return 'unmatched';
    }
    if (target.status === '취소') return 'duplicate';

    const remaining = b.adultCount + b.childCount;
    if (remaining === 0) return handleCancel(b, target);

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
        return 'error';
    }
    return 'partial';
}

/** 취소는 항상, 신규는 당일/전날 투어일 때만 알린다. */
async function notify(b: OtaBooking, outcome: Outcome): Promise<boolean> {
    const title =
        outcome === 'cancelled' ? '❌ [취소요청] OTA 취소 접수'
            : outcome === 'partial' ? '✂️ [부분취소] 인원이 줄었습니다'
                : outcome === 'unmatched' ? '⚠️ [취소] 매칭되는 예약을 못 찾음'
                    : outcome === 'inserted' && isUrgentTourDate(b.tourDate) ? '🚨 [안내필요] OTA 긴급 예약!'
                        : null;

    if (!title) return false;

    return sendDiscordUrgentAlert({
        title,
        customerName: b.name,
        tourDate: b.tourDate,
        option: b.option,
        pax: b.pax,
        source: b.source,
        orderNumber: b.orderId,
        pickupLocation: b.pickupLocation || undefined,
    });
}

/**
 * UNSEEN + 발신자 + 제목 + 최근 2일 (시간대 차이 고려).
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
        const found = await client.search({ seen: false, from, subject, since }, { uid: true });
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
