import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { parseMyRealTripEmail } from '@/lib/myrealTripEmailParser';
import { isUrgentTourDate } from '@/lib/reservationUrgency';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';
import { getHawaiiDateStr , getReceiptDateStr } from '@/lib/timeUtils';
import { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * 마이리얼트립 이메일 자동 수집 Cron Job
 * - 5분마다 Gmail IMAP에 접속하여 **아직 처리 표식이 없는** 이메일 검색
 *   (읽음 여부로 거르면 사람이 Gmail 에서 먼저 열어본 메일을 영원히 놓친다)
 * - [확정대기] → reservations INSERT (예약대기)
 * - [확정완료] → reservations UPDATE (예약확정)
 * - [예약취소] / 예약 취소 요청 접수 → reservations UPDATE (취소요청) + **항상 Discord 알림**
 *   ('취소' 로 바로 닫지 않는다. 취소요청 화면에서 눈으로 확인하고 마감한다)
 * - 당일/전날 투어이면 Discord 긴급 알림 발송
 */
/**
 * 처리 완료 표식. Gmail 은 permanentFlags 에 `\*` 를 주므로 임의 키워드를 붙일 수 있다(실측 확인).
 * 읽음 처리는 그대로 유지해서 받은편지함이 보이던 대로 보이게 둔다.
 */
const PROCESSED = 'OceanstarDone';

/**
 * 마이리얼트립은 **인원 1명당 예약번호(EXP)를 따로 발급**한다.
 * 성인 2 + 아동 1 이면 메일이 3통 오고, 그대로 두면 행이 3개 생긴다.
 * 운영자가 한 행으로 합치고 나머지를 지우면, 남은 예약번호의 확정 메일이
 * order_id 로 매칭되지 않아 지웠던 행이 다시 살아난다. (같은 뿌리의 두 증상)
 *
 * 그래서 INSERT 하기 전에 **같은 이름·같은 여행일의 살아있는 M 예약**이 있는지 본다.
 * 있으면 행을 만들지 않고 note 에 예약번호만 덧붙인 뒤 Discord 로 알린다.
 * (같은 이름·같은 날의 별개 예약일 가능성이 있으므로 조용히 버리지 않고 반드시 알린다)
 *
 * @returns 합쳐 넣은 경우 true. 그러면 INSERT 하지 않는다.
 */
async function mergeIntoExisting(
    name: string,
    tourDate: string,
    orderNumber: string,
    optionName: string,
): Promise<boolean> {
    const { data: rows } = await supabaseServer
        .from('reservations')
        .select('id, note, pax, option, status')
        .eq('source', 'M')
        .eq('name', name)
        .eq('tour_date', tourDate)
        // 취소/취소요청 행은 살아있는 예약이 아니다. 손님이 취소하고 같은 날로 다시 잡으면
        // 새 예약이 취소된 행에 흡수돼서 재예약이 통째로 사라진다.
        .not('status', 'in', '("취소","취소요청")');

    if (!rows || rows.length !== 1) return false;   // 0건이면 새 예약, 2건 이상이면 사람이 판단

    const target = rows[0];
    if ((target.note || '').includes(orderNumber)) return true;   // 이미 붙여 둔 번호

    await supabaseServer
        .from('reservations')
        .update({
            note: `${target.note || ''} [동일 예약 합침: ${orderNumber}${optionName ? ` (${optionName})` : ''}]`.trim(),
            is_admin_checked: false,
        })
        .eq('id', target.id);

    await sendDiscordUrgentAlert({
        title: '🧩 [인원 추가] 같은 예약의 다른 예약번호 — 인원 확인 필요',
        customerName: name,
        tourDate,
        option: target.option || optionName,
        pax: target.pax || undefined,
        source: '마이리얼트립',
        orderNumber,
        detail: `기존 ${target.status} 행에 합쳤습니다 (현재 인원 ${target.pax || '미입력'}). 마이리얼트립은 1인당 예약번호가 따로 발급되니 인원이 맞는지 확인해주세요.`,
    });

    console.log(`[MRT Cron] 기존 행에 합침: ${orderNumber} → ${name} ${tourDate}`);
    return true;
}

export async function GET(request: Request) {
    try {
        // 인증 확인
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
        if (process.env.CRON_SECRET && authHeader !== expectedAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = process.env.IMAP_EMAIL;
        const password = process.env.IMAP_PW;
        if (!email || !password) {
            return NextResponse.json({ error: 'Email credentials not configured' }, { status: 500 });
        }

        // Gmail IMAP 연결
        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: { user: email, pass: password },
            logger: false,
        });

        await client.connect();

        let pendingProcessed = 0;
        let confirmedProcessed = 0;
        let cancelProcessed = 0;
        let mergedIntoExisting = 0;
        let cancelUnmatched = 0;
        let slackAlertsSent = 0;
        let errors = 0;

        try {
            // INBOX 열기
            await client.mailboxOpen('INBOX');

            // ============================================
            // Step 1: [확정대기] 이메일 처리
            // ============================================
            const pendingMessages = await searchEmails(client, '확정대기');
            for (const msg of pendingMessages) {
                try {
                    const parsed = parseMyRealTripEmail(msg.html, msg.subject);
                    if (!parsed || parsed.type !== 'pending') {
                        console.log(`[MRT Cron] 파싱 스킵 (확정대기): ${msg.subject}`);
                        continue; // SEEN 처리하지 않음 → 다음 cron에서 재시도
                    }

                    const { reservation } = parsed;

                    // 중복 체크 (order_id로 검색)
                    const { data: existing } = await supabaseServer
                        .from('reservations')
                        .select('id')
                        .eq('order_id', reservation.orderNumber)
                        .maybeSingle();

                    if (existing) {
                        console.log(`[MRT Cron] 이미 존재하는 예약: ${reservation.orderNumber}`);
                        await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                        continue;
                    }

                    // 같은 이름·여행일의 예약이 이미 있으면 행을 늘리지 않는다.
                    if (await mergeIntoExisting(
                        reservation.travelerName, reservation.tourDate,
                        reservation.orderNumber, reservation.optionName,
                    )) {
                        mergedIntoExisting++;
                        await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                        continue;
                    }

                    // INSERT (예약대기)
                    const { error: insertError } = await supabaseServer
                        .from('reservations')
                        .insert({
                            order_id: reservation.orderNumber,
                            name: reservation.travelerName,
                            tour_date: reservation.tourDate,
                            source: 'M',
                            status: '예약대기',
                            receipt_date: await getDynamicReceiptDateStr(),
                            is_admin_checked: false,
                        });

                    if (insertError) {
                        console.error(`[MRT Cron] INSERT 실패:`, insertError);
                        errors++;
                        continue;
                    }

                    pendingProcessed++;

                    // 긴급 판단 → Slack 알림
                    if (isUrgentTourDate(reservation.tourDate)) {
                        const sent = await sendDiscordUrgentAlert({
                            title: '🚨 [확정대기] 마이리얼트립 긴급 예약!',
                            customerName: reservation.travelerName,
                            tourDate: reservation.tourDate,
                            option: reservation.optionName,
                            source: '마이리얼트립',
                            orderNumber: reservation.orderNumber,
                        });
                        if (sent) slackAlertsSent++;
                    }

                    // 이메일 SEEN 처리
                    await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });

                } catch (msgError) {
                    console.error(`[MRT Cron] 확정대기 처리 중 오류:`, msgError);
                    errors++;
                }
            }

            // ============================================
            // Step 2: [확정완료] 이메일 처리
            // ============================================
            const confirmedMessages = await searchEmails(client, '확정완료');
            for (const msg of confirmedMessages) {
                try {
                    const parsed = parseMyRealTripEmail(msg.html, msg.subject);
                    if (!parsed || parsed.type !== 'confirmed') {
                        console.log(`[MRT Cron] 파싱 스킵 (확정완료): ${msg.subject}`);
                        continue;
                    }

                    const { reservation } = parsed;

                    // 기존 예약 검색 (order_id)
                    const { data: existing } = await supabaseServer
                        .from('reservations')
                        .select('id, status')
                        .eq('order_id', reservation.orderNumber)
                        .maybeSingle();

                    if (existing) {
                        // 같은 메일을 다시 읽어도 두 번 세거나 두 번 알리지 않는다.
                        // 취소된 건은 확정완료 메일을 다시 읽어도 **되살리지 않는다.**
                        if (existing.status !== '예약대기' && existing.status !== '대기') {
                            await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                            continue;
                        }

                        const { error: updateError } = await supabaseServer
                            .from('reservations')
                            .update({ status: '예약확정' })
                            .eq('id', existing.id);

                        if (updateError) {
                            console.error(`[MRT Cron] UPDATE 실패:`, updateError);
                            errors++;
                            continue;
                        }
                    } else {
                        // 합쳐진 예약의 다른 예약번호일 수 있다. 그러면 행을 새로 만들지 않는다.
                        if (await mergeIntoExisting(
                            reservation.travelerName, reservation.tourDate,
                            reservation.orderNumber, reservation.optionName,
                        )) {
                            mergedIntoExisting++;
                            await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                            continue;
                        }

                        // 확정대기를 놓친 경우 → INSERT (예약확정)
                        const { error: insertError } = await supabaseServer
                            .from('reservations')
                            .insert({
                                order_id: reservation.orderNumber,
                                name: reservation.travelerName,
                                tour_date: reservation.tourDate,
                                source: 'M',
                                status: '예약확정',
                                receipt_date: await getDynamicReceiptDateStr(),
                                is_admin_checked: false,
                            });

                        if (insertError) {
                            console.error(`[MRT Cron] 확정완료 INSERT 실패:`, insertError);
                            errors++;
                            continue;
                        }
                    }

                    confirmedProcessed++;

                    // 긴급 판단 → Slack 알림
                    if (isUrgentTourDate(reservation.tourDate)) {
                        const sent = await sendDiscordUrgentAlert({
                            title: '🚨 [확정완료] 마이리얼트립 예약 확정!',
                            customerName: reservation.travelerName,
                            tourDate: reservation.tourDate,
                            option: reservation.optionName,
                            source: '마이리얼트립',
                            orderNumber: reservation.orderNumber,
                        });
                        if (sent) slackAlertsSent++;
                    }

                    // 이메일 SEEN 처리
                    await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });

                } catch (msgError) {
                    console.error(`[MRT Cron] 확정완료 처리 중 오류:`, msgError);
                    errors++;
                }
            }

            // ============================================
            // Step 3: 취소 메일 처리 ([예약취소] / 예약 취소 요청 접수)
            // ============================================
            for (const keyword of ['예약취소', '취소 요청 접수']) {
                const cancelMessages = await searchEmails(client, keyword);

                for (const msg of cancelMessages) {
                    try {
                        const parsed = parseMyRealTripEmail(msg.html, msg.subject);
                        if (!parsed || (parsed.type !== 'cancelled' && parsed.type !== 'cancel_request')) {
                            console.log(`[MRT Cron] 파싱 스킵 (취소): ${msg.subject}`);
                            continue; // SEEN 처리하지 않음 → 사람 눈에 띄게 남긴다
                        }

                        const r = parsed.reservation;
                        const cols = 'id, status, note, name, tour_date';

                        // 1순위 예약번호. '취소 요청 접수' 메일에는 예약번호가 없어서 이름+여행일로 찾는다.
                        let candidates: Array<{ id: string; status: string; note: string | null }> = [];
                        if (r.orderNumber) {
                            const { data } = await supabaseServer
                                .from('reservations').select(cols).eq('order_id', r.orderNumber);
                            candidates = data || [];
                        }
                        if (candidates.length === 0 && r.travelerName) {
                            // 예약번호가 이미 붙어 있는 행은 **다른 예약**이다.
                            // 같은 손님이 같은 날 두 번 예약한 경우 엉뚱한 쪽을 취소시킬 수 있다.
                            const { data } = await supabaseServer
                                .from('reservations').select(cols)
                                .eq('source', 'M').eq('name', r.travelerName).eq('tour_date', r.tourDate)
                                .is('order_id', null);
                            candidates = data || [];
                        }

                        // 0건이면 만들지 않고, 2건 이상이면 어느 쪽인지 알 수 없으니 손대지 않는다.
                        if (candidates.length !== 1) {
                            cancelUnmatched++;
                            await sendDiscordUrgentAlert({
                                title: candidates.length === 0
                                    ? '⚠️ [취소] 매칭되는 예약을 못 찾음'
                                    : '⚠️ [취소] 후보가 여러 건 — 수동 확인 필요',
                                customerName: r.travelerName || '(이름 없음)',
                                tourDate: r.tourDate,
                                option: r.optionName,
                                source: '마이리얼트립',
                                orderNumber: r.orderNumber || '(메일에 예약번호 없음)',
                                detail: `${parsed.type === 'cancel_request' ? '취소 요청 접수' : '예약취소'} / 후보 ${candidates.length}건`,
                            });
                            await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                            continue;
                        }

                        const target = candidates[0];
                        // 이미 마감했거나 접수된 건은 다시 흔들지 않는다.
                        if (target.status === '취소' || target.status === '취소요청') {
                            await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                            continue;
                        }

                        const label = parsed.type === 'cancel_request' ? '취소요청 접수' : '예약취소';
                        const stamp = `[마이리얼트립 ${label} 수신: ${getHawaiiDateStr()}${r.orderNumber ? ` / ${r.orderNumber}` : ''}]`;

                        const { error: cancelError } = await supabaseServer
                            .from('reservations')
                            .update({
                                status: '취소요청',
                                cancel_requested_at: new Date().toISOString(),
                                is_admin_checked: false,
                                note: `${target.note || ''} ${stamp}`.trim(),
                            })
                            .eq('id', target.id);

                        if (cancelError) {
                            console.error('[MRT Cron] 취소 UPDATE 실패:', cancelError);
                            errors++;
                            continue; // SEEN 안 붙임 → 다음 실행에서 재시도
                        }

                        cancelProcessed++;

                        // 투어일과 무관하게 항상 알린다. 놓치면 빈 자리로 출항한다.
                        const sent = await sendDiscordUrgentAlert({
                            title: `❌ [취소요청] 마이리얼트립 ${label}`,
                            customerName: r.travelerName,
                            tourDate: r.tourDate,
                            option: r.optionName,
                            source: '마이리얼트립',
                            orderNumber: r.orderNumber || undefined,
                            detail: `${target.status} → 취소요청 (${label})`,
                        });
                        if (sent) slackAlertsSent++;
                        else console.error(`[MRT Cron] ⚠️ Discord 알림 실패 — 취소 ${r.travelerName} ${r.tourDate}`);

                        await client.messageFlagsAdd(msg.uid, [PROCESSED, '\\Seen'], { uid: true });
                    } catch (msgError) {
                        console.error('[MRT Cron] 취소 처리 중 오류:', msgError);
                        errors++;
                    }
                }
            }

        } finally {
            await client.logout();
        }

        return NextResponse.json({
            success: true,
            pendingProcessed,
            confirmedProcessed,
            cancelProcessed,
            mergedIntoExisting,
            cancelUnmatched,
            slackAlertsSent,
            errors,
            timestamp: new Date().toISOString(),
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[MRT Cron] 전체 오류:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * IMAP에서 특정 키워드가 제목에 포함된 UNSEEN 이메일 검색
 */
async function searchEmails(
    client: ImapFlow,
    subjectKeyword: string
): Promise<Array<{ uid: number; subject: string; html: string }>> {
    const results: Array<{ uid: number; subject: string; html: string }> = [];

    // IMAP SEARCH: 미처리 + FROM myrealtrip + SUBJECT 키워드 + 최근 2일 이내 (시간대 차이 고려)
    const uids = await client.search({
        unKeyword: PROCESSED,
        from: 'myrealtrip',
        subject: subjectKeyword,
        since: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 최근 2일
    }, { uid: true });

    if (!uids || uids.length === 0) return results;

    for (const uid of uids) {
        try {
            const message = await client.fetchOne(String(uid), {
                source: true,
            }, { uid: true });

            if (!message || !message.source) continue;

            const source = message.source.toString();

            // 이메일 소스에서 HTML 본문 추출
            const parsedMail = await simpleParser(source);
            const subject = parsedMail.subject || message.envelope?.subject || '';
            const html = parsedMail.html || parsedMail.textAsHtml || source;

            results.push({ uid, subject, html });
        } catch (fetchError) {
            console.error(`[MRT Cron] UID ${uid} fetch 실패:`, fetchError);
        }
    }

    return results;
}

/**
 * 옵션명에서 인원 유형 추출
 * "성인, 거북이 스노클링+해양 액티비티" → "성인 1명"
 * "아동, 거북이 스노클링+해양 액티비티" → "아동 1명"
 */
function extractPaxFromOption(optionName: string): string {
    if (!optionName) return '1명';
    const lower = optionName.toLowerCase();
    if (lower.includes('성인') && lower.includes('아동')) return '성인+아동';
    if (lower.includes('아동')) return '아동 1명';
    if (lower.includes('성인')) return '성인 1명';
    return '1명';
}
