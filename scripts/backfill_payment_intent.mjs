/**
 * 기존 예약에 Stripe 결제 번호(payment_intent_id)를 채운다.
 *
 *   node scripts/backfill_payment_intent.mjs --dry
 *   node scripts/backfill_payment_intent.mjs
 *
 * 필요 환경변수: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * 과거 결제는 전부 캡처가 끝난 상태이므로 captured_at 도 같이 채운다.
 * 안 하면 캡처 크론이 이미 끝난 결제를 캡처하려 든다.
 *
 * 이걸 안 돌려도 시스템은 안전하게 동작한다. 결제 번호가 없는 예약은
 * 환불 버튼이 잠기고 "수기 환불" 안내가 뜬다.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeKey || !supabaseUrl || !serviceKey) {
    console.error('환경변수가 없습니다: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const stripe = new Stripe(stripeKey);
const supabase = createClient(supabaseUrl, serviceKey);

// 1. 결제 번호가 비어 있는 예약을 모은다.
const { data: rows, error } = await supabase
    .from('reservations')
    .select('id, order_id, created_at, name')
    .is('payment_intent_id', null)
    .not('order_id', 'is', null);

if (error) {
    console.error('예약 조회 실패:', error.message);
    process.exit(1);
}

const byOrderId = new Map();
for (const row of rows ?? []) {
    const list = byOrderId.get(row.order_id) ?? [];
    list.push(row);
    byOrderId.set(row.order_id, list);
}
console.log(`결제 번호가 없는 예약: ${rows?.length ?? 0}행 / ${byOrderId.size}개 주문`);

// 2. Stripe Checkout Session 을 훑으며 metadata.order_id 로 짝을 맞춘다.
const matched = new Map(); // order_id -> { paymentIntentId, captured }
let scanned = 0;

for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
    scanned++;
    const orderId = session.metadata?.order_id;
    if (!orderId || !byOrderId.has(orderId) || matched.has(orderId)) continue;

    const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!paymentIntentId) continue;

    matched.set(orderId, {
        paymentIntentId,
        // 과거 건은 자동 캡처였으므로 결제 완료면 캡처된 것으로 본다.
        captured: session.payment_status === 'paid',
    });
}
console.log(`Stripe 세션 ${scanned}건 확인 → ${matched.size}개 주문 매칭`);

const unmatched = [...byOrderId.keys()].filter(id => !matched.has(id));
if (unmatched.length > 0) {
    console.log(`매칭 실패 ${unmatched.length}건 (Stripe 결제가 아닌 예약일 가능성): ${unmatched.slice(0, 10).join(', ')}${unmatched.length > 10 ? ' ...' : ''}`);
}

if (DRY_RUN) {
    console.log('\n--dry 모드. 아무것도 쓰지 않았습니다.');
    for (const [orderId, info] of [...matched].slice(0, 5)) {
        console.log(`  ${orderId} -> ${info.paymentIntentId} (captured: ${info.captured})`);
    }
    process.exit(0);
}

// 3. 반영. 콤보는 같은 order_id 의 모든 행에 동일하게 쓴다.
let updated = 0;
for (const [orderId, info] of matched) {
    const { error: updateError } = await supabase
        .from('reservations')
        .update({
            payment_intent_id: info.paymentIntentId,
            captured_at: info.captured ? (byOrderId.get(orderId)[0].created_at ?? new Date().toISOString()) : null,
        })
        .eq('order_id', orderId);

    if (updateError) {
        console.error(`  실패 ${orderId}:`, updateError.message);
    } else {
        updated++;
    }
}

console.log(`\n완료: ${updated}개 주문 갱신`);
