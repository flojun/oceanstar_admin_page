"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Home } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);

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
                    setOrderId(data.order_id);
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
            setOrderId(legacy_order_id);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h1>
                <p className="text-slate-500 mb-8 whitespace-pre-wrap leading-relaxed">
                    Your Ocean Star Hawaii Turtle Snorkeling{'\n'}booking is confirmed.
                </p>

                {orderId && (
                    <div className="bg-slate-50 w-full rounded-2xl p-4 mb-8 border border-slate-100">
                        <p className="text-sm text-slate-500 mb-1">Booking ID</p>
                        <p className="text-xl font-mono font-bold text-blue-600 tracking-wider p-2 bg-white rounded-lg border border-slate-200">
                            {orderId}
                        </p>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-4 rounded-xl mb-8 w-full text-left">
                    <p className="font-bold mb-1">Information</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>The receipt and voucher have been sent to your email.</li>
                        <li>You can also contact us via KakaoTalk channel.</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <Link 
                        href="/en/manage-booking" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        Manage Booking <ChevronRight size={18} />
                    </Link>
                    <Link 
                        href="/en" 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> Return to Home
                    </Link>
                </div>
            </div>
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
