"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { SmartInput } from "@/components/ui/SmartInput";
import { DatePicker } from "@/components/ui/DatePicker";
import { Reservation, ReservationInsert, ReservationStatus } from "@/types/reservation";
import { supabase } from "@/lib/supabase";

import { getHawaiiDateStr } from "@/lib/timeUtils";

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    reservation?: Reservation | null; // If present, edit mode
}

const INITIAL_FORM: ReservationInsert = {
    status: "예약확정",
    receipt_date: getHawaiiDateStr(), // Default to Hawaii Time
    source: "",
    name: "",
    tour_date: new Date().toISOString().split("T")[0],
    pax: "",
    option: "",
    pickup_location: "",
    contact: "",
    note: "",
    is_reconfirmed: false,
};

export function ReservationModal({
    isOpen,
    onClose,
    onSuccess,
    reservation,
}: ReservationModalProps) {
    const [formData, setFormData] = useState<ReservationInsert>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    // Explicit capacity info: { current, limit, group }
    const [capacityInfo, setCapacityInfo] = useState<{ current: number, limit: number, group: string, incoming: number } | null>(null);

    useEffect(() => {
        if (reservation) {
            setFormData({
                status: reservation.status || "",
                receipt_date: reservation.receipt_date || "",
                source: reservation.source || "",
                name: reservation.name || "",
                tour_date: reservation.tour_date || "",
                pax: reservation.pax || "",
                option: reservation.option || "",
                pickup_location: reservation.pickup_location || "",
                contact: reservation.contact || "",
                note: reservation.note || "",
                is_reconfirmed: reservation.is_reconfirmed || false,
            });
        } else {
            // Fresh Form - Ensure date is recalculated
            setFormData({
                ...INITIAL_FORM,
                receipt_date: getHawaiiDateStr(),
            });
        }
    }, [reservation, isOpen]);

    const handleChange = (field: keyof ReservationInsert, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (reservation) {
                // Update
                const { error } = await supabase
                    .from("reservations")
                    .update(formData)
                    .eq("id", reservation.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from("reservations")
                    .insert([formData]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving reservation:", error);
            alert("저장 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyList = async () => {
        try {
            // 1. Date Format: *MM/DD/YYYY
            let dateStr = "";
            if (formData.tour_date) {
                const [y, m, d] = formData.tour_date.split('-');
                dateStr = `*${m}/${d}/${y}`;
            }

            // 2. Content Format: [Source] Name / Pax명 / Option / Pickup (Note)
            // Note: Add parens if note exists.
            const notePart = formData.note ? ` (${formData.note})` : "";
            const content = `[${formData.source || '경로미정'}] ${formData.name || '미정'} / ${formData.pax || '0'} / ${formData.option || '옵션미정'} / ${formData.pickup_location || '픽업미정'}${notePart}`;

            const fullText = `${dateStr}\n${content}`;

            await navigator.clipboard.writeText(fullText);
            alert("명단이 복사되었습니다.\n\n" + fullText);
        } catch (err) {
            console.error(err);
            alert("클립보드 복사에 실패했습니다.");
        }
    };

    // Helper: Option Grouping (Duplicated from monthly/types for local check)
    const getOptionGroupKey = (option: string): string => {
        if (!option) return '기타';
        const lower = option.trim().toLowerCase();

        // Smart matching for raw inputs (before blur transformation)
        if (lower === '1' || lower.includes('1부')) return '1부';
        if (lower === '2' || lower.includes('2부')) return '2부';
        if (lower === '3' || lower.includes('3부')) return '3부';

        return '기타';
    };

    // Helper: Parse Pax
    const parsePax = (str: string): number => {
        if (!str) return 0;
        const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
        return isNaN(num) ? 0 : num;
    };

    // Real-time Overbooking Check
    useEffect(() => {
        const checkOverbooking = async () => {
            // Reset if missing core data
            if (!formData.tour_date || !formData.option) {
                setCapacityInfo(null);
                return;
            }

            const group = getOptionGroupKey(formData.option);
            if (!['1부', '2부', '3부'].includes(group)) {
                setCapacityInfo(null);
                return;
            }

            // Valid group, calculate even if pax is 0 (to show 0/45)
            const newPax = parsePax(formData.pax);

            const LIMITS: Record<string, number> = { '1부': 45, '2부': 45, '3부': 40 };
            const limit = LIMITS[group];

            try {
                const { data, error } = await supabase
                    .from("reservations")
                    .select("id, pax, option, status")
                    .eq("tour_date", formData.tour_date)
                    .neq("status", "취소");

                if (error) throw error;

                let currentTotal = 0;
                data.forEach(r => {
                    if (reservation && r.id === reservation.id) return;
                    if (getOptionGroupKey(r.option) === group) {
                        currentTotal += parsePax(r.pax);
                    }
                });

                setCapacityInfo({
                    current: currentTotal,
                    limit: limit,
                    group: group,
                    incoming: newPax
                });

            } catch (err) {
                console.error("Overbooking check failed", err);
            }
        };

        const timer = setTimeout(() => {
            checkOverbooking();
        }, 300); // 300ms faster debounce

        return () => clearTimeout(timer);
    }, [formData.tour_date, formData.option, formData.pax, reservation]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl my-8 sm:my-0 rounded-lg bg-white shadow-xl relative">



                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 sm:px-6 py-4 bg-white sticky top-0 z-10 rounded-t-lg">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        {reservation ? "예약 수정" : "새 예약 등록"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-4 sm:p-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                            {/* Status */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">진행상태</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                                    value={formData.status}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                >
                                    <option value="예약확정">예약확정</option>
                                    <option value="예약대기">예약대기</option>
                                    <option value="취소">취소</option>
                                    <option value="대기">대기</option>
                                </select>
                            </div>

                            {/* Source - Smart Input */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">예약경로 (자동변환)</label>
                                <SmartInput
                                    transformType="source"
                                    placeholder="예: m→M, z→Z, t→T"
                                    value={formData.source}
                                    onValueChange={(val) => handleChange("source", val)}
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">예약자명</label>
                                <SmartInput
                                    value={formData.name}
                                    onValueChange={(val) => handleChange("name", val)}
                                />
                            </div>

                            {/* Receipt Date - Custom DatePicker */}
                            <div>
                                <DatePicker
                                    label="접수일"
                                    required
                                    value={formData.receipt_date}
                                    onChange={(val) => handleChange("receipt_date", val)}
                                />
                            </div>

                            {/* Tour Date - Custom DatePicker */}
                            <div>
                                <DatePicker
                                    label="예약일"
                                    required
                                    value={formData.tour_date}
                                    onChange={(val) => handleChange("tour_date", val)}
                                />
                            </div>

                            {/* Pax - Smart Input */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">인원 (자동변환)</label>
                                <SmartInput
                                    transformType="pax"
                                    placeholder="숫자 입력 시 '명' 자동 추가"
                                    value={formData.pax}
                                    onValueChange={(val) => handleChange("pax", val)}
                                />
                            </div>

                            {/* Option - Smart Input */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">옵션 (자동변환)</label>
                                <SmartInput
                                    transformType="option"
                                    placeholder="숫자 입력 시 '부' 자동 추가"
                                    value={formData.option}
                                    onValueChange={(val) => handleChange("option", val)}
                                />
                                {/* Capacity Indicator (DEBUG MODE) */}
                                {(formData.option || '').length > 0 && (
                                    <div className="mt-1">
                                        {!capacityInfo ? (
                                            <div className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500 flex items-center gap-1">
                                                <span className="animate-spin">⌛</span> 확인 중... [{formData.option}]
                                            </div>
                                        ) : (
                                            <div className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 font-bold ${(capacityInfo.current + capacityInfo.incoming) > capacityInfo.limit
                                                ? "bg-red-100 text-red-700 animate-pulse"
                                                : "bg-blue-50 text-blue-700"
                                                }`}>
                                                {(capacityInfo.current + capacityInfo.incoming) > capacityInfo.limit ? "⚠️" : "✓"}
                                                <span>
                                                    {capacityInfo.group}: {capacityInfo.current} + {capacityInfo.incoming} = {capacityInfo.current + capacityInfo.incoming}/{capacityInfo.limit}명
                                                    {/* DEBUG: {JSON.stringify(capacityInfo)} */}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Pickup Location */}
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">픽업장소</label>
                                <SmartInput
                                    value={formData.pickup_location}
                                    onValueChange={(val) => handleChange("pickup_location", val)}
                                />
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
                                <SmartInput
                                    value={formData.contact}
                                    onValueChange={(val) => handleChange("contact", val)}
                                />
                            </div>

                            {/* Note */}
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">기타사항</label>
                                <textarea
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                                    rows={3}
                                    value={formData.note}
                                    onChange={(e) => handleChange("note", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer - Sticky at bottom */}
                    <div className="border-t bg-gray-50 px-4 sm:px-6 py-4 flex items-center justify-between sticky bottom-0 rounded-b-lg">
                        <button
                            type="button"
                            onClick={handleCopyList}
                            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            명단복사
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {loading ? "저장 중..." : (reservation ? "수정완료" : "등록하기")}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
