import { NextResponse } from 'next/server';
import { stripeClient, createReservationFromSession } from '@/lib/stripeBooking';

export async function POST(req: Request) {
    if (!stripeClient) {
        return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }
    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: '세션 ID가 없습니다.' }, { status: 400 });
        }

        const session = await stripeClient.checkout.sessions.retrieve(session_id);
        if (!session) {
            return NextResponse.json({ error: '유효하지 않은 결제 세션입니다.' }, { status: 404 });
        }

        const result = await createReservationFromSession(session);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            order_id: result.order_id,
            status: result.status,
        });
    } catch (error) {
        console.error('Verify Session Error:', error);
        const message = error instanceof Error ? error.message : '서버 오류';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
