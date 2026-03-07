import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Generate Order ID
        const order_id = `ORDER_${new Date().getTime()}`;

        // Helper: Map 'morning1' to '1부' for existing DB schema
        let optionLabel = body.selectedTour;
        if (body.selectedTour === 'morning1') optionLabel = '1부';
        if (body.selectedTour === 'morning2') optionLabel = '2부';
        if (body.selectedTour === 'sunset') optionLabel = '3부';

        // 2. 예약 인원 및 비고(Note) 포맷팅
        // pax: 수기 예약폼과 호환되게 오직 "총인원 명" 이라는 문자열로만 저장
        const totalCount = body.adultCount + body.childCount;
        const paxLabel = `${totalCount}명`;

        // note: 새로 전용 웹사이트에서 들어온 것은 성인/아동 구분자 추가 
        let noteText = `(성${body.adultCount}/아${body.childCount})`;

        // 만약 기존에 남기고자 했던 기타 메시지가 있다면 뒤에 덧붙인다.
        // if (body.someMessage) {
        //  noteText += ` ${body.someMessage}`;
        // }

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
                    pax: paxLabel,                // 오직 'N명'
                    note: noteText,               // 기존 기타란에 (성N/아N) 삽입
                    pickup_location: body.hotelName,
                    status: '결제대기',

                    // 새로 추가할 결제 관리용 컬럼들 (기존 로직과 충돌하지 않고 관리자단 통계용으로만 사용됨)
                    total_price: body.totalPrice,
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
        const eximbayMockUrl = `/booking/mock-payment?order_id=${order_id}&amount=${body.totalPrice}`;

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
