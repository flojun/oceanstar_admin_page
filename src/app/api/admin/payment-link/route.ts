import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { stripeClient as stripe } from '@/lib/stripeBooking';
import { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';
import { grossUp, feeAmount, MIN_AMOUNT, type Currency } from '@/lib/pricing';
import { toMinor } from '@/lib/money';

/**
 * 맞춤 결제 링크를 만든다. 요금표에 없는 금액(프라이빗 별도 견적, 시간대를
 * 따로 잡은 차터 등)을 손님에게 링크로 받을 때 쓴다.
 *
 * Checkout Session 이 아니라 Payment Link 을 쓴다. Session 은 만들고 24시간
 * 안에 만료돼야 해서 견적 링크로 쓸 수 없다. Payment Link 은 만료가 없다.
 *
 * 결제되면 웹훅이 일반 예약과 똑같이 예약행을 만든다. Payment Link 의
 * metadata 는 이 링크로 생성되는 Checkout Session 에 그대로 복사되므로,
 * createReservationFromSession 이 읽는 필드를 여기서 전부 채워준다.
 */

const ORDER_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateOrderId = () =>
    Array.from({ length: 6 }, () => ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)]).join('');

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
        const {
            amount, currency, addFee, exchangeRate, lang,
            name, contact, email, tourDate, pax, option, optionEn, productName,
            timeRange, pickupLocation, note,
        } = body as {
            amount?: number;
            currency?: string;
            addFee?: boolean;
            exchangeRate?: number;
            lang?: string;
            name?: string;
            contact?: string;
            email?: string;
            tourDate?: string;
            pax?: number;
            option?: string;
            optionEn?: string;
            productName?: string;
            timeRange?: string;
            pickupLocation?: string;
            note?: string;
        };

        if (currency !== 'USD' && currency !== 'KRW') {
            return NextResponse.json({ success: false, error: '결제 통화가 올바르지 않습니다.' }, { status: 400 });
        }
        const cur: Currency = currency;

        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ success: false, error: '금액이 올바르지 않습니다.' }, { status: 400 });
        }

        const required: [string, string | undefined][] = [
            ['예약자명', name],
            ['투어 날짜', tourDate],
            ['옵션', option],
            ['픽업장소', pickupLocation],
        ];
        for (const [label, value] of required) {
            if (!value || !value.trim()) {
                return NextResponse.json({ success: false, error: `${label}을(를) 입력하세요.` }, { status: 400 });
            }
        }
        if (typeof pax !== 'number' || !Number.isInteger(pax) || pax <= 0) {
            return NextResponse.json({ success: false, error: '인원수를 입력하세요.' }, { status: 400 });
        }

        // 손님에게 보이는 안내 언어. 예약 사이트와 같은 기준이다.
        const isEn = lang === 'en';

        // 시간대를 적으면 옵션에 붙인다. "프라이빗 (09:00-13:00)" 처럼 되는데,
        // 관리자 화면의 옵션 매칭이 부분 일치라 선박/정원 뱃지도 그대로 뜬다.
        const withTime = (base: string) =>
            timeRange?.trim() ? `${base} (${timeRange.trim()})` : base;

        // DB 에 남는 옵션은 항상 한국어다. 관리자 화면이 이 값으로 매칭한다.
        const optionLabel = withTime(option!.trim());

        // 원화는 고정 수수료($0.30)를 환율로 환산해야 한다.
        const rate = typeof exchangeRate === 'number' && exchangeRate > 0 ? exchangeRate : undefined;
        const total = addFee ? grossUp(amount, cur, rate) : amount;
        const fee = addFee ? feeAmount(amount, cur, rate) : 0;

        if (total < MIN_AMOUNT[cur]) {
            return NextResponse.json({ success: false, error: '결제 최소 금액에 미달합니다.' }, { status: 400 });
        }

        const order_id = generateOrderId();
        const stripeCurrency = cur.toLowerCase();
        // 손님이 결제창에서 보는 이름. 관리자가 적었으면 그대로 쓴다.
        // 시간대를 덧붙이지 않는다 - 적은 그대로 나가야 한다.
        // 비워두면 옵션에서 만들어 쓰되, 영문은 name_en 이 비어 있는 경우가 많아
        // 한국어 옵션명으로 떨어질 수 있다.
        const lineItemName = productName?.trim()
            || (isEn
                ? `OceanStar ${withTime((optionEn || option)!.trim())}`
                : `오션스타 ${optionLabel}`);

        // Payment Link 은 Price 객체를 요구한다(Checkout Session 처럼 price_data 를
        // 인라인으로 못 쓴다). product_data 를 같이 넘기면 상품도 함께 만들어진다.
        const productPrice = await stripe.prices.create({
            currency: stripeCurrency,
            unit_amount: toMinor(amount, cur),
            product_data: { name: lineItemName },
        });

        const lineItems: { price: string; quantity: number }[] = [
            { price: productPrice.id, quantity: 1 },
        ];

        if (fee > 0) {
            const feePrice = await stripe.prices.create({
                currency: stripeCurrency,
                unit_amount: toMinor(fee, cur),
                product_data: { name: isEn ? 'Online Booking Fee' : '온라인 예약 수수료' },
            });
            lineItems.push({ price: feePrice.id, quantity: 1 });
        }

        const noteText = [
            `(예약번호 ${order_id}) [${cur}결제] (맞춤링크)`,
            note?.trim(),
        ].filter(Boolean).join(' ');

        const link = await stripe.paymentLinks.create({
            line_items: lineItems,
            submit_type: 'book',
            // 링크 주소만 알면 누구나 열 수 있다. 1회 결제되면 닫아서
            // 같은 링크로 두 번 결제되는 일을 막는다.
            restrictions: { completed_sessions: { limit: 1 } },
            inactive_message: isEn
                ? 'This payment link has already been used. Please contact us.'
                : '이미 결제가 완료된 링크입니다. 문의해 주세요.',
            // 승인만 걸고 캡처는 미룬다. 일반 예약과 같은 방식이라 캡처 크론이
            // 예약행을 보고 투어 전날 하와이 20시에 캡처한다.
            payment_intent_data: {
                capture_method: 'manual',
                metadata: { order_id },
            },
            // 이 metadata 는 링크로 만들어지는 Checkout Session 에 복사된다.
            // createReservationFromSession 이 읽는 필드를 전부 채운다.
            metadata: {
                order_id,
                source: isEn ? '웹사이트(EN)' : '웹사이트',
                name: name!.trim(),
                contact: contact?.trim() || '',
                tour_date: tourDate!.trim(),
                option: optionLabel,
                pax: `${pax}명`,
                note: noteText,
                pickup_location: pickupLocation!.trim(),
                total_price: total.toString(),
                booker_email: email?.trim() || '',
                // 성인/아동을 나눠 받지 않는다. 정원 계산은 pax 를 먼저 보고
                // 없을 때만 이 둘을 더하므로 총원을 adult 에 넣어두면 맞는다.
                adult_count: pax.toString(),
                child_count: '0',
                currency: cur,
                receipt_date: await getDynamicReceiptDateStr(),
                created_by: user.email ?? user.id,
                // /pay 안내 페이지가 이 값으로 언어를 고른다.
                lang: isEn ? 'en' : 'ko',
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
            order_id,
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
