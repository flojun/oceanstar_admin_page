import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { isUrgentTourDate } from '@/lib/reservationUrgency';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';

/**
 * Supabase Database Webhook에서 호출되는 API 라우트 (Track 1)
 * reservations INSERT/UPDATE 시 긴급 예약(당일/전날 투어)이면 Discord 알림 발송
 *
 * Supabase DB Webhook payload 형식:
 * { type: "INSERT" | "UPDATE", record: {...}, old_record: {...} | null }
 */
export async function POST(request: Request) {
    try {
        // 시크릿 검증
        const webhookSecret = request.headers.get('x-webhook-secret');
        if (process.env.DB_WEBHOOK_SECRET && webhookSecret !== process.env.DB_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await request.json();
        const { type, record, old_record: oldRecord } = payload;

        if (!record) {
            return NextResponse.json({ error: 'No record in payload' }, { status: 400 });
        }

        // 발송 조건 체크
        // 1. status가 '예약확정'이어야 함
        if (record.status !== '예약확정') {
            return NextResponse.json({ skipped: true, reason: 'status is not 예약확정' });
        }

        // 2. 이전 status가 '예약확정'이 아니어야 함 (신규 확정 전이)
        //    INSERT의 경우 old_record가 null이므로 조건 자동 충족
        if (oldRecord && oldRecord.status === '예약확정') {
            return NextResponse.json({ skipped: true, reason: 'already 예약확정' });
        }

        // 3. 긴급 투어일인지 확인 (오늘/내일)
        if (!isUrgentTourDate(record.tour_date)) {
            return NextResponse.json({ skipped: true, reason: 'not urgent tour date' });
        }

        // 4. 이미 알림 발송했는지 확인
        if (record.urgent_alert_sent) {
            return NextResponse.json({ skipped: true, reason: 'alert already sent' });
        }

        // Discord 긴급 알림 발송
        const sourceLabel = getSourceLabel(record.source);
        const sent = await sendDiscordUrgentAlert({
            title: '🚨 긴급 예약 확정! (당일/전날)',
            customerName: record.name || '미확인',
            tourDate: record.tour_date || '미확인',
            option: record.option || '미확인',
            pax: record.pax || '',
            source: sourceLabel,
            orderNumber: record.order_id || '',
            pickupLocation: record.pickup_location || '',
        });

        if (sent) {
            // urgent_alert_sent = true 업데이트
            await supabaseServer
                .from('reservations')
                .update({ urgent_alert_sent: true })
                .eq('id', record.id);
        }

        return NextResponse.json({
            success: true,
            alertSent: sent,
            orderNumber: record.order_id,
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Discord Webhook API] 오류:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * source 코드를 한글 라벨로 변환
 */
function getSourceLabel(source: string): string {
    const labels: Record<string, string> = {
        'm': '마이리얼트립',
        'z': '줌줌투어',
        't': '트리플',
        'w': '와그',
        'v': '비아터',
        '웹사이트': '자체 웹사이트',
        '웹사이트(EN)': '자체 웹사이트(EN)',
    };
    return labels[source] || source || '기타';
}
