import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { resolveOptionToTourSetting } from '@/lib/tourUtils';

export async function POST(req: Request) {
    try {
        // 인증 검사
        const cookieStore = await cookies();
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll: () => cookieStore.getAll() }
            }
        );
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { reservation_id, new_date, new_pickup, current_note } = body;

        // 1. 현재 대기중인 예약 정보 가져오기
        const { data: reservation, error: fetchErr } = await supabaseServer
            .from('reservations')
            .select('id, pax, option, booker_email, name')
            .eq('id', reservation_id)
            .single();

        if (fetchErr || !reservation) {
             return NextResponse.json({ error: '해당 예약을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 2. 오버부킹 방지 (Capacity Validation)
        const { data: settings } = await supabaseServer.from('tour_settings').select('*');
        if (!settings) {
             return NextResponse.json({ error: '투어 설정을 불러올 수 없습니다.' }, { status: 500 });
        }
        
        const resolved = resolveOptionToTourSetting(reservation.option || "", settings);
        if (!resolved.tourSetting) {
             return NextResponse.json({ error: '알 수 없는 투어 옵션입니다.' }, { status: 400 });
        }

        const limit = resolved.capacity;
        const newPaxStr = reservation.pax || "0";
        const newPax = parseInt(newPaxStr.replace(/[^0-9]/g, ''), 10) || 0;
        
        // 해당 변경 희망일(new_date)의 동일한 배(옵션) 승객 수 합산
        const { data: existingReservations, error: existErr } = await supabaseServer
            .from('reservations')
            .select('pax, option')
            .eq('tour_date', new_date)
            .neq('status', '취소');

        if (existErr) throw existErr;

        let dbTotal = 0;
        if (existingReservations) {
            existingReservations.forEach((r: any) => {
                const rResolved = resolveOptionToTourSetting(r.option || "", settings);
                if (rResolved.group === resolved.group && rResolved.vessel === resolved.vessel) {
                    dbTotal += parseInt((r.pax || "0").replace(/[^0-9]/g, ''), 10) || 0;
                }
            });
        }

        const totalPax = dbTotal + newPax;
        if (totalPax > limit) {
             return NextResponse.json({ 
                 error: `해당 날짜(${new_date})는 만석이라 자동 승인이 불가합니다. 승객 (${dbTotal + newPax}/${limit}명 초과). 수동으로 조율해주세요.` 
             }, { status: 400 });
        }

        // 3. 상태 변경 및 업데이트
        // 예약 요청 태그 [변경요청] 을 제거하고, 정상적인 완료 메모를 남김.
        const cleanedNote = (current_note || "").replace(/\[변경요청\] <NewDate:.*?> <NewPickup:.*?>/g, '').trim();
        const finalNote = cleanedNote + `\n\n[✅투어 변경 자동처리 완료 (관리자)] 변경일: ${new_date} / 장소: ${new_pickup}`;

        const { error: updateErr } = await supabaseServer
            .from('reservations')
            .update({
                status: '예약확정',
                tour_date: new_date,
                pickup_location: new_pickup,
                note: finalNote.trim()
            })
            .eq('id', reservation_id);

        if (updateErr) throw updateErr;

        // 4. 이메일/알림톡 발송 로직 가이드 (안내 스니펫 연동 구조)
        const notificationSnippet = `예약 변경이 확정되었습니다.\n\n픽업 장소 및 시간, ${new_pickup}`;

        return NextResponse.json({ 
            success: true, 
            message: '성공적으로 오버부킹 체크 패스 및 승계 처리 되었습니다.',
            notificationTriggered: notificationSnippet
        });

    } catch (e: any) {
        console.error('Approve Reschedule API Error:', e);
        return NextResponse.json({ error: '승인 중 시스템 에러가 발생했습니다.' }, { status: 500 });
    }
}
