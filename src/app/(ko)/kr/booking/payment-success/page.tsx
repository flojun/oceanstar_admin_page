"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verifyFailed, setVerifyFailed] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const verifySession = async (session_id: string) => {
            try {
                const res = await fetch('/api/stripe/verify-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id })
                });
                const data = await res.json();
                if (data.success && data.order_id) {
                    router.replace(`/kr/booking/success?order_id=${data.order_id}`);
                } else {
                    setVerifyFailed(true);
                }
            } catch (err) {
                console.error('Session verify failed', err);
                setVerifyFailed(true);
            }
        };

        const session_id = searchParams.get('session_id');
        const legacy_order_id = searchParams.get('order_id') || searchParams.get('oid');

        if (session_id) {
            setSessionId(session_id);
            verifySession(session_id);
        } else if (legacy_order_id) {
            router.replace(`/kr/booking/success?order_id=${legacy_order_id}`);
        }
    }, [searchParams, router]);

    if (verifyFailed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
                    <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                        <AlertTriangle size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">결제 내역을 확인하지 못했습니다</h2>
                    <p className="text-sm text-slate-600 leading-relaxed break-keep mb-4">
                        결제 자체는 정상적으로 처리되었을 수 있습니다.
                        <strong className="text-slate-800"> 중복 결제를 피하기 위해 다시 결제하지 마시고</strong>,
                        아래 채널로 문의해 주시면 바로 확인해 드리겠습니다.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
                        <p className="text-xs font-bold text-slate-500 mb-1">카카오톡 채널</p>
                        <p className="text-sm font-bold text-slate-800">hioceanstar</p>
                        {sessionId && (
                            <>
                                <p className="text-xs font-bold text-slate-500 mt-3 mb-1">문의 시 알려주실 번호</p>
                                <p className="text-xs font-mono text-slate-600 break-all">{sessionId}</p>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/kr/manage-booking"
                            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-colors"
                        >
                            내 예약 조회
                        </Link>
                        <Link
                            href="/kr"
                            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition-colors"
                        >
                            홈으로
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
