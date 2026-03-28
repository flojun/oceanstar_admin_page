import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { differenceInHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, booker_email, new_date, new_pickup } = body;

        // 1. 필수 값 검증
        if (!order_id || !booker_email || !new_date || !new_pickup) {
            return NextResponse.json({ error: '필수 값이 부족합니다. (order_id, booker_email, new_date, new_pickup)' }, { status: 400 });
        }

        const normalizedOrderId = order_id.trim().toUpperCase();

        // 2. 예약 내역 검증 및 조회
        const { data: reservation, error: fetchError } = await supabaseServer
            .from('reservations')
            .select('id, status, note, tour_date')
            .eq('order_id', normalizedOrderId)
            .ilike('booker_email', booker_email)
            .single();

        if (fetchError || !reservation) {
             return NextResponse.json({ error: '일치하는 예약 정보가 없거나 이메일이 다릅니다.' }, { status: 404 });
        }

        // 3. 72시간 엄격한 서버측 검증 로직 (date-fns-tz 기반)
        const hawaiiTimeZone = 'Pacific/Honolulu';
        const nowHawaii = toZonedTime(new Date(), hawaiiTimeZone);

        const [y, m, d] = reservation.tour_date.split('-').map(Number);
        const tourStartHawaii = new Date(y, m - 1, d, 0, 0, 0);

        const diffHours = differenceInHours(tourStartHawaii, nowHawaii);

        if (diffHours < 72) {
             return NextResponse.json({ 
                 error: '여행시작 당일 기준 2일 전부터는(72시간 이내) 온라인 시스템을 통한 일정 변경이 불가능합니다. 관리자(고객센터)에게 문의해 주시기 바랍니다.' 
             }, { status: 400 });
        }

        // 4. 상태 검증
        if (['취소요청', '취소', '환불'].includes(reservation.status)) {
             return NextResponse.json({ error: `해당 예약은 현재 '${reservation.status}' 상태라 일정을 변경할 수 없습니다.` }, { status: 400 });
        }

        // 5. 상태를 '변경요청'으로 업데이트하고 어드민 뷰 파싱을 위해 정형화된 Note 추가
        const rescheduleData = `\n\n[변경요청] <NewDate:${new_date}> <NewPickup:${new_pickup}>`;
        const newNote = (reservation.note || '') + rescheduleData;

        const { error: updateError } = await supabaseServer
            .from('reservations')
            .update({ status: '변경요청', note: newNote.trim() })
            .eq('id', reservation.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, message: '변경 요청이 성공적으로 접수되었습니다. 관리자 확인 후 최종 확정됩니다.' });

    } catch (e: any) {
        console.error('Reschedule Request API Error:', e);
        return NextResponse.json({ error: '접수 중 서버 오류가 발생했습니다. 잠시 후 시도해주세요.' }, { status: 500 });
    }
}
