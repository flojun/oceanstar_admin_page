"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { formatDateDisplay } from "@/lib/timeUtils";
import { useRouter } from "next/navigation";

interface NewReservationsViewProps {
    onBack?: () => void;
    onCountChange?: () => void;
}

export default function NewReservationsView({ onBack, onCountChange }: NewReservationsViewProps) {
    const router = useRouter();
    const [requests, setRequests] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        // 필요한 컬럼만 선택하여 응답 크기를 최소화 (27컬럼 → 8컬럼)
        const { data, error } = await supabase
            .from("reservations")
            .select("id, name, status, source, tour_date, pax, option, pickup_location")
            .eq("is_admin_checked", false)
            .order("created_at", { ascending: true })
            .limit(50);

        if (error) {
            console.error("Failed to fetch unchecked reservations:", error.message || error);
        } else {
            setRequests((data as Reservation[]) || []);
        }
        setLoading(false);
    };

    const handleCheckSingle = async (id: string) => {
        setRequests(prev => prev.filter(r => r.id !== id));
        const { error } = await supabase
            .from("reservations")
            .update({ is_admin_checked: true })
            .eq("id", id);
        if (error) {
            console.error("Failed to mark as checked:", error);
            fetchRequests();
        }
        onCountChange?.();
        window.dispatchEvent(new Event("reservation_status_changed"));
    };

    const handleCheckAll = async () => {
        if (requests.length === 0) return;
        if (!confirm(`${requests.length}건의 예약을 모두 확인 완료 처리하시겠습니까?`)) return;
        const ids = requests.map(r => r.id);
        setRequests([]); // Optimistic update
        
        // Chunk update to avoid 'URI Too Long' error for thousands of records
        const chunkSize = 200;
        let hasError = false;
        
        for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            const { error } = await supabase
                .from("reservations")
                .update({ is_admin_checked: true })
                .in("id", chunk);
                
            if (error) {
                console.error(`Failed to mark chunk as checked (${i} to ${i + chunkSize}):`, error);
                hasError = true;
            }
        }
        
        if (hasError) {
            fetchRequests(); // Revert optimistic update nicely for remaining failures
        }
        onCountChange?.();
        window.dispatchEvent(new Event("reservation_status_changed"));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "예약확정": return "text-green-600 bg-green-50";
            case "예약대기": return "text-yellow-600 bg-yellow-50";
            case "취소요청": return "text-orange-600 bg-orange-50";
            default: return "text-gray-600 bg-gray-50";
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500 text-sm">로딩 중...</div>;

    return (
        <div className="space-y-2">
            {onBack && (
                <div className="flex items-center gap-2 mb-2">
                    <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">새로운 예약</h2>
                </div>
            )}

            {requests.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-gray-500">
                        미확인 <strong className="text-blue-600">{requests.length}</strong>건
                    </span>
                    <button
                        onClick={handleCheckAll}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        전체 확인
                    </button>
                </div>
            )}

            {requests.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-green-300" />
                    미확인 예약 없음
                </div>
            ) : (
                <div className="space-y-1">
                    {requests.map((req) => (
                        <div
                            key={req.id}
                            className="bg-white rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 transition-colors text-sm flex items-start gap-2"
                        >
                            <button
                                onClick={() => handleCheckSingle(req.id)}
                                className="shrink-0 text-gray-300 hover:text-green-500 transition-colors mt-0.5"
                                title="확인 완료"
                            >
                                <Circle className="w-4 h-4" />
                            </button>
                            <div
                                className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 cursor-pointer hover:underline"
                                onClick={() => router.push(`/dashboard/all?highlight=${req.id}`)}
                                title="예약관리에서 보기"
                            >
                                <span className="font-bold text-gray-900">{req.name}</span>
                                <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${getStatusColor(req.status)}`}>{req.status}</span>
                                <span className="text-[11px] text-gray-400">{req.source}</span>
                                <span className="text-xs text-gray-500">{formatDateDisplay(req.tour_date)}</span>
                                <span className="text-xs text-gray-500">{req.pax}</span>
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{req.option}</span>
                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{req.pickup_location}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
