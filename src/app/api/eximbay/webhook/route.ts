import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

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
                    receipt_date: new Date().toISOString().split('T')[0] // 접수일(receipt_date) 업데이트 추가 
                })
                .eq('order_id', order_id)
                .select();

            if (error) {
                console.error('Failed to update reservation status', error);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }

            console.log(`Payment confirmed for order: ${order_id}`);
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
