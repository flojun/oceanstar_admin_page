import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET: Fetch all visible Google reviews
export async function GET() {
    try {
        const { data, error } = await supabaseServer
            .from('google_reviews')
            .select('*')
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ success: true, reviews: [] });
            }
            throw error;
        }

        return NextResponse.json({ success: true, reviews: data });
    } catch (error) {
        console.error('Error fetching google reviews:', error);
        return NextResponse.json({ success: false, error: '구글 리뷰를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
