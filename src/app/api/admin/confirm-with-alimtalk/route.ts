import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAdminUser } from '@/lib/adminAuth';
import { bookingVars, sendAlimtalk } from '@/lib/alimtalk';
import { pickupTime } from '@/lib/voucherFiles';

/**
 * '안내필요' 예약을 '예약확정'으로 바꾸고 픽업 시간이 담긴 알림톡을 보낸다.
 * 픽업 시간을 정하지 못하면 확정하지 않는다 — 시간 없는 확정 안내를 보내지 않게.
 */
export async function POST(req: Request) {
    if (!(await getAdminUser())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    const { data: r, error } = await supabaseServer
        .from('reservations')
        .select('id, order_id, name, tour_date, option, pax, pickup_location, contact, status')
        .eq('id', id)
        .single();
    if (error || !r) {
        return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (r.status !== '안내필요') {
        return NextResponse.json({ error: `이미 '${r.status}' 상태입니다.` }, { status: 400 });
    }

    const time = await pickupTime(r.pickup_location ?? '', r.option ?? '');
    if (!time) {
        return NextResponse.json({ error: '픽업 시간을 찾지 못했습니다. 픽업 장소에 "HM (2:35)"처럼 시간을 적어 주세요.' }, { status: 400 });
    }

    const { error: updateError } = await supabaseServer
        .from('reservations')
        .update({ status: '예약확정', is_admin_checked: true })
        .eq('id', r.id);
    if (updateError) {
        console.error('[confirm-with-alimtalk] 확정 실패:', updateError);
        return NextResponse.json({ error: '예약확정 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 확정은 이미 끝났다. 알림톡 결과는 화면에 알리기만 한다.
    let alimtalk: 'sent' | 'skipped' | 'failed' = 'skipped';
    try {
        const sent = await sendAlimtalk(r.contact ?? '', process.env.SOLAPI_TPL_PICKUP_TIME, { ...bookingVars(r), 픽업시간: time });
        alimtalk = sent ? 'sent' : 'skipped';
    } catch (err) {
        console.error('[confirm-with-alimtalk] 알림톡 실패:', r.order_id, err);
        alimtalk = 'failed';
    }

    return NextResponse.json({ success: true, pickupTime: time, alimtalk });
}
