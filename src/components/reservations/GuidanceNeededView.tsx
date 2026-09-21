"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { formatDateDisplay } from "@/lib/timeUtils";
import { Check, PhoneCall } from "lucide-react";

/**
 * OTA 신규 예약은 '안내필요' 로 들어온다. 손님에게 픽업 시간·장소를 안내한 뒤
 * '예약확정' 으로 닫는 자리. 투어일이 가까운 순으로 올린다.
 */
export default function GuidanceNeededView() {
    const [rows, setRows] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            const { data, error } = await supabase
                .from("reservations")
                .select("*")
                .eq("status", "안내필요")
                .order("tour_date", { ascending: true })
                .limit(100);

            if (!alive) return;
            if (error) console.error("Error fetching guidance-needed reservations:", error.message || error);
            else setRows(data || []);
            setLoading(false);
        })();

        return () => { alive = false; };
    }, []);

    const markGuided = async (r: Reservation) => {
        if (!confirm(`${r.name} (${formatDateDisplay(r.tour_date)}) 안내 완료로 처리하고 예약확정으로 바꿀까요?`)) return;

        setProcessingId(r.id);
        const { error } = await supabase
            .from("reservations")
            .update({ status: "예약확정", is_admin_checked: true })
            .eq("id", r.id);
        setProcessingId(null);

        if (error) {
            console.error("Failed to confirm reservation:", error);
            alert("처리 중 오류가 발생했습니다.");
            return;
        }

        setRows((prev) => prev.filter((x) => x.id !== r.id));
        window.dispatchEvent(new Event("reservation_status_changed"));
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">불러오는 중...</div>;
    }

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Check className="w-12 h-12 mb-4 text-purple-100 bg-purple-500 rounded-full p-2" />
                <p className="text-[19.8px] font-medium">안내가 필요한 예약이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 bg-gray-50/50 rounded-lg">
            <h2 className="text-[19.8px] font-bold text-gray-700 mb-4">안내 필요 ({rows.length}건)</h2>
            <div className="grid gap-4">
                {rows.map((r) => (
                    <div
                        key={r.id}
                        className="bg-white rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 transition-colors text-[15.4px] flex items-start gap-2"
                    >
                        <PhoneCall className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
                        {/* 안내필요 · 경로 · 이름 · 날짜 · 인원수 · 옵션 · 픽업장소 · 연락처 순서 */}
                        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-[12.1px] px-1.5 py-0.5 rounded font-medium bg-purple-50 text-purple-700">안내필요</span>
                            <span className="text-[12.1px] text-gray-400">{r.source}</span>
                            <span className="font-bold text-gray-900">{r.name}</span>
                            <span className="font-bold text-purple-600 text-[13.2px]">{formatDateDisplay(r.tour_date)}</span>
                            <span className="text-[13.2px] text-gray-500">{r.pax}</span>
                            <span className="text-[13.2px] text-gray-400 truncate max-w-[160px]" title={r.option}>{r.option}</span>
                            <span className="text-[13.2px] text-gray-400 truncate max-w-[140px]" title={r.pickup_location}>{r.pickup_location}</span>
                            <span className="text-[13.2px] text-gray-400 truncate max-w-[110px]" title={r.contact}>{r.contact}</span>
                        </div>
                        <button
                            onClick={() => markGuided(r)}
                            disabled={processingId === r.id}
                            className="shrink-0 px-2 py-1 text-[13.2px] font-bold text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            {processingId === r.id ? "처리 중..." : "안내완료"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
