import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { stripeClient as stripe } from '@/lib/stripeBooking';
import { grossUp, feeAmount, MIN_AMOUNT, type Currency } from '@/lib/pricing';
import { toMinor } from '@/lib/money';

/**
 * 맞춤 결제 링크를 만든다. 요금표에 없는 금액(프라이빗 별도 견적 등)을
 * 손님에게 링크로 받을 때 쓴다.
 *
 * 관리자는 상품명과 금액만 정한다. 예약 정보(이름·날짜·인원·픽업 등)는
 * 손님이 /pay 페이지에서 직접 채우고, 제출하는 순간 Checkout Session 이
 * 만들어진다. Stripe 결제창은 입력칸을 3개까지만 허용해서 이 항목들을
 * 담을 수 없기 때문에 우리 페이지를 거친다.
 *
 * Payment Link 을 만들지 않고 Price 만 만든다. Price 가 곧 링크의 정체이며,
 * 결제가 끝나면 웹훅이 이 Price 를 비활성화해 1회용으로 닫는다. 별도 테이블
 * 없이 Stripe 에 상태를 둔다.
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
        const { amount, currency, addFee, exchangeRate, lang, productName } = body as {
            amount?: number;
            currency?: string;
            addFee?: boolean;
            exchangeRate?: number;
            lang?: string;
            productName?: string;
        };

        if (currency !== 'USD' && currency !== 'KRW') {
            return NextResponse.json({ success: false, error: '결제 통화가 올바르지 않습니다.' }, { status: 400 });
        }
        const cur: Currency = currency;

        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ success: false, error: '금액이 올바르지 않습니다.' }, { status: 400 });
        }
        if (!productName || !productName.trim()) {
            return NextResponse.json({ success: false, error: '상품명을 입력하세요.' }, { status: 400 });
        }

        const isEn = lang === 'en';

        // 원화는 고정 수수료($0.30)를 환율로 환산해야 한다.
        const rate = typeof exchangeRate === 'number' && exchangeRate > 0 ? exchangeRate : undefined;
        const total = addFee ? grossUp(amount, cur, rate) : amount;
        const fee = addFee ? feeAmount(amount, cur, rate) : 0;

        if (total < MIN_AMOUNT[cur]) {
            return NextResponse.json({ success: false, error: '결제 최소 금액에 미달합니다.' }, { status: 400 });
        }

        const stripeCurrency = cur.toLowerCase();

        // 수수료를 먼저 만든다. 상품 Price 의 metadata 가 이 id 를 물고 있어야
        // 결제 때 두 줄을 같이 올릴 수 있다.
        let feePriceId: string | undefined;
        if (fee > 0) {
            const feePrice = await stripe.prices.create({
                currency: stripeCurrency,
                unit_amount: toMinor(fee, cur),
                product_data: { name: isEn ? 'Online Booking Fee' : '온라인 예약 수수료' },
            });
            feePriceId = feePrice.id;
        }

        const price = await stripe.prices.create({
            currency: stripeCurrency,
            unit_amount: toMinor(amount, cur),
            product_data: { name: productName.trim() },
            // 이 Price 가 링크의 전부다. /pay 페이지와 결제 생성이 여기서 읽는다.
            metadata: {
                kind: 'custom_link',
                lang: isEn ? 'en' : 'ko',
                product_name: productName.trim(),
                created_by: user.email ?? user.id,
                ...(feePriceId
                    ? { fee_price_id: feePriceId, fee_minor: toMinor(fee, cur).toString() }
                    : {}),
            },
        });

        // Stripe 주소를 그대로 주지 않는다. book.stripe.com 은 공유 미리보기
        // 제목이 "Stripe Checkout" 으로 고정이라 오션스타 이름이 안 뜬다.
        const origin = new Headers(request.headers).get('origin')
            || process.env.NEXT_PUBLIC_SITE_URL
            || 'http://localhost:3000';

        return NextResponse.json({
            success: true,
            url: `${origin}/pay/${price.id}`,
            id: price.id,
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
