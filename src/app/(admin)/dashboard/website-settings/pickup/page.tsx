"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, MapPin } from "lucide-react";

type PickupLocation = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    time_1: string | null;
    time_2: string | null;
    time_3: string | null;
    order_idx: number;
};

export default function PickupSettingsPage() {
    const [locations, setLocations] = useState<PickupLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/pickup');
            const data = await res.json();

            if (!Array.isArray(data)) {
                throw new Error("Invalid data format returned");
            }
            // Ensure order by order_idx
            const sorted = data.sort((a, b) => (a.order_idx || 0) - (b.order_idx || 0));
            const formatted = sorted.map((loc: any) => ({
                ...loc,
                time_1: loc.time_1 ? loc.time_1.substring(0, 5) : null,
                time_2: loc.time_2 ? loc.time_2.substring(0, 5) : null,
                time_3: loc.time_3 ? loc.time_3.substring(0, 5) : null,
            }));
            setLocations(formatted);
        } catch (e) {
            console.error("데이터 로딩 실패:", e);
            alert("픽업 장소 목록을 불러오는데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeChange = (index: number, field: 'time_1' | 'time_2' | 'time_3', hourOrMinute: 'hour' | 'minute', val: string) => {
        const newLocations = [...locations];
        const currentVal = newLocations[index][field] || "00:00";
        const [currentH, currentM] = currentVal.split(":");

        let newTime: string | null = null;
        if (val === '') {
            newTime = null; // Clear if empty
        } else if (hourOrMinute === 'hour') {
            newTime = `${val}:${currentM || "00"}`;
        } else {
            newTime = `${currentH || "00"}:${val}`;
        }

        newLocations[index][field] = newTime;
        setLocations(newLocations);
    };

    const renderTimeSelects = (loc: PickupLocation, idx: number, field: 'time_1' | 'time_2' | 'time_3', borderColorName: string) => {
        const value = loc[field] || "";
        const [h, m] = value ? value.split(':') : ["", ""];

        return (
            <div className="flex items-center justify-center gap-1.5">
                <select
                    value={h}
                    onChange={(e) => handleTimeChange(idx, field, 'hour', e.target.value)}
                    className={`w-16 text-center p-1.5 text-sm border ${borderColorName} rounded focus:ring-2 focus:ring-blue-500 bg-white shadow-sm cursor-pointer hover:bg-gray-50`}
                >
                    <option value="">--시</option>
                    {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}시</option>
                    ))}
                </select>
                <span className="font-bold text-gray-400">:</span>
                <select
                    value={m}
                    onChange={(e) => handleTimeChange(idx, field, 'minute', e.target.value)}
                    disabled={!h && h !== '00'}
                    className={`w-16 text-center p-1.5 text-sm border ${borderColorName} rounded focus:ring-2 focus:ring-blue-500 bg-white shadow-sm cursor-pointer hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                    <option value="">--분</option>
                    {Array.from({ length: 60 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}분</option>
                    ))}
                </select>
            </div>
        );
    };

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/pickup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updates: locations.map(loc => ({
                        id: loc.id,
                        time_1: loc.time_1,
                        time_2: loc.time_2,
                        time_3: loc.time_3
                    }))
                })
            });

            const result = await response.json();
            if (result.success) {
                alert("픽업 시간 일괄 변경이 성공적으로 저장되었습니다.");
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            console.error("저장 실패:", e);
            alert("저장 중 오류가 발생했습니다: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">픽업시간 관리</h1>
                    <p className="text-gray-500 mt-1">투어 옵션별(1부, 2부, 3부) 하와이 현지 픽업 시간을 일괄 관리합니다.</p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        변경사항 저장
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" /> 전체 픽업 장소 목록
                    </h2>
                    <p className="text-sm text-gray-500">
                        시간 형식은 반드시 <strong className="text-gray-800">시:분 (HH:MM)</strong> 포맷으로 입력해주세요. 예를 들어 07:30 처럼 입력합니다.<br />
                        비워두실 경우 해당 시간대에는 픽업이 운영되지 않음을 의미합니다.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 border-t">
                                <th className="p-4 font-semibold text-gray-700 text-sm w-16 text-center">No.</th>
                                <th className="p-4 font-semibold text-gray-700 text-sm text-center border-l border-gray-200">픽업장소</th>
                                <th className="p-4 font-semibold text-blue-700 text-sm w-48 text-center bg-blue-50/30 border-l border-blue-100">1부 거북이 투어</th>
                                <th className="p-4 font-semibold text-blue-700 text-sm w-48 text-center bg-blue-50/30 border-l border-blue-100">2부 거북이 투어</th>
                                <th className="p-4 font-semibold text-orange-700 text-sm w-48 text-center bg-orange-50/20 border-l border-orange-100">선셋(3부) 투어</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {locations.map((loc, idx) => (
                                <tr key={loc.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-center text-sm font-medium text-gray-500">
                                        {idx + 1}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-900 text-center border-l border-gray-200">
                                        {loc.name}
                                    </td>
                                    <td className="p-3 bg-blue-50/10 border-l border-blue-100">
                                        {renderTimeSelects(loc, idx, 'time_1', 'border-gray-300')}
                                    </td>
                                    <td className="p-3 bg-blue-50/10 border-l border-blue-100">
                                        {renderTimeSelects(loc, idx, 'time_2', 'border-gray-300')}
                                    </td>
                                    <td className="p-3 bg-orange-50/10 border-l border-orange-100">
                                        {renderTimeSelects(loc, idx, 'time_3', 'border-orange-200')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
