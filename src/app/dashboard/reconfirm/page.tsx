"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Reservation } from "@/types/reservation";
import { ReservationTable } from "@/components/ReservationTable";
import { ReservationModal } from "@/components/ReservationModal"; // Import Modal
import { useReservationFilter, FilterTab, SortOption } from "@/hooks/useReservationFilter";
import { cn, calculateTotalPax } from "@/lib/utils";

import { getHawaiiTomorrowStr } from "@/lib/timeUtils";
import { ArrowUpDown } from "lucide-react";

export default function ReconfirmPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

    const { activeTab, setActiveTab, filteredData, groupedSections, sortOption, setSortOption } = useReservationFilter(reservations);

    const fetchTomorrowReservations = async () => {
        setLoading(true);
        // Calculate Tomorrow (Hawaii)
        const tomorrowStr = getHawaiiTomorrowStr();

        try {
            const { data, error } = await supabase
                .from("reservations")
                .select("*")
                .eq("tour_date", tomorrowStr)
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
        fetchTomorrowReservations();
    }, []);

    const handleReconfirmToggle = async (id: string, currentVal: boolean) => {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, is_reconfirmed: !currentVal } : r));
        try {
            await supabase.from("reservations").update({ is_reconfirmed: !currentVal }).eq("id", id);
        } catch (error) {
            console.error("Update failed", error);
            fetchTomorrowReservations();
        }
    };

    const handleEdit = (reservation: Reservation) => {
        setSelectedReservation(reservation);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        fetchTomorrowReservations();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까? (내일 예약)")) return;
        try {
            const { error } = await supabase.from("reservations").delete().eq("id", id);
            if (error) throw error;
            fetchTomorrowReservations();
        } catch (error) {
            console.error("Error deleting reservation:", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

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

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">리컨펌 (내일)</h2>
                <p className="text-sm text-gray-500">
                    내일 투어 예약자 리컨펌 체크 현황입니다.
                </p>
            </div>

            {/* Filter Tabs & Sort */}
            <div className="shrink-0 flex justify-between items-end pb-2">
                {renderTabs()}
                <div className="pb-2 relative">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>정렬</span>
                    </button>

                    {isSortOpen && (
                        <>
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                                <button onClick={() => { setSortOption('receipt_asc'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'receipt_asc' && "text-blue-600 font-bold bg-blue-50")}>접수일 (오름차순)</button>
                                <button onClick={() => { setSortOption('receipt_desc'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'receipt_desc' && "text-blue-600 font-bold bg-blue-50")}>접수일 (내림차순)</button>
                                <button onClick={() => { setSortOption('source'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'source' && "text-blue-600 font-bold bg-blue-50")}>예약 경로별</button>
                                <button onClick={() => { setSortOption('pickup'); setIsSortOpen(false); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-blue-50", sortOption === 'pickup' && "text-blue-600 font-bold bg-blue-50")}>픽업 장소별</button>
                            </div>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm min-h-0">
                {activeTab === '전체' && groupedSections ? (
                    <div className="divide-y divide-gray-100">
                        {Object.entries(groupedSections).map(([groupName, items]) => {
                            if (items.length === 0) return null;
                            return (
                                <div key={groupName} className="p-4">
                                    <h3 className="mb-3 text-lg font-bold text-blue-800 flex items-center gap-2">
                                        <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                                        {groupName}
                                        <span className="text-sm font-normal text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
                                            총 {calculateTotalPax(items)}명 ({items.length}건)
                                        </span>
                                    </h3>
                                    <ReservationTable
                                        reservations={items}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onReconfirmToggle={handleReconfirmToggle}
                                        loading={false}
                                    />
                                </div>
                            );
                        })}
                        {reservations.length === 0 && !loading && (
                            <div className="p-12 text-center text-gray-400">내일 예약 데이터가 없습니다.</div>
                        )}
                    </div>
                ) : (
                    <div className="h-full">
                        <ReservationTable
                            reservations={filteredData}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReconfirmToggle={handleReconfirmToggle}
                            loading={loading}
                        />
                    </div>
                )}
            </div>

            <ReservationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                reservation={selectedReservation}
            />
        </div>
    );
}

