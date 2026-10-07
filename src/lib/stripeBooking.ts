import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendVoucherEmail } from '@/lib/email';
import { isUrgentTourDate } from '@/lib/reservationUrgency';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';

// apiVersion 을 고정하지 않는다. SDK 가 자기 기본 버전을 쓰게 두면 타입이
// 런타임과 맞아떨어진다. 한국 결제수단(kakao_pay 등)의 capture_method 는
// 2024-11-20 이상에서만 존재하므로 옛 버전 고정으로는 쓸 수 없다.
export const stripeClient = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

/**
 * 결제 직후 예약 상태. 웹사이트 예약은 전부 '안내필요' 로 넣어 운영자가 한 번씩 연락하게 한다
 * (콤보의 패러세일링·서핑, 프라이빗은 시간·장소를 따로 맞춰야 하고, 나머지도 확인 연락을 한다).
 * 바우처 메일은 상태와 상관없이 그대로 나간다.
 *
 * ⚠️ 이 상태도 결제 캡처 대상이어야 한다 (`/api/cron/capture-pending`).
 *    빠지면 승인만 걸린 결제가 만료돼 돈을 못 받는다.
 */
const INITIAL_STATUS = '안내필요';

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
        // 결제 성공 페이지와 웹훅이 같은 세션을 두 번 처리한다. 두 번째에 상태를 덮어쓰면
        // '안내필요' 로 넣은 콤보·프라이빗이 바로 '예약확정' 이 되고, 취소한 예약도 되살아난다.
        // 결제 전 상태로 남아 있던 행만 확정한다.
        await supabaseServer
            .from('reservations')
            .update({ status: INITIAL_STATUS })
            .eq('order_id', order_id)
            .in('status', ['예약대기', '대기', '결제대기']);
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
        status: INITIAL_STATUS,
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
        // 서핑 콤보는 combo_option 'surf'. 서핑 행의 option '서핑' 이 tour_settings 이름
        // '거북이 스노클링 + 서핑' 에 부분 일치해 combo_surf 정원(자리 조회)으로 잡힌다.
        const isSurf = metadata.combo_option === 'surf';
        const comboSuffix = isSurf ? '서핑' : metadata.combo_option === '1' ? '패러' : metadata.combo_option === '2' ? '제트' : '패러및제트';
        const timeOptionLabel = metadata.combo_time_option === 'morning1' ? '1부' : metadata.combo_time_option === 'morning2' ? '2부' : '거북이 스노클링';
        const secondaryPickup = metadata.secondary_pickup || metadata.pickup_location;
        insertRows.push({
            ...baseRow,
            option: timeOptionLabel,
            note: `${metadata.note} [거북이+${comboSuffix} 콤보]`,
        });
        insertRows.push({
            ...baseRow,
            tour_date: metadata.secondary_date,
            option: comboSuffix,
            // 서핑 레슨 시간은 픽업 시간이다 (상세 "마지막 픽업 시간 기준"). 패러 행의 "카라이 (9:25)" 와 같은 모양
            pickup_location: isSurf && metadata.surf_time ? `${secondaryPickup} (${metadata.surf_time})` : secondaryPickup,
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

    // 당일·내일 예약 긴급 알림. 예전에는 행이 '예약확정' 으로 들어올 때 DB 웹훅
    // (/api/notifications/discord-urgent-reservation) 이 보냈는데 이제 '안내필요' 로 들어와서
    // 그 웹훅이 건너뛴다. 여기서 직접 보내고 urgent_alert_sent 를 세워, 운영자가 나중에
    // '예약확정' 으로 바꿀 때 웹훅이 한 번 더 울리지 않게 한다.
    if (reservation && isUrgentTourDate(reservation.tour_date)) {
        const sent = await sendDiscordUrgentAlert({
            title: '🚨 [안내필요] 웹사이트 긴급 예약! (당일/전날)',
            customerName: reservation.name || '미확인',
            tourDate: reservation.tour_date,
            option: reservation.option || '미확인',
            pax: reservation.pax || '',
            source: reservation.source,
            orderNumber: order_id,
            pickupLocation: reservation.pickup_location || undefined,
        }).catch(() => false);
        if (sent) {
            await supabaseServer.from('reservations').update({ urgent_alert_sent: true }).eq('order_id', order_id);
        }
    }
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
            // 맞춤 링크는 정규 픽업 시간표가 없다. 시간을 "별도 안내"로 적고
            // 시각이 인쇄된 시간표 PDF 는 붙이지 않는다.
            pickupTimeTbd: metadata.custom_pickup_time === '1',
        }).catch(err => {
            console.error('Failed to send voucher email:', order_id, err);
        });
    }

    return { ok: true as const, order_id, created: true, status: session.payment_status };
}
