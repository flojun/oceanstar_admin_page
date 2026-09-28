import { NextResponse } from 'next/server';
import { stripeClient as stripe } from '@/lib/stripeBooking';
import { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';
import { fromMinor } from '@/lib/money';

/**
 * 손님이 맞춤 결제 링크에서 예약 정보를 제출하면 결제창을 만든다.
 *
 * 공개 엔드포인트다. 금액은 절대 요청에서 받지 않는다. 관리자가 만들어 둔
 * Price 에서만 읽는다.
 */

const ORDER_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const generateOrderId = () =>
    Array.from({ length: 6 }, () => ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)]).join('');

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!stripe) {
        return NextResponse.json({ success: false, error: 'Stripe secret key is not configured' }, { status: 500 });
    }

    try {
        const { id } = await params;
        if (!id.startsWith('price_')) {
            return NextResponse.json({ success: false, error: '잘못된 링크입니다.' }, { status: 404 });
        }

        const price = await stripe.prices.retrieve(id).catch(() => null);
        // 우리가 만든 맞춤 링크만 허용한다. 계정의 다른 Price 로 결제창을
        // 만들지 못하게 막는다.
        if (!price || price.metadata?.kind !== 'custom_link') {
            return NextResponse.json({ success: false, error: '잘못된 링크입니다.' }, { status: 404 });
        }
        if (!price.active) {
            return NextResponse.json({ success: false, error: '이미 결제가 완료된 링크입니다.' }, { status: 409 });
        }

        const body = await request.json();
        const { name, contact, email, tourDate, pax, option, timeRange, pickupLocation, note } = body as {
            name?: string; contact?: string; email?: string; tourDate?: string;
            pax?: number; option?: string; timeRange?: string;
            pickupLocation?: string; note?: string;
        };

        const isEn = price.metadata?.lang === 'en';
        const missing = (field: string) => NextResponse.json(
            { success: false, error: isEn ? `Please enter ${field}.` : `${field}을(를) 입력해 주세요.` },
            { status: 400 },
        );

        if (!name?.trim()) return missing(isEn ? 'your name' : '이름');
        if (!contact?.trim()) return missing(isEn ? 'a phone number' : '연락처');
        if (!email?.trim()) return missing(isEn ? 'an email address' : '이메일');
        if (!tourDate?.trim()) return missing(isEn ? 'a tour date' : '투어 날짜');
        if (!option?.trim()) return missing(isEn ? 'an option' : '옵션');
        if (!pickupLocation?.trim()) return missing(isEn ? 'a pickup location' : '픽업 장소');
        if (typeof pax !== 'number' || !Number.isInteger(pax) || pax <= 0) {
            return missing(isEn ? 'the number of guests' : '인원수');
        }

        // 시간대를 적으면 옵션에 붙인다. 관리자 화면의 옵션 매칭이 부분 일치라
        // "프라이빗 (09:00-13:00)" 이어도 선박/정원 뱃지가 그대로 뜬다.
        const optionLabel = timeRange?.trim()
            ? `${option.trim()} (${timeRange.trim()})`
            : option.trim();

        const currency = price.currency.toUpperCase();
        const feeMinor = Number(price.metadata?.fee_minor ?? 0);
        const totalMinor = (price.unit_amount ?? 0) + feeMinor;
        const total = fromMinor(totalMinor, price.currency);

        const lineItems: { price: string; quantity: number }[] = [{ price: price.id, quantity: 1 }];
        if (price.metadata?.fee_price_id) {
            lineItems.push({ price: price.metadata.fee_price_id, quantity: 1 });
        }

        const order_id = generateOrderId();
        const noteText = [
            `(예약번호 ${order_id}) [${currency}결제] (맞춤링크)`,
            note?.trim(),
        ].filter(Boolean).join(' ');

        const origin = new Headers(request.headers).get('origin')
            || process.env.NEXT_PUBLIC_SITE_URL
            || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            customer_email: email.trim(),
            client_reference_id: order_id,
            // 일반 예약과 같다. 투어 전날 캡처 크론이 확정하고, 그 전에
            // 취소하면 Stripe 수수료가 들지 않는다.
            payment_intent_data: {
                capture_method: 'manual',
                metadata: { order_id },
            },
            payment_method_options: {
                kr_card: { capture_method: 'manual' },
                kakao_pay: { capture_method: 'manual' },
                naver_pay: { capture_method: 'manual' },
                samsung_pay: { capture_method: 'manual' },
            },
            // createReservationFromSession 이 읽는 필드를 전부 채운다.
            metadata: {
                order_id,
                source: isEn ? '웹사이트(EN)' : '웹사이트',
                name: name.trim(),
                contact: contact.trim(),
                tour_date: tourDate.trim(),
                option: optionLabel,
                pax: `${pax}명`,
                note: noteText,
                pickup_location: pickupLocation.trim(),
                total_price: total.toString(),
                booker_email: email.trim(),
                // 성인/아동을 나눠 받지 않는다. 정원 계산은 pax 를 먼저 보고
                // 없을 때만 이 둘을 더하므로 총원을 adult 에 넣어두면 맞는다.
                adult_count: pax.toString(),
                child_count: '0',
                currency,
                receipt_date: await getDynamicReceiptDateStr(),
                // 맞춤 링크는 정규 픽업 시간표가 없다. 바우처에 "별도 안내"로
                // 적고 시간표 PDF 는 붙이지 않는다.
                custom_pickup_time: '1',
                // 결제가 끝나면 웹훅이 이 Price 를 닫아 1회용으로 만든다.
                custom_price_id: price.id,
            },
            success_url: `${origin}/kr/booking/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pay/${price.id}`,
        });

        return NextResponse.json({ success: true, url: session.url, order_id });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('[pay] 결제 생성 실패:', error);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
