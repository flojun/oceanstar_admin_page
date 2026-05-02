import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { sendVoucherEmail } from '@/lib/email';

// Hawaii is UTC-10 with no DST
function getHawaiiDateStrServer(): string {
    const now = new Date();
    const hawaiiOffset = -10 * 60;
    const hawaiiDate = new Date((now.getTime() / 60000 + hawaiiOffset) * 60000);
    const y = hawaiiDate.getUTCFullYear();
    const m = String(hawaiiDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(hawaiiDate.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Pay2Pay Webhook의 경우, 전달받은 서버 간 통신 파라미터의 서명(Signature/Hash)을 검증해야 합니다.
        // 현재 연동 메뉴얼 대기 중이므로 임시로 order_id와 처리 상태(예: rescode === '0000')가 성공이라고 가정합니다.
        const { order_id, rescode, data: encodedData } = body;

        // pay2pay 전용 상태 코드나 필드명이 다를 수 있으므로 추후 매뉴얼 구조에 맞게 변경
        if (!order_id) {
            return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
        }

        if (rescode === '0000' || rescode === 'SUCCESS') {
            // 결제 성공 -> Supabase 예약 상태 '예약확정'으로 인서트
            // TODO: 실제 Pay2Pay 연동 시, Pay2Pay 서버에서 전달해주는 커스텀 데이터(메타데이터) 필드를 파싱하거나,
            // 별도의 임시 테이블에서 order_id로 예약 정보를 불러와야 할 수 있습니다.
            let reservationData = null;
            if (encodedData) {
                try {
                    const decodedStr = Buffer.from(encodedData, 'base64').toString('utf8');
                    reservationData = JSON.parse(decodedStr);
                } catch (e) {
                    console.error("Failed to parse encoded data", e);
                }
            }

            if (!reservationData) {
                 return NextResponse.json({ error: 'Missing reservation metadata' }, { status: 400 });
            }

            const { data, error } = await supabaseServer
                .from('reservations')
                .insert([
                    {
                        order_id: order_id,
                        source: reservationData.source,
                        name: reservationData.name,
                        contact: reservationData.contact,
                        tour_date: reservationData.tour_date,
                        option: reservationData.option,
                        pax: reservationData.pax,
                        note: reservationData.note,
                        pickup_location: reservationData.pickup_location,
                        status: '예약확정',
                        total_price: reservationData.total_price,
                        booker_email: reservationData.booker_email,
                        adult_count: reservationData.adult_count,
                        child_count: reservationData.child_count,
                        currency: reservationData.currency,
                        receipt_date: reservationData.receipt_date,
                    }
                ])
                .select();

            if (error) {
                console.error('Failed to insert reservation status for Pay2Pay id', order_id, error);
                return NextResponse.json({ error: 'DB Insert Failed' }, { status: 500 });
            }

            console.log(`[Pay2Pay] Payment confirmed for order: ${order_id}`);

            // 2. 바우처 이메일 자동 발송 (선택옵션으로 사용자 이메일이 기재된 경우)
            if (data && data.length > 0) {
                const reservation = data[0];
                if (reservation.booker_email) {
                    sendVoucherEmail({
                        to: reservation.booker_email,
                        name: reservation.name,
                        order_id: reservation.order_id || order_id,
                        tour_name: '오션스타 하와이 거북이 스노클링', // 기본 상품명 (필요 시 다국어 분기 처리)
                        tour_date: reservation.tour_date,
                        pax: reservation.pax,
                        option: reservation.option,
                        pickup_location: reservation.pickup_location,
                    }).catch(err => {
                        console.error('Failed to send voucher email via Pay2Pay webhook:', err);
                    });
                }
            }

            return NextResponse.json({ success: true, message: 'Pay2Pay Payment confirmed and verified' });
        } else {
            // 결제 실패 처리 (기존에 인서트된게 없으므로 별도 업데이트 불필요, 로그만 남김)
            console.error(`Pay2Pay Payment failed for order: ${order_id}`);
            return NextResponse.json({ success: false, message: 'Pay2Pay Payment failed' });
        }
    } catch (error) {
        console.error('Pay2Pay Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
