import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAdminUser } from '@/lib/adminAuth';
import { stripeClient } from '@/lib/stripeBooking';
import { toMinor, fromMinor } from '@/lib/money';
import type Stripe from 'stripe';

/**
 * 환불 실행. 캡처 전이면 승인 취소(수수료 0), 캡처 후면 환불.
 *
 * 예약은 order_id 로 찾는다. 콤보는 1결제 2행이라 행(id) 단위로 처리하면
 * 같은 결제를 두 번 환불하게 된다.
 *
 * 클라이언트는 payment_intent_id 를 보내지 않는다. 서버가 DB에서만 읽는다.
 */
export async function POST(request: Request) {
    if (!stripeClient) {
        return NextResponse.json({ success: false, error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    try {
        const user = await getAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { order_id, amount, reason, requestId } = body as {
            order_id?: string; amount?: number; reason?: string; requestId?: string;
        };

        if (!order_id || typeof order_id !== 'string') {
            return NextResponse.json({ success: false, error: '예약 번호가 필요합니다.' }, { status: 400 });
        }
        if (!requestId || typeof requestId !== 'string') {
            return NextResponse.json({ success: false, error: '요청 ID가 필요합니다.' }, { status: 400 });
        }
        if (amount != null && (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0)) {
            return NextResponse.json({ success: false, error: '환불 금액이 올바르지 않습니다.' }, { status: 400 });
        }

        const { data: rows, error: fetchError } = await supabaseServer
            .from('reservations')
            .select('id, order_id, name, note, status, payment_intent_id, refunded_amount')
            .eq('order_id', order_id);

        if (fetchError) {
            console.error('[refund] 예약 조회 실패:', fetchError);
            return NextResponse.json({ success: false, error: '예약 조회 중 오류가 발생했습니다.' }, { status: 500 });
        }
        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, error: '예약을 찾을 수 없습니다.' }, { status: 404 });
        }

        const paymentIntentId = rows.find(r => r.payment_intent_id)?.payment_intent_id;
        if (!paymentIntentId) {
            return NextResponse.json(
                { success: false, error: 'Stripe 결제 건이 아닙니다. 수기로 환불해주세요.' },
                { status: 400 },
            );
        }

        // DB 상태는 믿지 않는다. Stripe 가 유일한 진실이다.
        const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
            expand: ['latest_charge'],
        });
        const charge = pi.latest_charge as Stripe.Charge | null;
        const currency = pi.currency;

        // 캡처 전이면 잔액은 승인액 전체, 캡처 후면 캡처액에서 기환불액을 뺀다.
        const capturedMinor = charge?.amount_captured ?? 0;
        const alreadyRefundedMinor = charge?.amount_refunded ?? 0;
        const refundableMinor = pi.status === 'requires_capture'
            ? pi.amount
            : capturedMinor - alreadyRefundedMinor;

        if (refundableMinor <= 0) {
            return NextResponse.json({ success: false, error: '이미 전액 환불된 예약입니다.' }, { status: 400 });
        }

        // 금액 미지정이면 전액. 통화는 DB가 아니라 Stripe 에서 읽는다.
        const requestedMinor = amount == null ? refundableMinor : toMinor(amount, currency);
        if (requestedMinor <= 0 || requestedMinor > refundableMinor) {
            return NextResponse.json({
                success: false,
                error: `환불 가능 금액을 초과했습니다. (가능: ${fromMinor(refundableMinor, currency)} ${currency.toUpperCase()})`,
            }, { status: 400 });
        }

        const idempotencyKey = `refund_${order_id}_${requestId}`;
        let mode: 'canceled' | 'partially_captured' | 'refunded';
        const processedMinor = requestedMinor;

        if (pi.status === 'requires_capture') {
            if (requestedMinor >= refundableMinor) {
                // 전액 취소. 수수료가 발생하지 않는다.
                await stripeClient.paymentIntents.cancel(pi.id, undefined, { idempotencyKey });
                mode = 'canceled';
            } else {
                // 일부만 캡처하면 나머지 홀드는 자동으로 풀린다.
                // Stripe 는 승인당 캡처를 1회만 허용하므로 되돌릴 수 없다.
                await stripeClient.paymentIntents.capture(
                    pi.id,
                    { amount_to_capture: refundableMinor - requestedMinor },
                    { idempotencyKey },
                );
                mode = 'partially_captured';
            }
        } else if (pi.status === 'succeeded') {
            await stripeClient.refunds.create(
                { payment_intent: pi.id, amount: requestedMinor },
                { idempotencyKey },
            );
            mode = 'refunded';
        } else {
            return NextResponse.json(
                { success: false, error: `환불할 수 없는 결제 상태입니다. (${pi.status})` },
                { status: 400 },
            );
        }

        // 누적 총액을 넣는다. 콤보 두 행은 total_price 도 각각 전체 금액이라
        // 더하기가 아니라 같은 값을 세팅해야 일관된다.
        const totalRefunded = fromMinor(alreadyRefundedMinor + processedMinor, currency);
        const remainingMinor = refundableMinor - requestedMinor;
        const stamp = new Date().toISOString().slice(0, 10);
        const symbol = currency.toLowerCase() === 'usd' ? '$' : '₩';
        const label = mode === 'canceled' ? '결제취소(수수료없음)' : '환불';

        for (const row of rows) {
            const note = `${row.note || ''} [${label}: ${stamp} / 금액: ${symbol}${fromMinor(processedMinor, currency)} / 사유: ${reason || '사유 미기재'}]`.trim();
            await supabaseServer
                .from('reservations')
                .update({
                    refunded_amount: totalRefunded,
                    note,
                    ...(remainingMinor <= 0 ? { status: '취소' } : {}),
                    ...(mode === 'canceled' ? { captured_at: null } : {}),
                })
                .eq('id', row.id);
        }

        return NextResponse.json({
            success: true,
            mode,
            order_id,
            currency,
            refunded_amount: totalRefunded,
            remaining: fromMinor(remainingMinor, currency),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('[refund] 처리 실패:', error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
