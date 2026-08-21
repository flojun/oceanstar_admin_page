import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getAdminUser } from '@/lib/adminAuth';

export async function POST(request: Request) {
    try {
        // 인증 검사
        const user = await getAdminUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { updates } = body; // Expecting an array of { id, time_1, time_2, time_3 }

        if (!Array.isArray(updates)) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload format' },
                { status: 400 }
            );
        }

        // Supabase upsert/bulk update
        const { error } = await supabaseServer
            .from('pickup_locations')
            .upsert(
                updates.map((item: any) => ({
                    id: item.id,
                    time_1: item.time_1 || null,
                    time_2: item.time_2 || null,
                    time_3: item.time_3 || null,
                    updated_at: new Date().toISOString()
                })),
                { onConflict: 'id' }
            );

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: '픽업 시간이 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('Failed to update pickup locations:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
