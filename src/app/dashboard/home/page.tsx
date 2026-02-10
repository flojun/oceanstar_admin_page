"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    ClipboardList,
    Car,
    CalendarDays,
    LayoutDashboard,
    ListChecks,
    AlertCircle,
    Clock // Icon for Waiting
} from "lucide-react";
import NewReservationsView from "@/components/NewReservationsView";

export default function HomePage() {
    const router = useRouter();
    const [waitingCount, setWaitingCount] = useState<number>(0);
    const [cancellationCount, setCancellationCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Interaction State
    const [showNewReservations, setShowNewReservations] = useState(false);

    useEffect(() => {
        fetchCounts();
        // Optional: Set up an interval or subscription for real-time updates
    }, [showNewReservations]); // Refetch when view closes (in case items were confirmed)

    const fetchCounts = async () => {
        setLoading(true);
        try {
            // Fetch '예약대기' count
            const { count: waiting, error: waitingError } = await supabase
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('status', '예약대기');

            if (waitingError) throw waitingError;

            // Fetch '취소요청' count
            const { count: cancellation, error: cancelError } = await supabase
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('status', '취소요청');

            if (cancelError) throw cancelError;

            setWaitingCount(waiting || 0);
            setCancellationCount(cancellation || 0);
        } catch (error) {
            console.error("Error fetching dashboard counts:", error);
        } finally {
            setLoading(false);
        }
    };

    const navigateToCancellations = () => {
        router.push("/dashboard/all?view=cancellation");
    };

    const shortcuts = [
        { name: "명단보기", href: "/dashboard/list", icon: ClipboardList, color: "bg-blue-100 text-blue-600" },
        { name: "차량용 명단", href: "/dashboard/vehicle", icon: Car, color: "bg-green-100 text-green-600" },
        { name: "캘린더", href: "/dashboard/monthly", icon: CalendarDays, color: "bg-purple-100 text-purple-600" },
        { name: "예약관리", href: "/dashboard/all", icon: ListChecks, color: "bg-orange-100 text-orange-600" },
        { name: "대시보드", href: "/dashboard/stats", icon: LayoutDashboard, color: "bg-indigo-100 text-indigo-600" },
    ];

    if (showNewReservations) {
        return <NewReservationsView onBack={() => setShowNewReservations(false)} />;
    }

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        Oceanstar Admin <span className="text-blue-600">Home</span>
                    </h1>
                    <p className="text-gray-500 mt-2">오늘의 예약 현황과 주요 업무를 확인하세요.</p>
                </header>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* New Reservations (Waiting) */}
                    <div
                        onClick={() => setShowNewReservations(true)}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-gray-700 mb-1 group-hover:text-blue-700 transition-colors">새로운 예약 (대기)</h2>
                            <p className="text-sm text-gray-500">처리되지 않은 신규 예약건</p>
                            <div className="mt-4 flex items-baseline gap-2">
                                {loading ? (
                                    <div className="h-10 w-20 bg-gray-100 animate-pulse rounded"></div>
                                ) : (
                                    <span className="text-4xl font-bold text-blue-600">{waitingCount}</span>
                                )}
                                <span className="text-gray-400">건</span>
                            </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    {/* Cancellation Requests */}
                    <div
                        onClick={navigateToCancellations}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-gray-700 mb-1 group-hover:text-orange-700 transition-colors">취소 요청</h2>
                            <p className="text-sm text-gray-500">처리가 필요한 취소 요청건</p>
                            <div className="mt-4 flex items-baseline gap-2">
                                {loading ? (
                                    <div className="h-10 w-20 bg-gray-100 animate-pulse rounded"></div>
                                ) : (
                                    <span className="text-4xl font-bold text-orange-600">{cancellationCount}</span>
                                )}
                                <span className="text-gray-400">건</span>
                            </div>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-full group-hover:bg-orange-100 transition-colors">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Shortcuts */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">바로가기 메뉴</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {shortcuts.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                            >
                                <div className={`p-4 rounded-full mb-3 group-hover:scale-110 transition-transform ${item.color}`}>
                                    <item.icon className="w-8 h-8" />
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-blue-700">{item.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
