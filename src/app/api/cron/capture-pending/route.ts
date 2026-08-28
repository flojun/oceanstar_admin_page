import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { stripeClient } from '@/lib/stripeBooking';
import { captureDueAt } from '@/lib/captureSchedule';
import { sendDiscordUrgentAlert } from '@/lib/discordWebhook';
import type Stripe from 'stripe';

/**
 * 미캡처 결제를 캡처한다. 하루 1회, 하와이 20시(UTC 06:00).
 *
 * 수동 캡처는 방치하면 승인이 만료되고 결제가 통째로 무효가 된다.
 * 실패는 반드시 사람이 봐야 하므로 Discord 로 알린다.
 */
export async function GET(request: Request) {
    if (!stripeClient) {
        return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: rows, error } = await supabaseServer
        .from('reservations')
        .select('id, order_id, name, tour_date, option, source, pickup_location, created_at, payment_intent_id')
        .not('payment_intent_id', 'is', null)
        .is('captured_at', null)
        .eq('status', '예약확정');

    if (error) {
        console.error('[capture-cron] 예약 조회 실패:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 콤보 예약은 1결제 2행이다. 결제 단위로 합쳐야 캡처가 두 번 나가지 않는다.
    const byPaymentIntent = new Map<string, typeof rows>();
    for (const row of rows ?? []) {
        const list = byPaymentIntent.get(row.payment_intent_id!) ?? [];
        list.push(row);
        byPaymentIntent.set(row.payment_intent_id!, list);
    }

    const now = new Date();
    const result = { checked: byPaymentIntent.size, captured: 0, skipped: 0, failed: 0 };

    for (const [paymentIntentId, group] of byPaymentIntent) {
        const primary = group[0];
        try {
            const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
                expand: ['latest_charge'],
            });

            if (pi.status !== 'requires_capture') {
                // 이미 캡처됐거나(대시보드 수동 캡처) 취소된 결제. DB만 맞춰준다.
                await markCaptured(group, pi.status === 'succeeded' ? new Date() : null);
                result.skipped++;
                continue;
            }

            const charge = pi.latest_charge as Stripe.Charge | null;
            const captureBeforeUnix = charge?.payment_method_details?.card?.capture_before;

            const due = captureDueAt({
                tourDate: primary.tour_date,
                authorizedAt: new Date(primary.created_at),
                captureBefore: captureBeforeUnix ? new Date(captureBeforeUnix * 1000) : null,
                now,
            });

            if (now < due) {
                result.skipped++;
                continue;
            }

            await stripeClient.paymentIntents.capture(paymentIntentId, undefined, {
                idempotencyKey: `capture_${primary.order_id}`,
            });
            await markCaptured(group, new Date());
            result.captured++;
            console.log(`[capture-cron] 캡처 완료 ${primary.order_id} (${paymentIntentId})`);
        } catch (err) {
            result.failed++;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[capture-cron] 캡처 실패 ${primary.order_id}:`, message);

            // 승인 만료 = 결제 무효. 조용히 넘기면 안 된다.
            await sendDiscordUrgentAlert({
                title: '🚨 [캡처 실패] 결제 승인이 만료됐을 수 있습니다',
                customerName: primary.name,
                tourDate: primary.tour_date,
                option: `${primary.option} / 사유: ${message}`,
                source: primary.source,
                orderNumber: primary.order_id ?? undefined,
                pickupLocation: primary.pickup_location ?? undefined,
            }).catch(() => { /* 알림 실패로 크론을 멈추지는 않는다 */ });
        }
    }

    return NextResponse.json({ success: true, ...result });
}

async function markCaptured(group: { id: string }[], capturedAt: Date | null) {
    if (!capturedAt) return;
    await supabaseServer
        .from('reservations')
        .update({ captured_at: capturedAt.toISOString() })
        .in('id', group.map(r => r.id));
}
