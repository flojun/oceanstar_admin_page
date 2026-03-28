import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { differenceInHours } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, booker_name, reason } = body;

        if (!order_id || !booker_name) {
            return NextResponse.json({ error: '예약 번호(6자리)와 예약자명을 모두 입력해주세요.' }, { status: 400 });
        }

        const normalizedOrderId = order_id.trim().toUpperCase();
        const normalizedBookerName = booker_name.trim();

        // 1. 예약 조회 (주문번호와 예약자명 동시 일치 검증)
        const { data: reservation, error: fetchError } = await supabaseServer
            .from('reservations')
            .select('id, status, name, note, tour_date, total_price, currency')
            .eq('order_id', normalizedOrderId)
            .ilike('name', normalizedBookerName)
            .single();

        if (fetchError || !reservation) {
            if (fetchError?.code === 'PGRST116') {
                return NextResponse.json({ error: '일치하는 예약 정보가 없습니다. 예약 번호와 성함을 다시 확인해주세요.' }, { status: 404 });
            }
            console.error('Failed to fetch reservation for cancellation:', fetchError);
            return NextResponse.json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
        }

        // 2. 이미 취소/환불/취소요청 진행 중인 상태인지 확인
        const nonCancellableStatuses = ['취소요청', '취소', '환불'];
        if (nonCancellableStatuses.includes(reservation.status)) {
            return NextResponse.json({ 
                error: `해당 예약은 현재 '${reservation.status}' 상태이므로, 중복 접수할 수 없습니다.` 
            }, { status: 400 });
        }

        // 3. 환불 금액 및 상태 업데이트 ('취소요청')
        let expectedRefund = null;
        let diffHours = 0;
        let refundPhrase = "취소/환불 불가 (2일 이내 및 당일)";

        if (reservation.tour_date && typeof reservation.total_price === 'number') {
            const hawaiiTimeZone = 'Pacific/Honolulu';
            const now = new Date();
            const nowHawaii = toZonedTime(now, hawaiiTimeZone); // 현재 하와이 벽시계 시간
            
            const [y, m, d] = reservation.tour_date.split('-').map(Number);
            const tourStartHawaii = new Date(y, m - 1, d, 0, 0, 0); // 투어 당일 00:00

            diffHours = differenceInHours(tourStartHawaii, nowHawaii);

            let refundRate = 0;
            if (diffHours >= 168) { // 7일 전 (24 * 7)
                refundRate = 1;
                refundPhrase = "전액 환불 (7일 전 접수)";
            } else if (diffHours >= 72) { // 3일 전 (24 * 3)
                refundRate = 0.5;
                refundPhrase = "50% 공제 후 환불 (6~3일 전 접수)";
            }

            // 부동소수점 오차 방지 (센트 단위 반올림 후 저장)
            expectedRefund = Math.round(reservation.total_price * refundRate * 100) / 100;
        }

        const reasonText = reason ? `\n\n[고객 취소 사유]\n${reason}` : '';
        const systemCalcText = expectedRefund !== null 
            ? `\n\n[시스템 자동 계산]\n취소시점: 하와이 투어까지 ${diffHours}시간 전\n적용규정: ${refundPhrase}` 
            : '';
            
        const newNote = (reservation.note || '') + reasonText + systemCalcText;

        const { error: updateError } = await supabaseServer
            .from('reservations')
            .update({ 
                status: '취소요청', 
                note: newNote.trim(),
                expected_refund: expectedRefund
            })
            .eq('id', reservation.id);

        if (updateError) {
            console.error('Failed to update reservation status for cancellation:', updateError);
            return NextResponse.json({ error: '취소 요청 처리 중 오류가 발생했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: '취소 요청이 성공적으로 접수되었습니다. 관리자 확인 후 처리됩니다.' });
        
    } catch (error) {
        console.error('Cancel Request Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
