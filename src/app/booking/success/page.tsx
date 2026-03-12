"use client";

import { CheckCircle, MapPin, Calendar, Clock, Download, ArrowRight, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('order_id');

    if (!orderId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <p>잘못된 접근입니다.</p>
                <button onClick={() => router.push('/')} className="mt-4 text-blue-600 underline">홈으로 돌아가기</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-600 p-8 text-center text-white relative">
                        <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4 shadow-inner">
                            <CheckCircle size={40} className="text-blue-500" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">예약이 확정되었습니다!</h1>
                        <p className="text-blue-100 font-medium tracking-wide">Ocean Star 투어를 이용해주셔서 감사합니다.</p>
                    </div>

                    {/* Receipt Body */}
                    <div className="p-8">
                        <div className="flex flex-col gap-2 pb-6 mb-6 border-b border-dashed border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">예약 번호</span>
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg text-lg tracking-widest">
                                    {orderId}
                                </span>
                            </div>
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm font-medium flex items-start gap-2 border border-blue-100 shadow-inner">
                                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                                <p>위 <strong>예약 번호(6자리)</strong>로 오션스타 메인 홈페이지에서 생생한 후기를 남기실 수 있습니다!</p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin className="text-blue-500" size={20} /> 스마트 픽업 안내
                        </h2>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

                            {/* In a real app, you would fetch these details from DB using orderId */}
                            <div className="relative z-10">
                                <p className="text-sm font-semibold text-blue-800 mb-1">지정 픽업 장소</p>
                                <p className="text-xl font-extrabold text-blue-900 mb-4">Ilikai Hotel Flagpole</p>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm">
                                        <Calendar size={16} className="text-blue-500" /> 2026-04-10
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm">
                                        <Clock size={16} className="text-blue-500" /> 07:30 AM
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm mb-8">
                            <h3 className="font-bold text-slate-900 text-base mb-3 border-b pb-2">준비물 및 유의사항</h3>
                            <ul className="space-y-3 font-medium text-slate-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                                    <span>수건, 썬크림 멀미약은 챙겨오시길 권장합니다.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                                    <span>픽업 시간 10분 전까지 지정된 픽업 장소에 대기 부탁드립니다.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                                    <span>구명조끼와 스노클 장비는 무료로 대여해 드립니다.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                            <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Download size={18} /> 바우처 저장
                            </button>
                            <Link href="/" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                홈으로 이동 <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 mb-4" size={32} /></div>}>
            <SuccessContent />
        </Suspense>
    );
}
