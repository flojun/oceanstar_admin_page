"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, BellRing, Clock, CalendarRange, XCircle, ArrowRight, Volume2, VolumeX, Settings, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AgencyNotification } from "@/types/agency";
import { useRouter } from "next/navigation";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useReservationRealtime, ReservationEvent } from "@/hooks/useReservationRealtime";
import { usePushNotification } from "@/hooks/usePushNotification";
import { cn } from "@/lib/utils";

const ALERT_STATUSES = ["예약대기", "변경요청", "취소요청"];

interface LiveEvent {
    id: string;
    type: "new_reservation" | "status_change";
    name: string;
    option: string;
    tourDate: string;
    status?: string;
    timestamp: Date;
}

interface Toast {
    id: string;
    message: string;
    name: string;
    option: string;
    tourDate: string;
    eventType: "new_reservation" | "status_change";
    status?: string;
}

export default function NotificationBell({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AgencyNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Admin alert counts
    const [alertCounts, setAlertCounts] = useState({ new: 0, reschedule: 0, cancel: 0 });
    const totalAlerts = alertCounts.new + alertCounts.reschedule + alertCounts.cancel;

    // Live events feed
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const bellRef = useRef<HTMLButtonElement>(null);
    const [toastPos, setToastPos] = useState<{ top: number; left: number } | null>(null);

    // Shared hooks
    const { settings, updateSettings } = useNotificationSettings();
    const { playSound, triggerVibration } = useNotificationSound(
        settings.soundEnabled, settings.vibrationEnabled
    );
    const {
        isSupported: pushSupported,
        isSubscribed: isPushSubscribed,
        permission: pushPermission,
        subscribe: subscribePush,
        unsubscribe: unsubscribePush,
        showLocalNotification,
        isLoading: pushLoading,
    } = usePushNotification();

    const fetchAlertCounts = useCallback(async () => {
        const [newRes, rescheduleRes, cancelRes] = await Promise.all([
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("is_admin_checked", false),
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "변경요청"),
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "취소요청"),
        ]);
        const counts = {
            new: newRes.count || 0,
            reschedule: rescheduleRes.count || 0,
            cancel: cancelRes.count || 0,
        };
        setAlertCounts(counts);

        // Notify AlertBadge via CustomEvent
        window.dispatchEvent(new CustomEvent("admin-alert-counts-changed"));
    }, []);

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

    // Handle realtime events
    const handleRealtimeEvent = useCallback((event: ReservationEvent) => {
        if (event.type === "new_reservation" || event.type === "status_change") {
            const name = event.payload?.name || "고객";
            const option = event.payload?.option || "";
            const tourDate = event.payload?.tour_date || "";
            const status = event.payload?.status || "";

            // Add to live feed
            const liveEvent: LiveEvent = {
                id: crypto.randomUUID(),
                type: event.type,
                name,
                option,
                tourDate,
                status,
                timestamp: event.timestamp,
            };
            setLiveEvents(prev => [liveEvent, ...prev].slice(0, 20));

            // Sound + vibration
            playSound();
            triggerVibration();

            // Animate bell
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 2000);

            // Desktop notification (always - not just when hidden)
            if (settings.pushEnabled && pushPermission === "granted") {
                const title = event.type === "new_reservation"
                    ? `새 예약: ${name}`
                    : `상태 변경: ${name}`;
                const body = event.type === "new_reservation"
                    ? `${option ? option + " · " : ""}${tourDate}`
                    : `${status}${option ? " · " + option : ""}`;
                showLocalNotification(title, {
                    body,
                    tag: `reservation-${event.type}-${Date.now()}`,
                });
            }

            // Show toast below bell icon
            const toastId = crypto.randomUUID();
            const toast: Toast = {
                id: toastId,
                message: event.type === "new_reservation"
                    ? "새로운 예약이 들어왔습니다!"
                    : `상태 변경: ${status}`,
                name,
                option,
                tourDate,
                eventType: event.type,
                status,
            };
            setToasts(prev => [...prev, toast]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toastId));
            }, 6000);
        }
    }, [playSound, triggerVibration, settings.pushEnabled, pushPermission, showLocalNotification]);

    // Single realtime subscription
    useReservationRealtime({
        onEvent: handleRealtimeEvent,
        onCountRefresh: fetchAlertCounts,
    });

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
        fetchAlertCounts();
    }, [fetchAlertCounts]);

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await supabase.from("agency_notifications").update({ is_read: true }).in("id", unreadIds);
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            markAllAsRead();
        }
    };

    const handlePushToggle = async () => {
        if (isPushSubscribed) {
            await unsubscribePush();
            updateSettings({ pushEnabled: false });
        } else {
            const success = await subscribePush();
            if (success) {
                updateSettings({ pushEnabled: true });
            }
        }
    };

    // Calculate toast position from bell button
    const updateToastPosition = useCallback(() => {
        if (bellRef.current) {
            const rect = bellRef.current.getBoundingClientRect();
            setToastPos({
                top: rect.bottom + 8,
                left: isCollapsed ? rect.right + 8 : rect.left,
            });
        }
    }, [isCollapsed]);

    useEffect(() => {
        if (toasts.length > 0) {
            updateToastPosition();
        }
    }, [toasts.length, updateToastPosition]);

    const combinedBadge = unreadCount + totalAlerts;

    const alertItems = [
        { label: "새 예약 (미확인)", count: alertCounts.new, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "변경 요청", count: alertCounts.reschedule, icon: CalendarRange, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "취소 요청", count: alertCounts.cancel, icon: XCircle, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    return (
        <div className="relative">
            <button
                ref={bellRef}
                onClick={toggleOpen}
                className={cn(
                    "relative p-2 rounded-full hover:bg-gray-100 transition-colors",
                    isAnimating && "animate-bell-shake"
                )}
                title="알림"
            >
                {combinedBadge > 0 ? (
                    <BellRing className={cn("w-6 h-6", isAnimating ? "text-orange-500" : "text-red-600")} />
                ) : (
                    <Bell className="w-6 h-6 text-gray-600" />
                )}

                {combinedBadge > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {combinedBadge > 99 ? "99+" : combinedBadge}
                    </span>
                )}

                {/* Ping animation when animating */}
                {isAnimating && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full animate-notification-ping" />
                )}
            </button>

            {/* Toast notifications from bell (fixed to escape sidebar overflow) */}
            {toasts.length > 0 && !isOpen && toastPos && (
                <div
                    className="fixed z-[9999] flex flex-col gap-2 w-72"
                    style={{ top: toastPos.top, left: toastPos.left }}
                >
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={cn(
                                "flex flex-col bg-white border-l-4 shadow-xl rounded-xl px-3 py-2.5",
                                "animate-in slide-in-from-top fade-in duration-300",
                                toast.eventType === "new_reservation"
                                    ? "border-blue-500"
                                    : toast.status === "취소요청"
                                        ? "border-orange-500"
                                        : "border-indigo-500"
                            )}
                        >
                            <div className="flex items-start gap-2">
                                <div className={cn(
                                    "p-1.5 rounded-full shrink-0",
                                    toast.eventType === "new_reservation"
                                        ? "bg-blue-100"
                                        : toast.status === "취소요청"
                                            ? "bg-orange-100"
                                            : "bg-indigo-100"
                                )}>
                                    {toast.eventType === "new_reservation" ? (
                                        <BellRing className="w-4 h-4 text-blue-600 animate-pulse" />
                                    ) : toast.status === "취소요청" ? (
                                        <XCircle className="w-4 h-4 text-orange-600" />
                                    ) : (
                                        <CalendarRange className="w-4 h-4 text-indigo-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800">{toast.message}</p>
                                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                                            {toast.name}
                                        </span>
                                        {toast.option && (
                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                {toast.option}
                                            </span>
                                        )}
                                        {toast.tourDate && (
                                            <span className="text-gray-500">{toast.tourDate}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                    className="text-gray-400 hover:text-gray-600 shrink-0 p-0.5 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="mt-1.5 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ animation: 'shrink 6s linear forwards' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && (
                <>
                    {/* Click-away overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <div className={cn(
                        "absolute mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden max-h-[80vh] flex flex-col",
                        isCollapsed ? "left-full ml-2 top-0 mt-0" : "left-0"
                    )}>
                        {/* Admin Alert Summary */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
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

                        {/* Live Events Feed */}
                        {liveEvents.length > 0 && (
                            <div className="border-b border-gray-100 shrink-0">
                                <div className="px-4 py-2 bg-green-50 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <h3 className="font-semibold text-gray-800 text-sm">실시간</h3>
                                    <span className="text-xs text-gray-500">최근 {liveEvents.length}건</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                    {liveEvents.slice(0, 5).map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "px-4 py-2.5 border-l-3 flex items-start gap-2",
                                                event.type === "new_reservation"
                                                    ? "border-l-blue-500 bg-blue-50/30"
                                                    : event.status === "취소요청"
                                                        ? "border-l-orange-500 bg-orange-50/30"
                                                        : "border-l-indigo-500 bg-indigo-50/30"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-800">
                                                    {event.type === "new_reservation" ? "새 예약" : event.status}
                                                    <span className="font-normal text-gray-600"> · {event.name}</span>
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {event.option && <span>{event.option} · </span>}
                                                    {event.tourDate}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 shrink-0">
                                                {event.timestamp.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Agency Notifications */}
                        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <h3 className="font-semibold text-gray-800 text-sm">여행사 알림</h3>
                            <span className="text-xs text-gray-500">최근 10개</span>
                        </div>

                        <div className="overflow-y-auto flex-1 min-h-0 max-h-48">
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

                        {/* Notification Settings */}
                        <div className="border-t border-gray-200 shrink-0">
                            <button
                                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                                className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4" />
                                    <span>알림 설정</span>
                                </div>
                                {showSettingsPanel ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </button>

                            {showSettingsPanel && (
                                <div className="px-4 pb-4 space-y-3">
                                    {/* Sound Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {settings.soundEnabled ? (
                                                <Volume2 className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <VolumeX className="w-4 h-4 text-gray-400" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">알림음</p>
                                                <p className="text-[11px] text-gray-500">새 예약 시 소리 알림</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                                            className={`relative w-10 h-6 rounded-full transition-colors ${
                                                settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                settings.soundEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Vibration Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <svg className={`w-4 h-4 ${settings.vibrationEnabled ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">진동</p>
                                                <p className="text-[11px] text-gray-500">모바일 기기 진동</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
                                            className={`relative w-10 h-6 rounded-full transition-colors ${
                                                settings.vibrationEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                settings.vibrationEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Push Notification Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BellRing className={`w-4 h-4 ${isPushSubscribed ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">데스크탑 알림</p>
                                                <p className="text-[11px] text-gray-500">
                                                    {!pushSupported
                                                        ? '이 브라우저에서 지원되지 않음'
                                                        : pushPermission === 'denied'
                                                            ? '브라우저 설정에서 허용 필요'
                                                            : '브라우저 알림으로 실시간 수신'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePushToggle}
                                            disabled={!pushSupported || pushPermission === 'denied' || pushLoading}
                                            className={`relative w-10 h-6 rounded-full transition-colors ${
                                                isPushSubscribed ? 'bg-blue-600' : 'bg-gray-300'
                                            } ${(!pushSupported || pushPermission === 'denied') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                                isPushSubscribed ? 'translate-x-[18px]' : 'translate-x-0.5'
                                            }`} />
                                        </button>
                                    </div>

                                    {/* Test Button */}
                                    <button
                                        onClick={() => {
                                            // Close dropdown so toast is visible from bell
                                            setIsOpen(false);
                                            setShowSettingsPanel(false);

                                            setTimeout(() => {
                                                playSound();
                                                triggerVibration();
                                                setIsAnimating(true);
                                                setTimeout(() => setIsAnimating(false), 2000);

                                                const toastId = crypto.randomUUID();
                                                setToasts(prev => [...prev, {
                                                    id: toastId,
                                                    message: "테스트 알림입니다!",
                                                    name: "테스트",
                                                    option: "1부",
                                                    tourDate: new Date().toISOString().split("T")[0],
                                                    eventType: "new_reservation",
                                                }]);
                                                setTimeout(() => {
                                                    setToasts(prev => prev.filter(t => t.id !== toastId));
                                                }, 5000);

                                                if (settings.pushEnabled && pushPermission === "granted") {
                                                    showLocalNotification("테스트 알림", {
                                                        body: "알림이 정상적으로 작동합니다!",
                                                        tag: "test-notification",
                                                    });
                                                }
                                            }, 200);
                                        }}
                                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-xs"
                                    >
                                        테스트 알림 보내기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            <style jsx global>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @keyframes slide-in-from-top {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-in.slide-in-from-top {
                    animation: slide-in-from-top 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
