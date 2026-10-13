import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { supabaseServer } from '@/lib/supabaseServer';
import { imapAccounts, openAllMail } from '@/lib/imapAccounts';
import { parseOtaEmail, isCustomerMessageSubject, OTA_FROM, OTA_LABEL, OTA_SUBJECT, type OtaPlatform } from '@/lib/otaEmailParser';
import { parseMyRealTripEmail, detectEmailType } from '@/lib/myrealTripEmailParser';
import {
    BOOKING_LABELS, checkMrtReservation, checkOtaBooking, looksLikeMissedBookingSubject, missingLabels,
    type AuditPlatform,
} from '@/lib/emailFormatAudit';
import { sendDiscordReport } from '@/lib/discordWebhook';

/**
 * 예약 메일 형식 점검 — 매일 하와이 06:00 (UTC 16:00).
 *
 * 지난 24시간 동안 각 플랫폼에서 온 메일을 **읽기 전용으로** 다시 열어 본다.
 * 처리 표식·읽음 상태는 건드리지 않는다. 수집 cron 과 같은 파서를 그대로 돌려서
 *   ① 신규 예약 메일에 있어야 할 칸이 그대로 있는지 (양식 변경)
 *   ② 읽어 낸 값이 말이 되는지 (예약번호 형식, 날짜, 인원, 부, 픽업·이름 자리에 상품명)
 *   ③ 신규 예약이 DB 에 들어와 있는지
 *   ④ 수집 cron 의 제목 검색에 안 걸리는 예약 관련 메일이 있는지 (제목 변경)
 * 를 보고 Discord 로 보고한다. 문제가 없어도 "이상 없음" 을 한 줄 보내서 점검이 돌았다는 걸 남긴다.
 */
export const maxDuration = 60;

const PLATFORMS: OtaPlatform[] = ['klook', 'gyg', 'viator', 'yeogi', 'triple', 'zoomzoom'];
const MRT_SUBJECTS = ['확정대기', '확정완료', '예약취소', '취소 요청 접수'];
const LABEL: Record<AuditPlatform, string> = { myrealtrip: '마이리얼트립', ...OTA_LABEL };
const WINDOW_MS = 24 * 60 * 60 * 1000;
/** 막 도착한 메일은 수집 cron 이 아직 못 돌았을 수 있다. DB 대조는 이보다 오래된 메일만. */
const DB_GRACE_MS = 30 * 60 * 1000;

type Mail = { subject: string; html: string; from: string; receivedAt: Date };

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = imapAccounts();
    if (accounts.length === 0) {
        return NextResponse.json({ error: 'Email credentials not configured' }, { status: 500 });
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);
    const checked: Record<AuditPlatform, number> = { myrealtrip: 0, klook: 0, gyg: 0, viator: 0, yeogi: 0, triple: 0, zoomzoom: 0 };
    const problems: string[] = [];
    const seen = new Set<string>();   // 두 메일함에 같은 메일이 있으면 한 번만 본다
    const note = (p: AuditPlatform, ref: string, what: string) => problems.push(`[${LABEL[p]}] ${ref} — ${what}`);

    for (const account of accounts) {
        const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: account, logger: false });
        try {
            await client.connect();
            await openAllMail(client, { readOnly: true });

            for (const platform of ['myrealtrip', ...PLATFORMS] as AuditPlatform[]) {
                const from = platform === 'myrealtrip' ? 'myrealtrip' : OTA_FROM[platform];
                const subjects = platform === 'myrealtrip' ? MRT_SUBJECTS : OTA_SUBJECT[platform];
                const { cronMails, otherSubjects } = await collect(client, from, subjects, windowStart, seen);

                // ④ 제목이 바뀌어 수집 cron 이 못 보는 예약 메일
                for (const subject of otherSubjects) {
                    if (looksLikeMissedBookingSubject(subject)) note(platform, `"${subject.slice(0, 80)}"`, '수집 cron 의 제목 검색에 안 걸리는 예약 관련 메일');
                }

                for (const mail of cronMails) {
                    checked[platform]++;
                    const old = now.getTime() - mail.receivedAt.getTime() > DB_GRACE_MS;
                    const ref = mail.subject.match(/EXP-\d{8}-\d{8}|BR-\d+|GYG[A-Z0-9]{6,}|[A-Z]{3}\d{6}|\d{6,}/)?.[0] || `"${mail.subject.slice(0, 60)}"`;

                    // ① 칸 이름
                    if (BOOKING_LABELS[platform].subject.test(mail.subject)) {
                        const missing = missingLabels(mail.html, BOOKING_LABELS[platform].labels);
                        if (missing.length) note(platform, ref, `양식 변경 의심: ${missing.map((m) => `'${m}'`).join(', ')} 칸이 없음`);
                    }

                    if (platform === 'myrealtrip') {
                        const parsed = parseMyRealTripEmail(mail.html, mail.subject);
                        if (!parsed) {
                            if (detectEmailType(mail.subject)) note(platform, ref, '메일을 읽지 못함');
                            continue;
                        }
                        // ② 값
                        for (const p of checkMrtReservation(parsed, now)) note(platform, ref, p);
                        // ③ DB — 1인당 번호는 다른 행의 note 에 "[동일 예약 합침: …]" 로 붙어 있을 수 있다
                        if ((parsed.type === 'pending' || parsed.type === 'confirmed') && old) {
                            const num = parsed.reservation.orderNumber;
                            const { count } = await supabaseServer.from('reservations')
                                .select('id', { count: 'exact', head: true })
                                .or(`order_id.eq.${num},note.ilike.%${num}%`);
                            if (!count) note(platform, num, `DB 에 없음 (${parsed.reservation.travelerName} ${parsed.reservation.tourDate})`);
                        }
                        continue;
                    }

                    const booking = parseOtaEmail(mail.html, mail.subject, mail.from);
                    if (!booking) {
                        // 인증번호·독촉·메시지처럼 원래 못 읽는 메일은 빼고, 예약 메일인데 못 읽은 것만
                        if (!isCustomerMessageSubject(mail.subject) && looksLikeMissedBookingSubject(mail.subject)) {
                            note(platform, ref, '예약 메일로 보이는데 읽지 못함');
                        }
                        continue;
                    }
                    for (const p of checkOtaBooking(booking, now)) note(platform, booking.orderId || ref, p);
                    if (booking.kind === 'new' && old) {
                        const { count } = await supabaseServer.from('reservations')
                            .select('id', { count: 'exact', head: true })
                            .eq('order_id', booking.orderId);
                        if (!count) note(platform, booking.orderId, `DB 에 없음 (${booking.name} ${booking.tourDate})`);
                    }
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`[Email Audit] ${account.user} 점검 실패:`, message);
            problems.push(`[메일함] ${account.user} 접속/조회 실패 — ${message}`);
        } finally {
            await client.logout().catch(() => { });
        }
    }

    const counts = (Object.keys(checked) as AuditPlatform[])
        .filter((p) => checked[p] > 0)
        .map((p) => `${LABEL[p]} ${checked[p]}`)
        .join(' · ') || '지난 24시간 예약 메일 없음';

    const ok = problems.length === 0;
    await sendDiscordReport({
        ok,
        title: ok ? '✅ 예약 메일 형식 점검: 이상 없음' : `⚠️ 예약 메일 형식 점검: 확인할 것 ${problems.length}건`,
        description: ok
            ? `지난 24시간 점검한 메일: ${counts}`
            : `${problems.map((p) => `• ${p}`).join('\n')}\n\n점검한 메일: ${counts}`,
    });

    return NextResponse.json({ success: true, ok, checked, problems, timestamp: now.toISOString() });
}

/**
 * 한 발신자의 지난 24시간 메일을 모은다.
 * 수집 cron 과 똑같은 (발신자 + 제목) 검색에 걸리는 메일은 본문까지, 안 걸리는 메일은 제목만.
 * 처리 표식 여부는 보지 않는다(이미 처리한 메일을 다시 읽는 것이 목적이다).
 */
async function collect(client: ImapFlow, from: string, subjects: string[], windowStart: Date, seen: Set<string>) {
    // IMAP SINCE 는 날짜 단위라 하루 앞에서 찾고, 도착 시각으로 다시 거른다.
    const since = new Date(windowStart.getTime() - 24 * 60 * 60 * 1000);
    const all = new Set<number>((await client.search({ from, since }, { uid: true })) || []);
    const cronUids = new Set<number>();
    for (const subject of subjects) {
        for (const uid of (await client.search({ from, subject, since }, { uid: true })) || []) cronUids.add(uid);
    }

    const cronMails: Mail[] = [];
    const otherSubjects: string[] = [];
    for (const uid of [...all].sort((a, b) => a - b)) {
        const inCron = cronUids.has(uid);
        const msg = await client.fetchOne(String(uid), { envelope: true, internalDate: true, source: inCron }, { uid: true });
        if (!msg) continue;
        const receivedAt = new Date(msg.internalDate ?? msg.envelope?.date ?? 0);
        if (receivedAt < windowStart) continue;

        const key = msg.envelope?.messageId || `${from}:${uid}:${receivedAt.toISOString()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!inCron || !msg.source) {
            otherSubjects.push(msg.envelope?.subject || '');
            continue;
        }
        const parsed = await simpleParser(msg.source);
        cronMails.push({
            subject: parsed.subject || msg.envelope?.subject || '',
            html: parsed.html || parsed.textAsHtml || msg.source.toString(),
            from: parsed.from?.text || from,
            receivedAt,
        });
    }
    return { cronMails, otherSubjects };
}
