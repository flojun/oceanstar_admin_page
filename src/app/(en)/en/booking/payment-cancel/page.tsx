"use client";

import Link from "next/link";
import { XCircle, Home, RotateCcw } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentCancelContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id') || searchParams.get('oid');

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <XCircle size={48} className="text-red-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Canceled</h1>
                <p className="text-slate-500 mb-8 whitespace-pre-wrap leading-relaxed">
                    You have canceled the payment or an error occurred during the transaction.
                </p>

                {orderId && (
                    <div className="bg-slate-50 w-full rounded-2xl p-4 mb-8 border border-slate-100">
                        <p className="text-sm text-slate-500 mb-1">Canceled Booking ID</p>
                        <p className="text-xl font-mono font-bold text-slate-600 tracking-wider p-2 bg-white rounded-lg border border-slate-200">
                            {orderId}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3 w-full">
                    <Link 
                        href="/en" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={18} /> Try Booking Again
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

export default function PaymentCancelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <PaymentCancelContent />
        </Suspense>
    );
}
