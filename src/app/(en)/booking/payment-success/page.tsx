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
                    router.replace(`/booking/success?order_id=${data.order_id}`);
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
            router.replace(`/booking/success?order_id=${legacy_order_id}`);
        }
    }, [searchParams, router]);

    if (verifyFailed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
                    <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                        <AlertTriangle size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">We couldn&apos;t verify your payment</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Your payment may still have gone through.
                        <strong className="text-slate-800"> Please do not pay again</strong> — contact us
                        with the reference below and we will confirm your booking right away.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
                        <p className="text-xs font-bold text-slate-500 mb-1">Email</p>
                        <p className="text-sm font-bold text-slate-800">hioceanstar@gmail.com</p>
                        {sessionId && (
                            <>
                                <p className="text-xs font-bold text-slate-500 mt-3 mb-1">Reference number</p>
                                <p className="text-xs font-mono text-slate-600 break-all">{sessionId}</p>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/manage-booking"
                            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-colors"
                        >
                            Manage My Booking
                        </Link>
                        <Link
                            href="/"
                            className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition-colors"
                        >
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-700">Verifying payment...</h2>
            <p className="text-slate-500 mt-2">Please wait a moment.</p>
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
