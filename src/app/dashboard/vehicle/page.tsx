"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { cn, calculateTotalPax } from "@/lib/utils";
import { useReservationFilter, FilterTab } from "@/hooks/useReservationFilter";

export default function VehiclePage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const { activeTab, setActiveTab, filteredData, groupedSections } = useReservationFilter(reservations);

    const fetchTodayReservations = async () => {
        setLoading(true);
        const todayStr = new Date().toISOString().split("T")[0];

        try {
            const { data, error } = await supabase
                .from("reservations")
                .select("*")
                .eq("tour_date", todayStr)
                .order("option", { ascending: true })
                .order("pickup_location", { ascending: true });

            if (error) throw error;
            setReservations(data || []);
        } catch (error) {
            console.error("Error fetching reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayReservations();
    }, []);

    const renderCard = (res: Reservation) => (
        <div key={res.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
                    {res.option}
                </span>
                <span className="text-sm font-medium text-gray-500">{res.source}</span>
            </div>

            <div className="mb-3">
                <div className="text-lg font-bold text-gray-900 line-clamp-1">{res.pickup_location}</div>
                <div className="text-sm text-gray-500">픽업장소</div>
            </div>

            <div className="mb-3 flex justify-between border-t border-gray-100 pt-3">
                <div>
                    <div className="font-semibold">{res.name}</div>
                    <div className="text-xs text-gray-500">예약자</div>
                </div>
                <div className="text-right">
                    <div className="font-semibold">{res.pax}</div>
                    <div className="text-xs text-gray-500">인원</div>
                </div>
            </div>

            <div className="flex items-center gap-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
                <span>📞</span>
                <a href={`tel:${res.contact}`} className="hover:underline">{res.contact}</a>
            </div>

            {res.note && (
                <div className="mt-2 text-xs text-red-500 font-medium">
                    * {res.note}
                </div>
            )}
        </div>
    );

    const renderTabs = () => {
        const tabs: FilterTab[] = ['전체', '1부', '2부', '3부', '패러 및 제트', '패러', '제트', '기타'];
        return (
            <div className="flex flex-wrap gap-2 pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm",
                            activeTab === tab
                                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200"
                                : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        );
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col gap-1 shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">차량용 배차 명단 (오늘)</h2>
                <p className="text-sm text-gray-500">
                    차량 배차를 위한 카드 뷰입니다.
                </p>
            </div>

            <div className="shrink-0">{renderTabs()}</div>

            <div className="flex-1 overflow-auto p-1 min-h-0 container-scroll">
                {activeTab === '전체' && groupedSections ? (
                    <div className="space-y-8">
                        {Object.entries(groupedSections).map(([groupName, items]) => {
                            if (items.length === 0) return null;
                            return (
                                <div key={groupName}>
                                    <h3 className="mb-4 text-lg font-bold text-blue-800 flex items-center gap-2 sticky top-0 bg-gray-50/95 backdrop-blur-sm p-2 z-10 rounded-md border-b">
                                        <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                                        {groupName}
                                        <span className="text-sm font-normal text-gray-500 bg-white border px-2 py-0.5 rounded-full">
                                            총 {calculateTotalPax(items)}명 ({items.length}팀)
                                        </span>
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {items.map(renderCard)}
                                    </div>
                                </div>
                            );
                        })}
                        {reservations.length === 0 && (
                            <div className="text-center text-gray-400 py-10">예약 데이터가 없습니다.</div>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredData.map(renderCard)}
                        {filteredData.length === 0 && (
                            <div className="col-span-full text-center text-gray-400 py-10">해당 옵션의 예약이 없습니다.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
