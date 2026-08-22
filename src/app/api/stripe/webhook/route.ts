import { NextResponse } from 'next/server';
import { stripeClient, createReservationFromSession } from '@/lib/stripeBooking';

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

    if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
        return NextResponse.json({ received: true, ignored: event.type });
    }

    try {
        // The event payload omits metadata on some API versions, so re-read it.
        const session = await stripeClient.checkout.sessions.retrieve(
            (event.data.object as { id: string }).id
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
