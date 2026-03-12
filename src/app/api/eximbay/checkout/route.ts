import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Generate Order ID (6자리 대문자 알파벳 + 숫자 조합)
        const generateOrderId = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        const order_id = generateOrderId();

        // ============================================
        // [중요 보안] 프론트엔드 가격 검증 및 서버 사이드 가격 재계산
        // ============================================
        const { data: tourSetting, error: settingError } = await supabase
            .from('tour_settings')
            .select('*')
            .eq('tour_id', body.selectedTour)
            .single();

        if (settingError || !tourSetting) {
            return NextResponse.json({ error: 'Failed to fetch pricing from DB' }, { status: 500 });
        }

        // 판매 중지된 상품 결제 차단
        if (tourSetting.is_active === false) {
            return NextResponse.json({ error: '현재 판매가 중지된 옵션입니다.' }, { status: 400 });
        }

        // DB 기준 옵션명 심플하게 변경 (1부, 2부, 3부, 프라이빗)
        let optionLabel = tourSetting.name;
        if (tourSetting.tour_id === 'morning1') optionLabel = '1부';
        else if (tourSetting.tour_id === 'morning2') optionLabel = '2부';
        else if (tourSetting.tour_id === 'sunset') optionLabel = '3부';
        else if (tourSetting.tour_id === 'private') optionLabel = '프라이빗';

        // 2. 예약 인원 및 포맷팅
        const totalCount = body.adultCount + body.childCount;
        const paxLabel = `${totalCount}명`;
        const noteText = `(성${body.adultCount}/아${body.childCount}) (예약번호 ${order_id})`;

        // 프라이빗 차터 픽업 예외 처리
        let pickupLabel = body.pickupLocationName || body.hotelName;
        if (tourSetting.is_flat_rate) {
            pickupLabel = body.hotelName + ' (개별안내)';
        }

        // 가격 계산 (고정 요금제 처리)
        let calculatedTotalPrice = 0;
        if (tourSetting.is_flat_rate && tourSetting.tour_id === 'private') {
            // 프라이빗 차터 계단식 요금 (동적 환율 적용)
            const exchangeRate = tourSetting.adult_price_usd ? (tourSetting.adult_price_krw / tourSetting.adult_price_usd) : 1350;
            let usdPrice = 0;
            if (totalCount <= 4) usdPrice = 1800;
            else if (totalCount <= 10) usdPrice = 2200;
            else if (totalCount <= 20) usdPrice = 2800;
            else if (totalCount <= 30) usdPrice = 3500;
            else usdPrice = 4500;

            calculatedTotalPrice = Math.floor(usdPrice * exchangeRate);
        } else if (tourSetting.is_flat_rate) {
            // 다른 고정 요금 상품 대비
            calculatedTotalPrice = tourSetting.adult_price_krw;
        } else {
            // 일반 상품 (성인/아동 인원수별 합산)
            calculatedTotalPrice = (body.adultCount * tourSetting.adult_price_krw) +
                (body.childCount * tourSetting.child_price_krw);
        }

        // 3. Insert into Supabase reservations with '결제대기' status
        const { data, error } = await supabase
            .from('reservations')
            .insert([
                {
                    order_id: order_id,
                    source: '웹사이트',
                    name: body.bookerName,
                    contact: body.bookerPhone,
                    tour_date: body.tourDate,
                    option: optionLabel,
                    pax: paxLabel,
                    note: noteText,
                    pickup_location: pickupLabel,
                    status: '결제대기',
                    total_price: calculatedTotalPrice,
                    booker_email: body.bookerEmail,
                    adult_count: body.adultCount,
                    child_count: body.childCount,
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: 'Database error', details: error }, { status: 500 });
        }

        // 4. Prepare Eximbay Request (Mocked for this implementation)
        // [수정사항] 결제 화폐 단위를 기존 USD에서 DB 기반의 KRW 총합 금액으로 전달합니다.
        const eximbayMockUrl = `/booking/mock-payment?order_id=${order_id}&amount=${calculatedTotalPrice}&cur=KRW`;

        return NextResponse.json({
            success: true,
            order_id,
            redirectUrl: eximbayMockUrl
        });

    } catch (error) {
        console.error('Checkout API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
