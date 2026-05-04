import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
    : null;

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

        // 3. Calculate USD Price
        let usdPrice = 0;

        if (tourSetting.is_flat_rate && tourSetting.tour_id === 'private') {
            if (totalCount <= 4) usdPrice = 1800;
            else if (totalCount <= 10) usdPrice = 2200;
            else if (totalCount <= 20) usdPrice = 2800;
            else if (totalCount <= 30) usdPrice = 3500;
            else usdPrice = 4500;
        } else if (tourSetting.is_flat_rate) {
            usdPrice = tourSetting.adult_price_usd || 0;
        } else {
            usdPrice = (body.adultCount * (tourSetting.adult_price_usd || 0)) + (body.childCount * (tourSetting.child_price_usd || 0));
        }

        if (usdPrice <= 0) {
            return NextResponse.json({ error: 'Invalid price calculation.' }, { status: 400 });
        }

        // 4. Create Stripe Checkout Session
        const isEn = body.lang === 'en';
        const productName = isEn ? 
            (tourSetting.name_en || `OceanStar ${optionLabel}`) : 
            `오션스타 ${optionLabel}`;

        let order_id = generateOrderId();
        const noteText = `(성${body.adultCount}/아${body.childCount}) (예약번호 ${order_id}) [USD결제] (Stripe)`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: `Booking ID: ${order_id}`,
                        },
                        unit_amount: Math.round(usdPrice * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            client_reference_id: order_id,
            adaptive_pricing: { enabled: false },
            locale: isEn ? 'en' : 'ko',
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
                total_price: usdPrice.toString(),
                booker_email: body.bookerEmail,
                adult_count: body.adultCount.toString(),
                child_count: body.childCount.toString(),
                currency: 'USD',
                receipt_date: getHawaiiDateStrServer(),
            },
            success_url: `${origin}/${isEn ? 'en/' : ''}booking/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/${isEn ? 'en/' : ''}booking/payment-cancel?order_id=${order_id}`,
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
