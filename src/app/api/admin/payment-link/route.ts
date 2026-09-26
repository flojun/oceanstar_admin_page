import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { stripeClient as stripe } from '@/lib/stripeBooking';
import { grossUp, feeAmount, MIN_AMOUNT, type Currency } from '@/lib/pricing';
import { toMinor } from '@/lib/money';

/**
 * 맞춤 결제 링크를 만든다. 요금표에 없는 금액(프라이빗 별도 견적 등)을
 * 손님에게 링크로 받을 때 쓴다.
 *
 * 예약을 만들지 않는다. 그래서 일반 예약과 두 가지가 다르다.
 *
 * 1) 수동 캡처를 걸지 않는다. 캡처 크론은 예약행의 payment_intent_id 를 보고
 *    도는데 여기에는 예약행이 없어서 영영 캡처되지 않고 승인이 만료된다.
 *    즉시 결제로 둬야 돈이 실제로 들어온다.
 * 2) metadata 에 order_id 를 넣지 않는다. 넣으면 웹훅이 예약을 만들려 든다.
 *    웹훅은 order_id 가 없는 세션을 그냥 넘기도록 되어 있다.
 *
 * 환불은 관리자 환불 화면이 아니라 Stripe 대시보드에서 해야 한다.
 */
export async function POST(request: Request) {
    if (!stripe) {
        return NextResponse.json({ success: false, error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    try {
        const user = await getAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, currency, description, email, addFee, exchangeRate } = body as {
            amount?: number;
            currency?: string;
            description?: string;
            email?: string;
            addFee?: boolean;
            exchangeRate?: number;
        };

        if (currency !== 'USD' && currency !== 'KRW') {
            return NextResponse.json({ success: false, error: '결제 통화가 올바르지 않습니다.' }, { status: 400 });
        }
        const cur: Currency = currency;

        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ success: false, error: '금액이 올바르지 않습니다.' }, { status: 400 });
        }
        if (!description || !description.trim()) {
            return NextResponse.json({ success: false, error: '상품 설명을 입력하세요.' }, { status: 400 });
        }

        // 원화는 고정 수수료($0.30)를 환율로 환산해야 한다. 화면에서 넘겨받되
        // 없으면 pricing.ts 의 기본값을 쓴다.
        const rate = typeof exchangeRate === 'number' && exchangeRate > 0 ? exchangeRate : undefined;
        const total = addFee ? grossUp(amount, cur, rate) : amount;
        const fee = addFee ? feeAmount(amount, cur, rate) : 0;

        if (total < MIN_AMOUNT[cur]) {
            return NextResponse.json({ success: false, error: '결제 최소 금액에 미달합니다.' }, { status: 400 });
        }

        const stripeCurrency = cur.toLowerCase();
        const lineItems = [
            {
                price_data: {
                    currency: stripeCurrency,
                    product_data: { name: description.trim() },
                    unit_amount: toMinor(amount, cur),
                },
                quantity: 1,
            },
        ];

        if (fee > 0) {
            lineItems.push({
                price_data: {
                    currency: stripeCurrency,
                    product_data: { name: '온라인 예약 수수료' },
                    unit_amount: toMinor(fee, cur),
                },
                quantity: 1,
            });
        }

        const origin = new Headers(request.headers).get('origin')
            || process.env.NEXT_PUBLIC_SITE_URL
            || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            customer_email: email?.trim() || undefined,
            // 예약이 아니므로 order_id 를 넣지 않는다. 웹훅이 이걸 보고 넘긴다.
            metadata: {
                kind: 'custom_link',
                created_by: user.email ?? user.id,
                description: description.trim(),
            },
            // 링크를 언제 쓸지 모르므로 넉넉히 열어둔다. Stripe 최대치.
            expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            success_url: `${origin}/kr/booking/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/kr`,
        });

        return NextResponse.json({
            success: true,
            url: session.url,
            expires_at: session.expires_at,
            currency: cur,
            base: amount,
            fee,
            total,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('[payment-link] 생성 실패:', error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
