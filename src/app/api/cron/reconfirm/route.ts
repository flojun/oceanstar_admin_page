import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { bookingVars, sendAlimtalk } from '@/lib/alimtalk';
import { pickupTime } from '@/lib/voucherFiles';

/**
 * 내일 투어 리컨펌 알림톡. 하루 1회, 하와이 17시(UTC 03:00).
 * 홈페이지 예약만 보낸다 — OTA 손님은 OTA 가 따로 안내하고, 연락처가 손님 번호라는 보장도 없다.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 하와이 17시에 돌므로 24시간 뒤의 하와이 날짜가 "내일"이다
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: 'Pacific/Honolulu' });

    const { data: rows, error } = await supabaseServer
        .from('reservations')
        .select('id, order_id, name, tour_date, option, pax, pickup_location, contact')
        .eq('tour_date', tomorrow)
        .eq('status', '예약확정')
        .in('source', ['웹사이트', '웹사이트(EN)'])
        .not('contact', 'is', null);

    if (error) {
        console.error('[reconfirm] 예약 조회 실패:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = { date: tomorrow, checked: rows?.length ?? 0, sent: 0, skipped: 0, failed: 0 };
    for (const r of rows ?? []) {
        try {
            const time = await pickupTime(r.pickup_location ?? '', r.option ?? '');
            const sent = await sendAlimtalk(r.contact!, process.env.SOLAPI_TPL_RECONFIRM, {
                ...bookingVars(r),
                픽업시간: time ?? '바우처 시간표 참고',
            });
            if (sent) result.sent++; else result.skipped++;
        } catch (err) {
            console.error('[reconfirm] 발송 실패:', r.order_id, err);
            result.failed++;
        }
    }

    return NextResponse.json(result);
}
