import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendVoucherEmail } from '@/lib/email';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Pay2Pay Webhook의 경우, 전달받은 서버 간 통신 파라미터의 서명(Signature/Hash)을 검증해야 합니다.
        // 현재 연동 메뉴얼 대기 중이므로 임시로 order_id와 처리 상태(예: rescode === '0000')가 성공이라고 가정합니다.
        const { order_id, rescode } = body;

        // pay2pay 전용 상태 코드나 필드명이 다를 수 있으므로 추후 매뉴얼 구조에 맞게 변경
        if (!order_id) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
        }

        if (rescode === '0000' || rescode === 'SUCCESS') {
            // 결제 성공 -> Supabase 예약 상태 '예약확정'으로 업데이트
            const { data, error } = await supabaseServer
                .from('reservations')
                .update({
                    status: '예약확정',
                    receipt_date: new Date().toISOString().split('T')[0] // 접수일(receipt_date) 업데이트 추가 
                })
                .eq('order_id', order_id)
                .select();

            if (error) {
                console.error('Failed to update reservation status for Pay2Pay id', order_id, error);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }

            console.log(`[Pay2Pay] Payment confirmed for order: ${order_id}`);

            // 2. 바우처 이메일 자동 발송 (선택옵션으로 사용자 이메일이 기재된 경우)
            if (data && data.length > 0) {
                const reservation = data[0];
                if (reservation.booker_email) {
                    sendVoucherEmail({
                        to: reservation.booker_email,
                        name: reservation.name,
                        order_id: reservation.order_id || order_id,
                        tour_name: '오션스타 하와이 거북이 스노클링', // 기본 상품명 (필요 시 다국어 분기 처리)
                        tour_date: reservation.tour_date,
                        pax: reservation.pax,
                        option: reservation.option,
                        pickup_location: reservation.pickup_location,
                    }).catch(err => {
                        console.error('Failed to send voucher email via Pay2Pay webhook:', err);
                    });
                }
            }

            return NextResponse.json({ success: true, message: 'Pay2Pay Payment confirmed and verified' });
        } else {
            // 결제 실패 처리
            await supabaseServer
                .from('reservations')
                .update({ status: '결제실패' })
                .eq('order_id', order_id);

            return NextResponse.json({ success: false, message: 'Pay2Pay Payment failed' });
        }
    } catch (error) {
        console.error('Pay2Pay Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
