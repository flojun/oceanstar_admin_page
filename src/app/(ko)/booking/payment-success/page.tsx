"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        // Return param 
        const order_id = searchParams.get('order_id') || searchParams.get('oid');
        if (order_id) {
            setOrderId(order_id);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-800 mb-2">결제가 성공적으로 완료되었습니다!</h1>
                <p className="text-slate-500 mb-8 whitespace-pre-wrap leading-relaxed">
                    오션스타 하와이 거북이 스노클링{'\n'}예약이 확정되었습니다.
                </p>

                {orderId && (
                    <div className="bg-slate-50 w-full rounded-2xl p-4 mb-8 border border-slate-100">
                        <p className="text-sm text-slate-500 mb-1">예약 번호</p>
                        <p className="text-xl font-mono font-bold text-blue-600 tracking-wider p-2 bg-white rounded-lg border border-slate-200">
                            {orderId}
                        </p>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-4 rounded-xl mb-8 w-full text-left">
                    <p className="font-bold mb-1">안내 사항</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                        <li>결제 영수증 및 바우처는 입력하신 이메일로 전송되었습니다.</li>
                        <li>카카오톡 채널을 통해서도 실시간 안내 및 문의가 가능합니다.</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-3 w-full">
                    <Link 
                        href="/manage-booking" 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        내 예약 확인하기 <ChevronRight size={18} />
                    </Link>
                    <Link 
                        href="/" 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={18} /> 홈페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
