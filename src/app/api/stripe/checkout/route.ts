import { getReceiptDateStr } from '@/lib/timeUtils';
import { getDynamicReceiptDateStr } from '@/lib/serverTimeUtils';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { stripeClient as stripe } from '@/lib/stripeBooking';
import { basePrice, grossUp, feeAmount, MIN_AMOUNT, type Currency } from '@/lib/pricing';
import { toMinor } from '@/lib/money';

// Hawaii time helper
function getHawaiiDateStrServer(): string {
    const now = new Date();
    const hawaiiOffset = -10 * 60; // minutes
    const utcMinutes = now.getTime() / 60000;
    const hawaiiDate = new Date((utcMinutes + hawaiiOffset) * 60000);
    const y = hawaiiDate.getUTCFullYear();
    const m = String(hawaiiDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(hawaiiDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }
    try {
        const body = await req.json();
        const headers = new Headers(req.headers);
        const origin = headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // 1. Generate Order ID
        const generateOrderId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        // 2. Fetch Tour Settings
        const { data: tourSetting, error: settingError } = await supabaseServer
            .from('tour_settings')
            .select('*')
            .eq('tour_id', body.selectedTour)
            .single();

        if (settingError || !tourSetting) {
            return NextResponse.json({ error: 'Failed to fetch pricing from DB' }, { status: 500 });
        }

        if (tourSetting.is_active === false) {
            return NextResponse.json({ error: '현재 판매가 중지된 옵션입니다.' }, { status: 400 });
        }

        // Option Label
        let optionLabel = tourSetting.name;
        if (tourSetting.tour_id === 'morning1') optionLabel = '1부';
        else if (tourSetting.tour_id === 'morning2') optionLabel = '2부';
        else if (tourSetting.tour_id === 'sunset') optionLabel = '3부';
        else if (tourSetting.tour_id === 'private') optionLabel = '프라이빗';

        // Pax and Pickup
        const totalCount = body.adultCount + body.childCount;
        const paxLabel = `${totalCount}명`;

        let pickupLabel = body.pickupLocationName || body.hotelName;
        if (tourSetting.is_flat_rate) {
            pickupLabel = body.hotelName + ' (개별안내)';
        }

        // 3. 가격 계산 - 통화는 클라이언트가 명시한다.
        // lang 으로 추측하면 안 된다. 한국어 페이지에서도 달러를 고를 수 있다.
        if (body.currency !== 'KRW' && body.currency !== 'USD') {
            return NextResponse.json({ error: '결제 통화가 올바르지 않습니다.' }, { status: 400 });
        }
        const currency: Currency = body.currency;

        // 가격 로직은 pricing.ts 한 곳에만 둔다. 화면 표시와 같은 값이어야 한다.
        const productPrice = basePrice(tourSetting, currency, {
            adultCount: body.adultCount,
            childCount: body.childCount,
        }, body.comboOption);

        if (productPrice <= 0) {
            return NextResponse.json({ error: 'Invalid price calculation.' }, { status: 400 });
        }

        // 4. 결제 수수료를 얹어 손님이 낼 총액을 만든다.
        const totalRounded = grossUp(productPrice, currency);
        const fee = feeAmount(productPrice, currency);

        if (totalRounded < MIN_AMOUNT[currency]) {
            return NextResponse.json({ error: '결제 최소 금액에 미달합니다.' }, { status: 400 });
        }

        // 5. Create Stripe Checkout Session
        const isEn = body.lang === 'en';
        const productName = isEn ? 
            (tourSetting.name_en || `OceanStar ${optionLabel}`) : 
            `오션스타 ${optionLabel}`;

        let order_id = generateOrderId();
        const noteText = `(성${body.adultCount}/아${body.childCount}) (예약번호 ${order_id}) [${currency}결제] (Stripe)`;
        const stripeCurrency = currency.toLowerCase();

        const session = await stripe.checkout.sessions.create({
            // payment_method_types 를 지정하지 않는다. 지정하면 대시보드에서 켠
            // 한국 결제수단(카카오페이/네이버페이 등)이 결제창에 뜨지 않는다.
            line_items: [
                {
                    price_data: {
                        currency: stripeCurrency,
                        product_data: {
                            name: productName,
                            description: `Booking ID: ${order_id}`,
                        },
                        // KRW 은 소수점이 없어 배율이 1이다. toMinor 밖에서 * 100 금지.
                        unit_amount: toMinor(productPrice, currency),
                    },
                    quantity: 1,
                },
                {
                    price_data: {
                        currency: stripeCurrency,
                        product_data: {
                            name: isEn ? 'Online Booking Fee' : '온라인 예약 수수료',
                            description: `Payment Processing Fee`,
                        },
                        unit_amount: toMinor(fee, currency),
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            client_reference_id: order_id,
            // 카카오페이는 이메일이 필수다.
            customer_email: body.bookerEmail || undefined,
            // 승인만 걸고 캡처는 미룬다. 캡처 전에 취소하면 Stripe 수수료가 0원이다.
            // 캡처는 /api/cron/capture-pending 이 투어 전날 하와이 20시에 처리한다.
            payment_intent_data: {
                capture_method: 'manual',
                // 세션 metadata 는 PaymentIntent 로 전파되지 않는다. 대시보드에서
                // 예약번호로 결제를 역추적하려면 여기에도 넣어야 한다.
                metadata: { order_id },
            },
            // 한국 결제수단은 결제수단별 옵션에 넣어야 수동 캡처가 걸린다.
            // 지원하지 않는 수단은 즉시 캡처될 뿐 결제가 실패하지는 않는다.
            payment_method_options: {
                kr_card: { capture_method: 'manual' },
                kakao_pay: { capture_method: 'manual' },
                naver_pay: { capture_method: 'manual' },
                samsung_pay: { capture_method: 'manual' },
            },
            adaptive_pricing: { enabled: false },
            allow_promotion_codes: true,
            metadata: {
                order_id: order_id,
                source: isEn ? '웹사이트(EN)' : '웹사이트',
                name: body.bookerName,
                contact: body.bookerPhone,
                tour_date: body.tourDate,
                option: optionLabel,
                pax: paxLabel,
                note: noteText,
                pickup_location: pickupLabel,
                total_price: totalRounded.toString(), // Save the new total price including fee
                booker_email: body.bookerEmail,
                adult_count: body.adultCount.toString(),
                child_count: body.childCount.toString(),
                currency: currency,
                receipt_date: await getDynamicReceiptDateStr(),
                // Combo specific metadata
                combo_option: body.comboOption || '',
                combo_time_option: body.comboTimeOption || '',
                secondary_date: body.secondaryDate || '',
                secondary_pickup: body.secondaryPickupLocationName || ''
            },
            success_url: `${origin}${isEn ? '' : '/kr'}/booking/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}${isEn ? '' : '/kr'}/booking/payment-cancel?order_id=${order_id}`,
        });

        return NextResponse.json({
            success: true,
            order_id,
            url: session.url
        });

    } catch (error: any) {
        console.error('Stripe Checkout API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
