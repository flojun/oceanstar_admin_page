import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, booker_email } = body;

        if (!order_id || !booker_email) {
            return NextResponse.json({ error: '예약 번호와 이메일을 모두 입력해주세요.' }, { status: 400 });
        }

        const { data: reservation, error } = await supabaseServer
            .from('reservations')
            .select('*')
            .eq('order_id', order_id.trim().toUpperCase())
            .ilike('booker_email', booker_email.trim())
            .single();

        if (error || !reservation) {
            return NextResponse.json({ error: '일치하는 예약 정보가 없습니다. 예약 번호와 이메일을 확인해주세요.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, reservation });
    } catch (error) {
        console.error('Verify booking error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
