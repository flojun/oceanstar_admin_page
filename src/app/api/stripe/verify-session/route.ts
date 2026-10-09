import { NextResponse } from 'next/server';
import { stripeClient, createReservationFromSession } from '@/lib/stripeBooking';
import { fromMinor } from '@/lib/money';
import { createHash } from 'crypto';

/**
 * Google Ads 향상된 전환용 이메일 해시. 원문 이메일은 브라우저로 내려보내지 않는다.
 * 구글 정규화 규칙: 앞뒤 공백 제거, 소문자, gmail.com·googlemail.com 은 @ 앞의 점을 뺀다.
 */
function hashEmailForAds(email: string | null | undefined): string | undefined {
    if (!email) return undefined;
    let e = email.trim().toLowerCase();
    const [local, domain] = e.split('@');
    if (!local || !domain) return undefined;
    if (domain === 'gmail.com' || domain === 'googlemail.com') e = `${local.replace(/\./g, '')}@${domain}`;
    return createHash('sha256').update(e).digest('hex');
}

export async function POST(req: Request) {
    if (!stripeClient) {
        return NextResponse.json({ error: 'Stripe secret key is not configured' }, { status: 500 });
    }
    try {
        const { session_id } = await req.json();

        if (!session_id) {
            return NextResponse.json({ error: '세션 ID가 없습니다.' }, { status: 400 });
        }

        const session = await stripeClient.checkout.sessions.retrieve(session_id, {
            expand: ['payment_intent'],
        });
        if (!session) {
            return NextResponse.json({ error: '유효하지 않은 결제 세션입니다.' }, { status: 404 });
        }

        const result = await createReservationFromSession(session);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            order_id: result.order_id,
            status: result.status,
            // 결제 완료 화면의 전환 이벤트용 (손님이 실제로 낸 금액)
            amount: session.amount_total != null && session.currency ? fromMinor(session.amount_total, session.currency) : undefined,
            currency: session.currency ? session.currency.toUpperCase() : undefined,
            email_sha256: hashEmailForAds(session.customer_details?.email ?? session.customer_email),
        });
    } catch (error) {
        console.error('Verify Session Error:', error);
        const message = error instanceof Error ? error.message : '서버 오류';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
