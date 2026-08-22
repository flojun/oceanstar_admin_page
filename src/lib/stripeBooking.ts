import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendVoucherEmail } from '@/lib/email';

export const stripeClient = process.env.STRIPE_SECRET_KEY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK types apiVersion as its own pinned literal; this integration is on 2023-10-16
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
    : null;

/**
 * Turns a paid Checkout Session into reservation row(s).
 *
 * Idempotent: returns early if the order_id already exists, so the browser
 * success page and the Stripe webhook can both call it for the same session
 * without creating duplicates. Whichever arrives first wins.
 */
export async function createReservationFromSession(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata || !metadata.order_id) {
        return { ok: false as const, status: 400, error: '메타데이터가 누락되었습니다.' };
    }

    const order_id = metadata.order_id;

    const { data: existing } = await supabaseServer
        .from('reservations')
        .select('order_id')
        .eq('order_id', order_id)
        .single();

    if (session.payment_status !== 'paid') {
        return { ok: true as const, order_id, created: false, status: session.payment_status };
    }

    if (existing) {
        // Already stored - just make sure a pending row gets confirmed.
        await supabaseServer
            .from('reservations')
            .update({ status: '예약확정' })
            .eq('order_id', order_id)
            .neq('status', '예약확정');
        return { ok: true as const, order_id, created: false, status: session.payment_status };
    }

    const baseRow = {
        order_id,
        source: metadata.source,
        name: metadata.name,
        contact: metadata.contact,
        tour_date: metadata.tour_date,
        option: metadata.option,
        pax: metadata.pax,
        note: metadata.note,
        pickup_location: metadata.pickup_location,
        status: '예약확정',
        total_price: Number(metadata.total_price),
        booker_email: metadata.booker_email,
        adult_count: Number(metadata.adult_count),
        child_count: Number(metadata.child_count),
        currency: metadata.currency,
        receipt_date: metadata.receipt_date,
    };

    const insertRows = [];
    if (metadata.combo_option) {
        const comboSuffix = metadata.combo_option === '1' ? '패러' : metadata.combo_option === '2' ? '제트' : '패러및제트';
        const timeOptionLabel = metadata.combo_time_option === 'morning1' ? '1부' : metadata.combo_time_option === 'morning2' ? '2부' : '거북이 스노클링';
        insertRows.push({
            ...baseRow,
            option: timeOptionLabel,
            note: `${metadata.note} [거북이+${comboSuffix} 콤보]`,
        });
        insertRows.push({
            ...baseRow,
            tour_date: metadata.secondary_date,
            option: comboSuffix,
            pickup_location: metadata.secondary_pickup || metadata.pickup_location,
            note: `${metadata.note} [거북이+${comboSuffix} 콤보]`,
        });
    } else {
        insertRows.push(baseRow);
    }

    const { data: inserted, error: insertError } = await supabaseServer
        .from('reservations')
        .insert(insertRows)
        .select();

    if (insertError) {
        console.error('Supabase Insert Error after payment:', order_id, insertError);
        return { ok: false as const, status: 500, error: 'DB 저장 중 오류 발생' };
    }

    const reservation = inserted?.[0];
    if (reservation?.booker_email) {
        sendVoucherEmail({
            to: reservation.booker_email,
            name: reservation.name,
            order_id: reservation.order_id,
            tour_name: 'OceanStar Hawaii Turtle Snorkeling',
            tour_date: reservation.tour_date,
            pax: reservation.pax,
            option: reservation.option,
            pickup_location: reservation.pickup_location,
        }).catch(err => {
            console.error('Failed to send voucher email:', order_id, err);
        });
    }

    return { ok: true as const, order_id, created: true, status: session.payment_status };
}
