import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET: Fetch all visible reviews
export async function GET() {
    try {
        const { data, error } = await supabaseServer
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
        const formData = await req.formData();
        const order_id = formData.get('order_id') as string;
        const author_name = formData.get('author_name') as string;
        const content = formData.get('content') as string;
        const ratingStr = formData.get('rating') as string;
        const rating = parseInt(ratingStr, 10);
        
        const files = formData.getAll('images') as File[];

        if (!order_id || !author_name || !content || !rating) {
            return NextResponse.json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 });
        }

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB
        const MAX_FILES = 5;

        if (files.length > MAX_FILES) {
            return NextResponse.json({ success: false, error: '사진은 최대 5장까지만 업로드 가능합니다.' }, { status: 400 });
        }

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json({ success: false, error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, WEBP만 가능)' }, { status: 400 });
            }
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json({ success: false, error: `파일 크기가 너무 큽니다. (최대 1.5MB): ${file.name}` }, { status: 400 });
            }
        }

        const normalizedOrderId = order_id.toUpperCase().trim();

        // 1. Check reservation validity & status
        const { data: reservation, error: resError } = await supabaseServer
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
        const { data: existingReview } = await supabaseServer
            .from('reviews')
            .select('id')
            .eq('order_id', normalizedOrderId)
            .maybeSingle();

        if (existingReview) {
            return NextResponse.json({ success: false, error: '이미 리뷰가 등록된 예약번호입니다.' }, { status: 409 });
        }

        // 4. Upload images
        const uploadedUrls: string[] = [];
        for (const file of files) {
            const ext = file.name.split('.').pop() || 'jpg';
            const safeFileName = `${crypto.randomUUID()}-${Date.now()}.${ext}`;
            const filePath = `${safeFileName}`;
            
            const fileBuffer = await file.arrayBuffer();

            const { error: uploadError } = await supabaseServer.storage
                .from('review-images')
                .upload(filePath, fileBuffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error("Image upload error:", uploadError);
                return NextResponse.json({ success: false, error: `이미지 업로드에 실패했습니다: ${uploadError.message}` }, { status: 500 });
            }

            const { data: publicUrlData } = supabaseServer.storage
                .from('review-images')
                .getPublicUrl(filePath);

            if (publicUrlData && publicUrlData.publicUrl) {
                uploadedUrls.push(publicUrlData.publicUrl);
            }
        }

        // DeepL Auto Translation Strategy
        let content_en: string | null = null;
        let author_name_en: string | null = author_name; // Do not translate proper names directly

        try {
            const deeplKey = process.env.DEEPL_API_KEY;
            if (deeplKey) {
                const isFree = deeplKey.endsWith(':fx');
                const deeplUrl = isFree 
                    ? 'https://api-free.deepl.com/v2/translate' 
                    : 'https://api.deepl.com/v2/translate';

                const response = await fetch(deeplUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `DeepL-Auth-Key ${deeplKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: [content],
                        target_lang: 'EN-US'
                    })
                });

                if (response.ok) {
                    const dlData = await response.json();
                    if (dlData.translations && dlData.translations.length > 0) {
                        content_en = dlData.translations[0].text;
                    }
                } else {
                    console.warn(`DeepL translation failed with status ${response.status}`);
                }
            }
        } catch (translationError) {
            console.error("DeepL Translation Error:", translationError);
            // Non-blocking: let DB write proceed with nulls
        }

        // 5. Insert Review
        const { error: insertError } = await supabaseServer
            .from('reviews')
            .insert([{
                order_id: normalizedOrderId,
                author_name,
                content,
                rating,
                is_hidden: false,
                image_urls: uploadedUrls,
                content_en,
                author_name_en
            }]);

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: '리뷰가 성공적으로 등록되었습니다.' });

    } catch (error) {
        console.error('Error submitting review:', error);
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
