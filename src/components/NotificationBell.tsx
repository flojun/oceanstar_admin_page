"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Clock, CalendarRange, XCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AgencyNotification } from "@/types/agency";
import { useRouter } from "next/navigation";

const ALERT_STATUSES = ["예약대기", "변경요청", "취소요청"];

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AgencyNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Admin alert counts
    const [alertCounts, setAlertCounts] = useState({ new: 0, reschedule: 0, cancel: 0 });
    const totalAlerts = alertCounts.new + alertCounts.reschedule + alertCounts.cancel;

    const fetchAlertCounts = async () => {
        const [newRes, rescheduleRes, cancelRes] = await Promise.all([
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("is_admin_checked", false),
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "변경요청"),
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "취소요청"),
        ]);
        setAlertCounts({
            new: newRes.count || 0,
            reschedule: rescheduleRes.count || 0,
            cancel: cancelRes.count || 0,
        });
    };

    // Fetch initial notifications
    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from("agency_notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data as AgencyNotification[]);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    useEffect(() => {
        fetchNotifications();
        fetchAlertCounts();

        // Realtime: update bell counts when reservations change
        const channel = supabase
            .channel("bell_reservation_alerts")
            .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
                fetchAlertCounts();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;

        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        await supabase
            .from("agency_notifications")
            .update({ is_read: true })
            .in("id", unreadIds);
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            markAllAsRead();
        }
    };

    const combinedBadge = unreadCount + totalAlerts;

    const alertItems = [
        { label: "새 예약 (미확인)", count: alertCounts.new, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "변경 요청", count: alertCounts.reschedule, icon: CalendarRange, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "취소 요청", count: alertCounts.cancel, icon: XCircle, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="알림"
            >
                {combinedBadge > 0 ? (
                    <BellRing className="w-6 h-6 text-red-600" />
                ) : (
                    <Bell className="w-6 h-6 text-gray-600" />
                )}

                {combinedBadge > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {combinedBadge > 99 ? "99+" : combinedBadge}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Click-away overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                        {/* Admin Alert Summary */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-800 text-sm">예약 알림</h3>
                                {totalAlerts > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {totalAlerts}건
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {alertItems.map(item => (
                                    <div key={item.label} className={`${item.bg} rounded-lg p-2 text-center`}>
                                        <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-0.5`} />
                                        <p className={`text-lg font-bold ${item.color}`}>{item.count}</p>
                                        <p className="text-[10px] text-gray-500 leading-tight">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => { setIsOpen(false); router.push("/dashboard/alerts"); }}
                                className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors py-1 rounded-md hover:bg-blue-100/50"
                            >
                                알림 센터로 이동 <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Agency Notifications */}
                        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-800 text-sm">여행사 알림</h3>
                            <span className="text-xs text-gray-500">최근 10개</span>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    알림이 없습니다.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {notifications.map(n => (
                                        <li key={n.id} className={`p-4 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(n.created_at).toLocaleString('ko-KR', {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

