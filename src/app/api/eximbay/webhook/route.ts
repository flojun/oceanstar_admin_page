import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendVoucherEmail } from '@/lib/email';

// Hawaii is UTC-10 with no DST
function getHawaiiDateStrServer(): string {
    const now = new Date();
    const hawaiiOffset = -10 * 60;
    const hawaiiDate = new Date((now.getTime() / 60000 + hawaiiOffset) * 60000);
    const y = hawaiiDate.getUTCFullYear();
    const m = String(hawaiiDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(hawaiiDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 실제 엑심베이 Webhook의 경우, 전달받은 파라미터의 해시(fgkey)를 검증해야 합니다.
        // 여기서는 로직 뼈대로서 order_id와 결제상태가 '0000'(성공)이라고 가정합니다.
        const { order_id, rescode } = body;

        if (!order_id) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
        }

        if (rescode === '0000') {
            // 결제 성공 -> Supabase 예약 상태 '예약확정'으로 업데이트 (기존 DB 구조)
            const { data, error } = await supabaseServer
                .from('reservations')
                .update({
                    status: '예약확정',
                    receipt_date: getHawaiiDateStrServer(), // 하와이 시간 기준 접수일
                })
                .eq('order_id', order_id)
                .select();

            if (error) {
                console.error('Failed to update reservation status', error);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }

            console.log(`Payment confirmed for order: ${order_id}`);

            // 바우처 이메일 발송 (이메일 주소가 있고 예약확정된 경우)
            if (data && data.length > 0) {
                const reservation = data[0];
                if (reservation.booker_email) {
                    sendVoucherEmail({
                        to: reservation.booker_email,
                        name: reservation.name,
                        order_id: reservation.order_id || order_id,
                        tour_name: '오션스타 하와이 거북이 스노클링', // 기본 상품명 (필요 시 DB 구조에 맞춰 변경)
                        tour_date: reservation.tour_date,
                        pax: reservation.pax,
                        option: reservation.option,
                        pickup_location: reservation.pickup_location,
                    }).catch(err => {
                        console.error('Failed to send voucher email:', err);
                    });
                }
            }

            return NextResponse.json({ success: true, message: 'Payment confirmed' });
        } else {
            // 결제 실패
            await supabaseServer
                .from('reservations')
                .update({ status: '결제실패' })
                .eq('order_id', order_id);

            return NextResponse.json({ success: false, message: 'Payment failed' });
        }
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
