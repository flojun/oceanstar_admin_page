"use client";

import { CheckCircle, MapPin, Calendar, Clock, Download, ArrowRight, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { toPng } from 'html-to-image';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('order_id');
    const voucherRef = useRef<HTMLDivElement>(null);

    const [reservation, setReservation] = useState<any>(null);
    const [pickupData, setPickupData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!orderId) return;
            try {
                const res = await fetch(`/api/reservation-detail?order_id=${orderId}`);
                const data = await res.json();
                if (data.reservation) {
                    setReservation(data.reservation);
                    setPickupData(data.pickupData || null);
                }
            } catch (err) {
                console.error("Error fetching reservation:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [orderId]);

    const handleDownloadVoucher = async () => {
        if (!voucherRef.current) return;
        try {
            const dataUrl = await toPng(voucherRef.current, { quality: 0.95 });
            const link = document.createElement('a');
            link.download = `oceanstar-voucher-${orderId}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Voucher download error:", err);
            alert("바우처 저장에 실패했습니다. 스크린샷으로 저장해 주세요.");
        }
    };

    if (!orderId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <p>잘못된 접근입니다.</p>
                <button onClick={() => router.push('/')} className="mt-4 text-blue-600 underline">홈으로 돌아가기</button>
            </div>
        );
    }

    // Compute exact pickup time based on reservation option (1부, 2부, 등) and the DB schedule
    let finalTime = reservation?.pickup_time || "개별 체크";
    if (pickupData && reservation?.option) {
        if (reservation.option.includes('1부') && pickupData.time_1) finalTime = pickupData.time_1;
        else if (reservation.option.includes('2부') && pickupData.time_2) finalTime = pickupData.time_2;
        else if (reservation.option.includes('3부') && pickupData.time_3) finalTime = pickupData.time_3;
        // Fallback for '직접' 3부 in case time_3 column doesn't exist yet
        else if (reservation.option.includes('3부') && pickupData.name === '직접') finalTime = '14:50:00';
    }
    
    // Format "07:40:00" to "07:40 AM"
    if (finalTime && finalTime.match(/^\d{2}:\d{2}/)) {
        const parts = finalTime.split(':');
        const hour = parseInt(parts[0], 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        finalTime = `${h12.toString().padStart(2, '0')}:${parts[1]} ${ampm}`;
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <div ref={voucherRef} className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden">
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
                            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm font-medium flex flex-col gap-2 border border-blue-100 shadow-inner">
                                <p className="flex items-start gap-2">
                                    <CheckCircle size={16} className="shrink-0 mt-0.5" />
                                    위 <strong>예약 번호(6자리)</strong>로 오션스타 메인 홈페이지에서 생생한 후기를 남기실 수 있습니다!
                                </p>
                                <p className="flex items-start gap-2">
                                    <CheckCircle size={16} className="shrink-0 mt-0.5" />
                                    6자리 예약번호로 예약일 변경 및 취소가 가능합니다!
                                </p>
                                <p className="flex items-start gap-2">
                                    <CheckCircle size={16} className="shrink-0 mt-0.5" />
                                    아래에 바우처를 캡쳐 및 저장해주세요!
                                </p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin className="text-blue-500" size={20} /> 스마트 픽업 안내
                        </h2>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="animate-spin text-blue-500" size={24} />
                                </div>
                            ) : reservation ? (
                                <div className="relative z-10">
                                    <p className="text-sm font-semibold text-blue-800 mb-1">지정 픽업 장소</p>
                                    <p className="text-xl font-extrabold text-blue-900 mb-4">
                                        {reservation.pickup_location === 'DIRECT' || reservation.pickup_location === '직접' 
                                            ? '개별 이동 (항구 직접 도착)' 
                                            : reservation.pickup_location}
                                    </p>
                                    
                                    {(reservation.pickup_location === 'DIRECT' || reservation.pickup_location === '직접') && (
                                        <p className="text-sm font-bold text-slate-700 mb-4 mt-[-10px] break-keep">
                                            주소: 1125 Ala Moana Blvd D110, Honolulu, HI 96814
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm whitespace-nowrap">
                                                <Calendar size={16} className="text-blue-500 shrink-0" /> 
                                                {reservation.tour_date ? `${reservation.tour_date} (${['일', '월', '화', '수', '목', '금', '토'][new Date(reservation.tour_date).getDay()]})` : ''}
                                            </div>
                                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm whitespace-nowrap">
                                                <Clock size={16} className="text-blue-500 shrink-0" /> 
                                                {reservation.pickup_location === 'DIRECT' ? '오전 07:45까지 집결' : finalTime}
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-700/80 font-medium pl-1">* 위 표시된 일정은 모두 하와이 현지 시각 기준입니다.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative z-10 text-center text-slate-500 py-4">
                                    예약 정보를 불러오지 못했습니다.
                                </div>
                            )}
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
                            <button 
                                onClick={handleDownloadVoucher}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                            >
                                <Download size={18} /> 바우처 저장
                            </button>
                            <Link href="/" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
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
