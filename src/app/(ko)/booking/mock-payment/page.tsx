"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";

function MockPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);

    const order_id = searchParams.get('order_id');
    const amount = searchParams.get('amount');
    const cur = searchParams.get('cur');
    const mid = searchParams.get('mid') || 'MID_TEST_001';

    const handleSimulatePayment = async () => {
        setIsProcessing(true);

        try {
            const webhookUrl = '/api/pay2pay/webhook';
            const webhookBody = {
                order_id: order_id,
                rescode: '0000',
                amount: amount,
            };

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookBody),
            });

            const data = await response.json();
            if (data.success) {
                router.push(`/booking/payment-success?order_id=${order_id}`);
            } else {
                alert('결제 처리 실패: ' + (data.error || '알 수 없는 오류'));
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            alert("웹훅(Webhook) 통신 중 시스템 에러");
            setIsProcessing(false);
        }
    };

    if (!order_id) {
        return <div className="min-h-screen flex items-center justify-center">잘못된 접근입니다.</div>;
    }

    return (
        <div className="min-h-[100svh] bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-t-4 border-blue-600">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <CreditCard size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Pay2Pay Global 결제</h1>
                <p className="text-slate-500 mb-6 text-sm">결제 시뮬레이션 환경 (실제 결제는 발생하지 않습니다)</p>

                <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                        <span className="text-slate-500">주문 번호</span>
                        <span className="font-bold">{order_id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">결제 가맹점(MID)</span>
                        <span className="font-bold">{mid}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-4 mt-4">
                        <span className="text-slate-500 font-bold">결제 금액</span>
                        <span className="text-xl font-bold text-blue-600">
                            {cur} {Number(amount).toLocaleString()}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleSimulatePayment}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                    {isProcessing ? (
                        <><Loader2 className="animate-spin" size={20} /> 결제 진행중...</>
                    ) : (
                        "가상 결제 승인하기"
                    )}
                </button>
            </div>
        </div>
    );
}

export default function MockPaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 mb-4" size={32} /></div>}>
            <MockPaymentContent />
        </Suspense>
    );
}
