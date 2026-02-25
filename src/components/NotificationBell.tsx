"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AgencyNotification } from "@/types/agency";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<AgencyNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

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

        // Subscribe to real-time changes
        const channel = supabase
            .channel('agency_notifications_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'agency_notifications' },
                (payload) => {
                    setNotifications(prev => [payload.new as AgencyNotification, ...prev].slice(0, 10));
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="알림"
            >
                {unreadCount > 0 ? (
                    <BellRing className="w-6 h-6 text-red-600" />
                ) : (
                    <Bell className="w-6 h-6 text-gray-600" />
                )}

                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">여행사 알림</h3>
                        <span className="text-xs text-gray-500">최근 10개</span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
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
            )}
        </div>
    );
}
