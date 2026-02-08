"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { formatDateDisplay } from "@/lib/timeUtils";
import { Check, X, AlertTriangle, DollarSign } from "lucide-react";

export default function CancellationRequestsView() {
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
        setRefundAmount(""); // Default to empty or calculate logic later
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
            const newNote = `${currentNote} [취소처리: ${new Date().toLocaleDateString()} / 환불: ${refundAmount || '0'}원 / 사유: ${refundReason}]`.trim();

            const { error } = await supabase
                .from("reservations")
                .update({
                    status: "취소",
                    note: newNote
                })
                .eq("id", selectedReservation.id);

            if (error) throw error;

            alert("취소 처리가 완료되었습니다.");
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
                    <div key={request.id} className="bg-white border-l-4 border-orange-500 rounded shadow-sm p-4 flex items-center justify-between transition-all hover:shadow-md">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">취소요청</span>
                                <span className="font-bold text-lg text-gray-800">{request.name}</span>
                                <span className="text-sm text-gray-500">({request.source})</span>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600">
                                <div>
                                    <span className="font-semibold text-gray-400 mr-1">예약일:</span>
                                    {formatDateDisplay(request.tour_date)}
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-400 mr-1">인원:</span>
                                    {request.pax}
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-400 mr-1">연락처:</span>
                                    {request.contact}
                                </div>
                            </div>
                            {request.note && (
                                <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                    <span className="mr-1">📝</span> {request.note}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={() => openProcessModal(request)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md font-bold hover:bg-red-200 transition-colors"
                            >
                                <DollarSign className="w-4 h-4" />
                                취소 및 환불 처리
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
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p><span className="font-bold">예약자:</span> {selectedReservation.name}</p>
                                <p><span className="font-bold">예약일:</span> {selectedReservation.tour_date}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">환불 예정 금액 (선택사항)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₩</span>
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
