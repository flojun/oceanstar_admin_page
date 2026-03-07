"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";

export default function MockPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);

    const order_id = searchParams.get('order_id');
    const amount = searchParams.get('amount');

    const handleSimulatePayment = async () => {
        setIsProcessing(true);

        try {
            // 1. Webhook 호출 시뮬레이션 (엑심베이 써버가 우리 서버 백엔드로 쏘는 과정)
            await fetch('/api/eximbay/webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    order_id: order_id,
                    rescode: '0000', // 성공 코드 시뮬레이션
                })
            });

            // 2. 예약 완료 페이지로 리다이렉트 (프론트엔드 이동)
            setTimeout(() => {
                router.push(`/booking/success?order_id=${order_id}`);
            }, 1500);

        } catch (e) {
            console.error(e);
            alert("결제 처리 중 오류 발생");
            setIsProcessing(false);
        }
    };

    if (!order_id) {
        return <div className="min-h-screen flex items-center justify-center">잘못된 접근입니다.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border-t-4 border-blue-600">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <CreditCard size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Eximbay (시뮬레이션)</h1>
                <p className="text-slate-500 mb-6 font-medium text-sm">해외 결제 테스트 페이지입니다.</p>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-left border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">주문 번호</p>
                    <p className="font-mono text-sm font-bold mb-3">{order_id}</p>
                    <p className="text-sm text-slate-500 mb-1">결제 금액</p>
                    <p className="text-xl font-extrabold text-blue-600">${amount}</p>
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
