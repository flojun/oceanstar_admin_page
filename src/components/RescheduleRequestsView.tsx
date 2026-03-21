"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { formatDateDisplay } from "@/lib/timeUtils";
import { Check, X, AlertTriangle, CalendarRange } from "lucide-react";

export default function RescheduleRequestsView() {
    const [requests, setRequests] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal State
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [newDate, setNewDate] = useState<string>("");
    const [newPickup, setNewPickup] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("reservations")
            .select("*")
            .eq("status", "변경요청")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching reschedule requests:", error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const parseNoteForChanges = (note: string | null) => {
        if (!note) return { date: "", pickup: "" };
        const dateMatch = note.match(/<NewDate:(.*?)>/);
        const pickupMatch = note.match(/<NewPickup:(.*?)>/);
        return {
            date: dateMatch ? dateMatch[1].trim() : "",
            pickup: pickupMatch ? pickupMatch[1].trim() : ""
        };
    };

    const openProcessModal = (reservation: Reservation) => {
        setSelectedReservation(reservation);
        const parsed = parseNoteForChanges(reservation.note);
        setNewDate(parsed.date);
        setNewPickup(parsed.pickup);
        setIsModalOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedReservation) return;

        setProcessingId(selectedReservation.id);

        try {
            const res = await fetch('/api/admin/approve-reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservation_id: selectedReservation.id,
                    new_date: newDate,
                    new_pickup: newPickup,
                    current_note: selectedReservation.note
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(`요류 발생: \n${data.error}`);
            } else {
                alert(`승인 처리되었습니다.\n\n(발송 예정 스니펫)\n${data.notificationTriggered}`);
                // Remove from local list to trigger UI update instantly
                setRequests(prev => prev.filter(r => r.id !== selectedReservation.id));
                setIsModalOpen(false);
            }

        } catch (error) {
            console.error("Error processing reschedule approval:", error);
            alert("처리 중 네트워크 오류가 발생했습니다.");
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
                <Check className="w-12 h-12 mb-4 text-blue-100 bg-blue-500 rounded-full p-2" />
                <p className="text-lg font-medium">현재 들어온 변경 요청이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 bg-gray-50/50 rounded-lg">
            <h2 className="text-lg font-bold text-gray-700 mb-4">변경 요청 목록 ({requests.length}건)</h2>
            <div className="grid gap-4">
                {requests.map((request) => {
                    const parsed = parseNoteForChanges(request.note);
                    return (
                        <div key={request.id} className="bg-white border-l-4 border-blue-500 rounded shadow-sm p-4 flex items-center justify-between transition-all hover:shadow-md">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">변경요청</span>
                                    <span className="font-bold text-lg text-gray-800">{request.name}</span>
                                    <span className="text-sm text-gray-500">({request.source})</span>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600 mb-2">
                                    <div>
                                        <span className="font-semibold text-gray-400 mr-1">기존 예약일:</span>
                                        <span className="line-through text-gray-400">{formatDateDisplay(request.tour_date)}</span>
                                        <span className="mx-2 text-blue-500 font-bold">➜</span>
                                        <span className="font-bold text-blue-600">{formatDateDisplay(parsed.date)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600">
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
                                    <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                                        <span className="mr-1">📝</span> {request.note}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => openProcessModal(request)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md font-bold hover:bg-blue-200 transition-colors"
                                >
                                    <CalendarRange className="w-5 h-5" />
                                    변경 내용 확인 및 승인
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Approve Process Modal */}
            {isModalOpen && selectedReservation && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                            <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                예약 일정/픽업 변경 승인
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-3 rounded text-sm space-y-1 border border-gray-200">
                                <p><span className="font-bold w-20 inline-block text-gray-500">예약자:</span> {selectedReservation.name}</p>
                                <p><span className="font-bold w-20 inline-block text-gray-500">인원:</span> {selectedReservation.pax}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="p-4 bg-gray-100 rounded-lg text-gray-500">
                                    <p className="text-xs font-bold mb-2">기존 예약 정보</p>
                                    <p className="font-medium text-sm mb-1">{selectedReservation.tour_date}</p>
                                    <p className="text-xs">{selectedReservation.pickup_location}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-blue-800">
                                    <p className="text-xs font-bold mb-2 text-blue-600">변경 희망 정보</p>
                                    <p className="font-bold text-sm mb-1">{newDate}</p>
                                    <p className="text-xs font-medium">{newPickup}</p>
                                </div>
                            </div>
                            
                            <p className="text-xs text-blue-600 font-bold">※ [승인 완료] 클릭 시, 백엔드에서 오버부킹 여부를 자동으로 검사합니다. 잔여 좌석이 충분할 경우에만 시스템에 반영됩니다.</p>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
                            >
                                닫기
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={processingId === selectedReservation.id}
                                className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {processingId === selectedReservation.id ? "처리 중..." : <><Check className="w-4 h-4" /> 승인 완료</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
