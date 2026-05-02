"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, Suspense } from "react";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const verifySession = async (sessionId: string) => {
            try {
                const res = await fetch('/api/stripe/verify-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId })
                });
                const data = await res.json();
                if (data.success && data.order_id) {
                    router.replace(`/booking/success?order_id=${data.order_id}`);
                } else {
                    alert("결제 검증에 실패했습니다.");
                    router.replace("/");
                }
            } catch (err) {
                console.error('Session verify failed', err);
            }
        };

        const session_id = searchParams.get('session_id');
        const legacy_order_id = searchParams.get('order_id') || searchParams.get('oid');

        if (session_id) {
            verifySession(session_id);
        } else if (legacy_order_id) {
            router.replace(`/booking/success?order_id=${legacy_order_id}`);
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-700">결제 내역을 확인하고 있습니다...</h2>
            <p className="text-slate-500 mt-2">잠시만 기다려주세요.</p>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PaymentSuccessContent />
        </Suspense>
    );
}
