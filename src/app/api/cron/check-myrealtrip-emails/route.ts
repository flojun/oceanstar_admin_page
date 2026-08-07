import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { parseMyRealTripEmail } from '@/lib/myrealTripEmailParser';
import { isUrgentTourDate } from '@/lib/reservationUrgency';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';
import { getHawaiiDateStr , getReceiptDateStr } from '@/lib/timeUtils';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * 마이리얼트립 이메일 자동 수집 Cron Job
 * - 5분마다 Gmail IMAP에 접속하여 UNSEEN 이메일 검색
 * - [확정대기] → reservations INSERT (예약대기)
 * - [확정완료] → reservations UPDATE (예약확정)
 * - 당일/전날 투어이면 Discord 긴급 알림 발송
 */
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
        let discordAlertsSent = 0;
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
                        await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
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
                            receipt_date: getReceiptDateStr(),
                            is_admin_checked: false,
                        });

                    if (insertError) {
                        console.error(`[MRT Cron] INSERT 실패:`, insertError);
                        errors++;
                        continue;
                    }

                    pendingProcessed++;

                    // 긴급 판단 → Discord 알림
                    if (isUrgentTourDate(reservation.tourDate)) {
                        const sent = await sendDiscordUrgentAlert({
                            title: '🚨 [확정대기] 마이리얼트립 긴급 예약!',
                            customerName: reservation.travelerName,
                            tourDate: reservation.tourDate,
                            option: reservation.optionName,
                            source: '마이리얼트립',
                            orderNumber: reservation.orderNumber,
                        });
                        if (sent) discordAlertsSent++;
                    }

                    // 이메일 SEEN 처리
                    await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });

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
                        // UPDATE (예약확정)
                        if (existing.status !== '예약확정') {
                            const { error: updateError } = await supabaseServer
                                .from('reservations')
                                .update({ status: '예약확정' })
                                .eq('id', existing.id);

                            if (updateError) {
                                console.error(`[MRT Cron] UPDATE 실패:`, updateError);
                                errors++;
                                continue;
                            }
                        }
                    } else {
                        // 확정대기를 놓친 경우 → INSERT (예약확정)
                        const { error: insertError } = await supabaseServer
                            .from('reservations')
                            .insert({
                                order_id: reservation.orderNumber,
                                name: reservation.travelerName,
                                tour_date: reservation.tourDate,
                                source: 'M',
                                status: '예약확정',
                                receipt_date: getReceiptDateStr(),
                                is_admin_checked: false,
                            });

                        if (insertError) {
                            console.error(`[MRT Cron] 확정완료 INSERT 실패:`, insertError);
                            errors++;
                            continue;
                        }
                    }

                    confirmedProcessed++;

                    // 긴급 판단 → Discord 알림
                    if (isUrgentTourDate(reservation.tourDate)) {
                        const sent = await sendDiscordUrgentAlert({
                            title: '🚨 [확정완료] 마이리얼트립 예약 확정!',
                            customerName: reservation.travelerName,
                            tourDate: reservation.tourDate,
                            option: reservation.optionName,
                            source: '마이리얼트립',
                            orderNumber: reservation.orderNumber,
                        });
                        if (sent) discordAlertsSent++;
                    }

                    // 이메일 SEEN 처리
                    await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });

                } catch (msgError) {
                    console.error(`[MRT Cron] 확정완료 처리 중 오류:`, msgError);
                    errors++;
                }
            }

        } finally {
            await client.logout();
        }

        return NextResponse.json({
            success: true,
            pendingProcessed,
            confirmedProcessed,
            discordAlertsSent,
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

    // IMAP SEARCH: UNSEEN + FROM myrealtrip + SUBJECT 키워드 + 최근 2일 이내 (시간대 차이 고려)
    const uids = await client.search({
        seen: false,
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
