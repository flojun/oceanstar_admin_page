"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, CalendarRange, XCircle, Bell } from "lucide-react";
import NewReservationsView from "@/components/NewReservationsView";
import RescheduleRequestsView from "@/components/RescheduleRequestsView";
import CancellationRequestsView from "@/components/CancellationRequestsView";

type TabKey = "new" | "reschedule" | "cancel";

export default function AlertsPage() {
    const [counts, setCounts] = useState({ new: 0, reschedule: 0, cancel: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("new");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const fetchCounts = async () => {
        setLoading(true);
        try {
            const [newRes, rescheduleRes, cancelRes] = await Promise.all([
                supabase.from("reservations").select("*", { count: "exact", head: true }).eq("is_admin_checked", false),
                supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "변경요청"),
                supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "취소요청"),
            ]);
            setCounts({
                new: newRes.count || 0,
                reschedule: rescheduleRes.count || 0,
                cancel: cancelRes.count || 0,
            });
        } catch (e) {
            console.error("Failed to fetch alert counts:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();

        const handleLocalUpdate = () => fetchCounts();
        window.addEventListener("reservation_status_changed", handleLocalUpdate);
        
        return () => window.removeEventListener("reservation_status_changed", handleLocalUpdate);
    }, []);

    const totalCount = counts.new + counts.reschedule + counts.cancel;

    const summaryCards = [
        {
            key: "new" as TabKey,
            label: "새 예약 (미확인)",
            count: counts.new,
            icon: Clock,
            color: "blue",
            bgLight: "bg-blue-50",
            bgDark: "bg-blue-600",
            textColor: "text-blue-600",
            borderColor: "border-blue-200",
            hoverBorder: "hover:border-blue-400",
            ringColor: "ring-blue-500",
        },
        {
            key: "reschedule" as TabKey,
            label: "변경 요청",
            count: counts.reschedule,
            icon: CalendarRange,
            color: "indigo",
            bgLight: "bg-indigo-50",
            bgDark: "bg-indigo-600",
            textColor: "text-indigo-600",
            borderColor: "border-indigo-200",
            hoverBorder: "hover:border-indigo-400",
            ringColor: "ring-indigo-500",
        },
        {
            key: "cancel" as TabKey,
            label: "취소 요청",
            count: counts.cancel,
            icon: XCircle,
            color: "orange",
            bgLight: "bg-orange-50",
            bgDark: "bg-orange-600",
            textColor: "text-orange-600",
            borderColor: "border-orange-200",
            hoverBorder: "hover:border-orange-400",
            ringColor: "ring-orange-500",
        },
    ];

    // --- MOBILE: Tab Layout ---
    if (isMobile) {
        return (
            <div className="h-full w-full overflow-y-auto">
                <div className="p-4 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
                    {/* Header */}
                    <header>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            <Bell className="w-6 h-6 text-blue-600" />
                            알림 센터
                            {totalCount > 0 && (
                                <span className="bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                                    {totalCount}
                                </span>
                            )}
                        </h1>
                    </header>

                    {/* Summary Cards (clickable as tabs) */}
                    <div className="grid grid-cols-3 gap-3">
                        {summaryCards.map((card) => (
                            <button
                                key={card.key}
                                onClick={() => setActiveTab(card.key)}
                                className={`p-3 rounded-xl border-2 transition-all text-center ${
                                    activeTab === card.key
                                        ? `${card.borderColor} ${card.bgLight} ring-2 ${card.ringColor}`
                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                                <card.icon className={`w-5 h-5 mx-auto mb-1 ${activeTab === card.key ? card.textColor : "text-gray-400"}`} />
                                {loading ? (
                                    <div className="h-7 w-8 mx-auto bg-gray-100 animate-pulse rounded" />
                                ) : (
                                    <p className={`text-2xl font-bold ${activeTab === card.key ? card.textColor : "text-gray-700"}`}>
                                        {card.count}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Active View */}
                    <div>
                        {activeTab === "new" && <NewReservationsView onCountChange={fetchCounts} />}
                        {activeTab === "reschedule" && <RescheduleRequestsView />}
                        {activeTab === "cancel" && <CancellationRequestsView />}
                    </div>
                </div>
            </div>
        );
    }

    // --- DESKTOP: Kanban Layout ---
    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-6 max-w-[1600px] 2xl:max-w-[2200px] mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Bell className="w-7 h-7 text-blue-600" />
                        알림 센터
                        {totalCount > 0 && (
                            <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                                {totalCount}건 처리 대기
                            </span>
                        )}
                    </h1>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {summaryCards.map((card) => (
                        <div
                            key={card.key}
                            className={`bg-white rounded-xl shadow-sm border ${card.borderColor} ${card.hoverBorder} p-5 flex items-center justify-between transition-all cursor-default group`}
                        >
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 mb-1">{card.label}</h2>
                                <div className="flex items-baseline gap-2">
                                    {loading ? (
                                        <div className="h-10 w-16 bg-gray-100 animate-pulse rounded" />
                                    ) : (
                                        <span className={`text-4xl font-bold ${card.textColor}`}>{card.count}</span>
                                    )}
                                    <span className="text-gray-400">건</span>
                                </div>
                            </div>
                            <div className={`p-3 ${card.bgLight} rounded-full group-hover:scale-110 transition-transform`}>
                                <card.icon className={`w-7 h-7 ${card.textColor}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <hr className="border-gray-100" />

                {/* Kanban Board - 3 Columns */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Column 1: New Reservations */}
                    <div>
                        <p className="text-[11px] text-gray-400 mb-1 px-1">↑ 오래된순 · ↓ 최신순</p>
                        <div className="bg-blue-50/30 rounded-xl border border-blue-100 p-4 min-h-[400px]">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
                                <Clock className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-blue-800">새 예약 (미확인)</h3>
                                <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {counts.new}
                                </span>
                            </div>
                            <NewReservationsView onCountChange={fetchCounts} />
                        </div>
                    </div>

                    {/* Column 2: Reschedule Requests */}
                    <div>
                        <p className="text-[11px] text-gray-400 mb-1 px-1">↑ 오래된순 · ↓ 최신순</p>
                        <div className="bg-indigo-50/30 rounded-xl border border-indigo-100 p-4 min-h-[400px]">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-indigo-100">
                                <CalendarRange className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-bold text-indigo-800">변경 요청</h3>
                                <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {counts.reschedule}
                                </span>
                            </div>
                            <RescheduleRequestsView />
                        </div>
                    </div>

                    {/* Column 3: Cancellation Requests */}
                    <div>
                        <p className="text-[11px] text-gray-400 mb-1 px-1">↑ 오래된순 · ↓ 최신순</p>
                        <div className="bg-orange-50/30 rounded-xl border border-orange-100 p-4 min-h-[400px]">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-orange-100">
                                <XCircle className="w-5 h-5 text-orange-600" />
                                <h3 className="font-bold text-orange-800">취소 요청</h3>
                                <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {counts.cancel}
                                </span>
                            </div>
                            <CancellationRequestsView />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
