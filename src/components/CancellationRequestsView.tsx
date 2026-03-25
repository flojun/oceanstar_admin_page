"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { formatDateDisplay } from "@/lib/timeUtils";
import { Check, X, AlertTriangle, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CancellationRequestsView() {
    const router = useRouter();
    const [requests, setRequests] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [refundAmount, setRefundAmount] = useState<string>("");
    const [refundReason, setRefundReason] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("reservations")
            .select("*")
            .eq("status", "취소요청")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching cancellation requests:", error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const openProcessModal = (reservation: Reservation) => {
        setSelectedReservation(reservation);
        
        let defaultAmount = "";
        if (reservation.expected_refund != null) {
            const amountNum = Number(reservation.expected_refund);
            defaultAmount = reservation.currency === 'USD' 
                ? amountNum.toFixed(2) 
                : Math.floor(amountNum).toString();
        }

        setRefundAmount(defaultAmount);
        setRefundReason("고객 요청으로 인한 취소");
        setIsModalOpen(true);
    };

    const handleProcessCancellation = async () => {
        if (!selectedReservation) return;

        setProcessingId(selectedReservation.id);

        // Optimistic update
        const originalRequests = [...requests];
        setRequests(prev => prev.filter(r => r.id !== selectedReservation.id));
        setIsModalOpen(false);

        try {
            // Update status to '취소' and append note
            const currentNote = selectedReservation.note || "";
            const currencySymbol = selectedReservation.currency === 'USD' ? '$' : '₩';
            const newNote = `${currentNote} [취소처리: ${new Date().toLocaleDateString()} / 환불: ${currencySymbol}${refundAmount || '0'} / 사유: ${refundReason}]`.trim();

            const { error } = await supabase
                .from("reservations")
                .update({
                    status: "취소",
                    note: newNote
                })
                .eq("id", selectedReservation.id);

            if (error) throw error;

            alert("취소 처리가 완료되었습니다.");
            window.dispatchEvent(new Event("reservation_status_changed"));
        } catch (error) {
            console.error("Error processing cancellation:", error);
            alert("처리 중 오류가 발생했습니다.");
            // Revert optimistic update
            setRequests(originalRequests);
        } finally {
            setProcessingId(null);
            setSelectedReservation(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Check className="w-12 h-12 mb-4 text-green-100 bg-green-500 rounded-full p-2" />
                <p className="text-lg font-medium">현재 들어온 취소 요청이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 bg-gray-50/50 rounded-lg">
            <h2 className="text-lg font-bold text-gray-700 mb-4">취소 요청 목록 ({requests.length}건)</h2>
            <div className="grid gap-4">
                {requests.map((request) => (
                    <div 
                        key={request.id} 
                        onClick={() => openProcessModal(request)}
                        className="bg-white rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors text-sm flex flex-col gap-2 cursor-pointer group"
                    >
                        {/* Top Row */}
                        <div className="flex items-start gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); openProcessModal(request); }}
                                className="shrink-0 text-gray-300 group-hover:text-orange-500 transition-colors mt-0.5"
                                title="취소 처리"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="font-bold text-gray-900">{request.name}</span>
                                <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-orange-50 text-orange-600">취소요청</span>
                                <span className="text-[11px] text-gray-400">{request.source}</span>
                                <span className="text-xs text-gray-500">{formatDateDisplay(request.tour_date)}</span>
                                <span className="text-xs text-gray-500">{request.pax}</span>
                                <span className="text-xs text-gray-400 truncate max-w-[120px]" title={request.contact}>{request.contact}</span>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex flex-row items-center justify-between ml-6 pl-2 border-l-2 border-gray-100 mt-1 gap-2">
                            <span className="text-xs text-gray-500 line-clamp-2 leading-relaxed" title={request.note || "기타 사유 없음"}>
                                <span className="mr-1">📝</span> {request.note || "기타 사유 없음"}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); openProcessModal(request); }}
                                className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                            >
                                취소 처리
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Refund Process Modal */}
            {isModalOpen && selectedReservation && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                취소 처리 및 환불
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded text-sm space-y-1.5 border border-gray-100">
                                <div className="flex items-center justify-between mb-1">
                                    <p><span className="font-bold w-20 inline-block text-gray-500">예약자:</span> <span className="font-semibold text-gray-900">{selectedReservation.name}</span></p>
                                    {selectedReservation.order_id && (
                                        <p><span className="font-bold text-gray-500">예약 번호:</span> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">{selectedReservation.order_id}</span></p>
                                    )}
                                </div>
                                <p><span className="font-bold w-20 inline-block text-gray-500">예약일:</span> {selectedReservation.tour_date}</p>
                                <p><span className="font-bold w-20 inline-block text-gray-500">인원수:</span> {selectedReservation.pax}</p>
                                <p><span className="font-bold w-20 inline-block text-gray-500">옵션:</span> {selectedReservation.option}</p>
                                <p className="flex items-start">
                                    <span className="font-bold w-20 shrink-0 inline-block text-gray-500">픽업장소:</span> 
                                    <span className="break-words">{selectedReservation.pickup_location}</span>
                                </p>
                                {selectedReservation.note && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="font-bold text-gray-500 mb-1.5">기타 정보 / 진행 상황:</p>
                                        <p className="whitespace-pre-wrap text-gray-600 leading-relaxed text-xs p-2.5 bg-white rounded border border-gray-200">{selectedReservation.note}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">환불 예정 금액 (선택사항)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                                        {selectedReservation.currency === 'USD' ? '$' : '₩'}
                                    </span>
                                    <input
                                        type="text"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        placeholder="환불 금액 입력"
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 / 메모</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-24 resize-none"
                                    placeholder="취소 사유를 입력하세요"
                                ></textarea>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
                            >
                                닫기
                            </button>
                            <button
                                onClick={handleProcessCancellation}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                처리 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
