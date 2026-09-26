import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { stripeClient as stripe } from '@/lib/stripeBooking';
import { grossUp, feeAmount, MIN_AMOUNT, type Currency } from '@/lib/pricing';
import { toMinor } from '@/lib/money';

/**
 * 맞춤 결제 링크를 만든다. 요금표에 없는 금액(프라이빗 별도 견적 등)을
 * 손님에게 링크로 받을 때 쓴다.
 *
 * Checkout Session 이 아니라 Payment Link 을 쓴다. Session 은 만들고 24시간
 * 안에 만료돼야 해서 견적 링크로 쓸 수 없다. Payment Link 은 만료가 없다.
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
        const { amount, currency, description, addFee, exchangeRate } = body as {
            amount?: number;
            currency?: string;
            description?: string;
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

        // Payment Link 은 Price 객체를 요구한다(Checkout Session 처럼 price_data 를
        // 인라인으로 못 쓴다). product_data 를 같이 넘기면 상품도 함께 만들어진다.
        const productPrice = await stripe.prices.create({
            currency: stripeCurrency,
            unit_amount: toMinor(amount, cur),
            product_data: { name: description.trim() },
        });

        const lineItems: { price: string; quantity: number }[] = [
            { price: productPrice.id, quantity: 1 },
        ];

        if (fee > 0) {
            const feePrice = await stripe.prices.create({
                currency: stripeCurrency,
                unit_amount: toMinor(fee, cur),
                product_data: { name: '온라인 예약 수수료' },
            });
            lineItems.push({ price: feePrice.id, quantity: 1 });
        }

        // Checkout Session 이 아니라 Payment Link 을 쓴다. Session 은 최대 24시간
        // 뒤 만료라 견적 링크로 못 쓴다. Payment Link 은 만료가 없다.
        const link = await stripe.paymentLinks.create({
            line_items: lineItems,
            submit_type: 'book',
            // 링크 주소만 알면 누구나 열 수 있다. 1회 결제되면 닫아서
            // 같은 링크로 두 번 결제되는 일을 막는다.
            restrictions: { completed_sessions: { limit: 1 } },
            inactive_message: '이미 결제가 완료된 링크입니다. 문의해 주세요.',
            // 예약이 아니므로 order_id 를 넣지 않는다. 웹훅이 이걸 보고 넘긴다.
            // 여기 metadata 는 이 링크로 만들어지는 Checkout Session 에 복사된다.
            metadata: {
                kind: 'custom_link',
                created_by: user.email ?? user.id,
                description: description.trim(),
            },
        });

        // Stripe 주소를 그대로 주지 않는다. book.stripe.com 은 공유 미리보기
        // 제목이 "Stripe Checkout" 으로 고정이라 오션스타 이름이 안 뜬다.
        // 우리 도메인을 거쳐 넘기면 미리보기를 우리가 정할 수 있다.
        const origin = new Headers(request.headers).get('origin')
            || process.env.NEXT_PUBLIC_SITE_URL
            || 'http://localhost:3000';

        return NextResponse.json({
            success: true,
            url: `${origin}/pay/${link.id}`,
            stripeUrl: link.url,
            id: link.id,
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
