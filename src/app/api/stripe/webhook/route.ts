import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripeClient, createReservationFromSession } from '@/lib/stripeBooking';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';
import { fromMinor } from '@/lib/money';

/**
 * Stripe -> server notification, independent of the customer's browser.
 *
 * The success page also calls createReservationFromSession, but it only runs
 * if the customer actually lands on it. This webhook is what guarantees a
 * paid booking is stored even when they close the tab or the redirect fails.
 */
export async function POST(req: Request) {
    if (!stripeClient) {
        return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        console.error('STRIPE_WEBHOOK_SECRET is not set - refusing to trust the payload');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event;
    try {
        // constructEvent needs the exact raw body, so read it as text.
        const rawBody = await req.text();
        event = stripeClient.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 환불은 즉시 끝나지 않는다. 손님 카드에 반영되기까지 은행에 따라
    // 5~10 영업일이 걸리고 실패할 수도 있다.
    if (event.type === 'charge.refunded') {
        return handleChargeRefunded(event.data.object as Stripe.Charge);
    }
    if (event.type === 'refund.failed') {
        return handleRefundFailed(event.data.object as Stripe.Refund);
    }

    if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
        return NextResponse.json({ received: true, ignored: event.type });
    }

    try {
        // The event payload omits metadata on some API versions, so re-read it.
        // payment_intent 를 펼쳐야 캡처 전(requires_capture) 상태를 판별할 수 있다.
        const session = await stripeClient.checkout.sessions.retrieve(
            (event.data.object as { id: string }).id,
            { expand: ['payment_intent'] }
        );

        const result = await createReservationFromSession(session);
        if (!result.ok) {
            // Non-2xx makes Stripe retry, which is what we want for a DB failure.
            console.error('Stripe webhook could not store booking:', result.error);
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        if (result.created) {
            console.log(`[Stripe webhook] stored booking ${result.order_id}`);
        }
        return NextResponse.json({ received: true, order_id: result.order_id, created: result.created });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * 환불 완료. 관리자가 Stripe 대시보드에서 직접 환불한 것도 여기로 들어오므로
 * 우리 화면이 저절로 동기화된다.
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!paymentIntentId) {
        return NextResponse.json({ received: true, ignored: 'charge without payment_intent' });
    }

    const refunded = fromMinor(charge.amount_refunded, charge.currency);
    const fullyRefunded = charge.amount_refunded >= charge.amount_captured;

    const { error } = await supabaseServer
        .from('reservations')
        .update({
            refunded_amount: refunded,
            ...(fullyRefunded ? { status: '취소' } : {}),
        })
        .eq('payment_intent_id', paymentIntentId);

    if (error) {
        console.error('[stripe webhook] charge.refunded 반영 실패:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ received: true, payment_intent: paymentIntentId, refunded });
}

/**
 * 환불 실패. 손님은 환불받은 줄 아는데 돈이 안 돌아간 상태다.
 * 방치하면 그대로 분쟁(dispute)으로 간다.
 */
async function handleRefundFailed(refund: Stripe.Refund) {
    const paymentIntentId = typeof refund.payment_intent === 'string'
        ? refund.payment_intent
        : refund.payment_intent?.id;

    const { data: rows } = paymentIntentId
        ? await supabaseServer
            .from('reservations')
            .select('id, order_id, name, tour_date, option, source, pickup_location, note')
            .eq('payment_intent_id', paymentIntentId)
        : { data: null };

    const row = rows?.[0];
    const amount = fromMinor(refund.amount, refund.currency);
    const detail = refund.failure_reason || '사유 미상';

    if (row) {
        const note = `${row.note || ''} [환불실패: ${new Date().toISOString().slice(0, 10)} / 금액: ${amount} ${refund.currency.toUpperCase()} / 사유: ${detail}]`.trim();
        await supabaseServer.from('reservations').update({ note }).eq('id', row.id);
    }

    await sendDiscordUrgentAlert({
        title: '🚨 [환불 실패] 고객에게 돈이 돌아가지 않았습니다',
        customerName: row?.name || '미확인',
        tourDate: row?.tour_date || '미확인',
        option: `환불액 ${amount} ${refund.currency.toUpperCase()} / 사유: ${detail}`,
        source: row?.source || 'Stripe',
        orderNumber: row?.order_id ?? undefined,
        pickupLocation: row?.pickup_location ?? undefined,
    }).catch(() => { /* 알림 실패로 웹훅을 실패시키지 않는다 */ });

    return NextResponse.json({ received: true, refund: refund.id, failure_reason: detail });
}
