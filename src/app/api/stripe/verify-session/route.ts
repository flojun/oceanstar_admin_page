import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { session_id } = body;

        if (!session_id) {
            return NextResponse.json({ error: '세션 ID가 없습니다.' }, { status: 400 });
        }

        // 1. Stripe에서 세션 정보 가져오기
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (!session) {
            return NextResponse.json({ error: '유효하지 않은 결제 세션입니다.' }, { status: 404 });
        }

        const metadata = session.metadata;
        if (!metadata || !metadata.order_id) {
            return NextResponse.json({ error: '메타데이터가 누락되었습니다.' }, { status: 400 });
        }

        const order_id = metadata.order_id;

        // 2. 이미 해당 예약이 DB에 존재하는지 확인
        const { data: existingData } = await supabaseServer
            .from('reservations')
            .select('order_id')
            .eq('order_id', order_id)
            .single();

        // 3. 결제가 성공적으로 완료된 경우 DB에 저장 (없을 경우에만)
        if (session.payment_status === 'paid' && !existingData) {
            const { error: insertError } = await supabaseServer
                .from('reservations')
                .insert([
                    {
                        order_id: order_id,
                        source: metadata.source,
                        name: metadata.name,
                        contact: metadata.contact,
                        tour_date: metadata.tour_date,
                        option: metadata.option,
                        pax: metadata.pax,
                        note: metadata.note,
                        pickup_location: metadata.pickup_location,
                        status: '예약확정', // 결제가 완료되었으므로 바로 예약확정 처리
                        total_price: Number(metadata.total_price),
                        booker_email: metadata.booker_email,
                        adult_count: Number(metadata.adult_count),
                        child_count: Number(metadata.child_count),
                        currency: metadata.currency,
                        receipt_date: metadata.receipt_date,
                    }
                ]);

            if (insertError) {
                console.error('Supabase Insert Error after payment:', insertError);
                return NextResponse.json({ error: 'DB 저장 중 오류 발생' }, { status: 500 });
            }
        } else if (existingData && session.payment_status === 'paid') {
            // 이미 존재하는데 예약확정 상태가 아닐 경우 업데이트 할 수도 있습니다 (웹훅 등 중복 호출 대비)
            await supabaseServer
                .from('reservations')
                .update({ status: '예약확정' })
                .eq('order_id', order_id)
                .neq('status', '예약확정');
        }

        return NextResponse.json({ 
            success: true, 
            order_id: order_id,
            status: session.payment_status 
        });

    } catch (error: any) {
        console.error('Verify Session Error:', error);
        return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
    }
}
