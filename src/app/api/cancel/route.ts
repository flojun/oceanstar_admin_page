import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, booker_name } = body;

        if (!order_id || !booker_name) {
            return NextResponse.json({ error: '예약 번호(6자리)와 예약자명을 모두 입력해주세요.' }, { status: 400 });
        }

        const normalizedOrderId = order_id.trim().toUpperCase();
        const normalizedBookerName = booker_name.trim();

        // 1. 예약 조회 (주문번호와 예약자명 동시 일치 검증)
        const { data: reservation, error: fetchError } = await supabase
            .from('reservations')
            .select('id, status, name')
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

        // 3. 상태 업데이트 ('취소요청')
        const { error: updateError } = await supabase
            .from('reservations')
            .update({ status: '취소요청' })
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
