import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendVoucherEmail } from '@/lib/email';

// apiVersion 을 고정하지 않는다. SDK 가 자기 기본 버전을 쓰게 두면 타입이
// 런타임과 맞아떨어진다. 한국 결제수단(kakao_pay 등)의 capture_method 는
// 2024-11-20 이상에서만 존재하므로 옛 버전 고정으로는 쓸 수 없다.
export const stripeClient = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
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

    // 수동 캡처를 쓰면 캡처 전까지 session.payment_status 가 'unpaid' 로 남는다.
    // 'paid' 만 통과시키면 승인은 됐는데 예약이 안 만들어지고 바우처도 안 나간다.
    // 돈이 확보된 상태인지는 PaymentIntent 로 판단한다.
    const paymentIntent = typeof session.payment_intent === 'object' ? session.payment_intent : null;
    const authorizedOnly = paymentIntent?.status === 'requires_capture';
    const captured = session.payment_status === 'paid';

    if (!captured && !authorizedOnly) {
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
        // 환불/캡처의 유일한 연결 고리. 없으면 나중에 이 예약을 환불할 방법이 없다.
        payment_intent_id: paymentIntent?.id ?? (typeof session.payment_intent === 'string' ? session.payment_intent : null),
        captured_at: captured ? new Date().toISOString() : null,
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
