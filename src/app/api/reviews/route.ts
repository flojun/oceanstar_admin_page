import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all visible reviews
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('is_hidden', false)
            .order('created_at', { ascending: false });

        if (error) {
            // reviews 테이블이 없을 수 있으므로 예외처리
            if (error.code === '42P01') {
                 return NextResponse.json({ success: true, reviews: [] });
            }
            throw error;
        }

        return NextResponse.json({ success: true, reviews: data });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json({ success: false, error: '리뷰를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// POST: Submit a new review
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { order_id, author_name, content, rating } = body;

        if (!order_id || !author_name || !content || !rating) {
            return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 });
        }

        const normalizedOrderId = order_id.toUpperCase().trim();

        // 1. Check reservation validity & status
        const { data: reservation, error: resError } = await supabase
            .from('reservations')
            .select('status')
            .eq('order_id', normalizedOrderId)
            .single();

        if (resError || !reservation) {
            return NextResponse.json({ success: false, error: '존재하지 않거나 잘못된 예약번호입니다.' }, { status: 404 });
        }

        // 2. Status Validation ('결제대기', '결제실패', '취소', '환불' 등 불가)
        const blockStatuses = ['결제대기', '결제실패', '취소', '환불'];
        const isBlocked = blockStatuses.some(s => reservation.status.includes(s));
        
        if (isBlocked) {
            return NextResponse.json({ success: false, error: '취소/환불되거나 결제 대기 중인 예약건은 리뷰를 작성할 수 없습니다.' }, { status: 403 });
        }

        // 3. Check for existing review (1 예약 1 리뷰 제한)
        const { data: existingReview, error: exError } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', normalizedOrderId)
            .maybeSingle();

        if (existingReview) {
            return NextResponse.json({ success: false, error: '이미 리뷰가 등록된 예약번호입니다.' }, { status: 409 });
        }

        // 4. Insert Review
        const { error: insertError } = await supabase
            .from('reviews')
            .insert([{
                order_id: normalizedOrderId,
                author_name,
                content,
                rating,
                is_hidden: false
            }]);

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: '리뷰가 성공적으로 등록되었습니다.' });

    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
