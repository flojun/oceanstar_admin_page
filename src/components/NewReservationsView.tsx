"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { Check, ArrowLeft } from "lucide-react";

interface NewReservationsViewProps {
    onBack: () => void;
}

export default function NewReservationsView({ onBack }: NewReservationsViewProps) {
    const [requests, setRequests] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("reservations")
            .select("*")
            .eq("status", "예약대기")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch waiting reservations:", error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const handleConfirm = async (id: string) => {
        if (!confirm("이 예약을 확정하시겠습니까?")) return;

        try {
            const { error } = await supabase
                .from("reservations")
                .update({ status: "예약확정" })
                .eq("id", id);

            if (error) throw error;

            // Remove from list
            setRequests(prev => prev.filter(r => r.id !== id));
            alert("예약이 확정되었습니다.");
        } catch (error) {
            console.error("Failed to confirm reservation:", error);
            alert("처리 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">새로운 예약 (대기)</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                    {requests.length}건
                </span>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">대기 중인 예약이 없습니다.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-lg text-gray-900">{req.name}</span>
                                    <span className="text-sm text-gray-500">{req.contact}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded border ${req.source === 'MyRealTrip' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            req.source === 'ZoomZoom' ? 'bg-green-50 text-green-600 border-green-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {req.source}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">투어일:</span> {req.tour_date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">인원:</span> {req.pax}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium">옵션:</span> {req.option}
                                    </div>
                                </div>
                                {req.note && (
                                    <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mt-2">
                                        memo: {req.note}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleConfirm(req.id)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap"
                                >
                                    <Check className="w-4 h-4" />
                                    예약 확정
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
