"use client";

import { useEffect, useState } from "react";
import { BellRing, X, CalendarRange, XCircle } from "lucide-react";
import { ReservationEvent } from "@/hooks/useReservationRealtime";
import { cn } from "@/lib/utils";

interface Toast {
    id: string;
    message: string;
    name: string;
    option: string;
    tourDate: string;
    eventType: "new_reservation" | "status_change";
    status?: string;
    timestamp: Date;
}

export default function ReservationToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const event = (e as CustomEvent).detail as ReservationEvent;
            if (event.type !== "new_reservation" && event.type !== "status_change") return;

            const name = event.payload?.name || "고객";
            const option = event.payload?.option || "";
            const tourDate = event.payload?.tour_date || "";
            const status = event.payload?.status || "";

            const message = event.type === "new_reservation"
                ? "새로운 예약이 들어왔습니다!"
                : `상태 변경: ${status}`;

            const toast: Toast = {
                id: crypto.randomUUID(),
                message,
                name,
                option,
                tourDate,
                eventType: event.type,
                status,
                timestamp: new Date(),
            };

            setToasts(prev => [...prev, toast]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 8000);
        };

        window.addEventListener("admin-notification-event", handler);
        return () => window.removeEventListener("admin-notification-event", handler);
    }, []);

    const dismiss = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const dismissAll = () => {
        setToasts([]);
    };

    if (toasts.length === 0) return null;

    return (
        <>
            {/* Toast Notifications */}
            <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm">
                {toasts.length > 1 && (
                    <button
                        onClick={dismissAll}
                        className="self-start text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur rounded-full shadow"
                    >
                        <X className="w-3 h-3" />
                        모두 닫기 ({toasts.length})
                    </button>
                )}

                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "flex flex-col bg-white border-l-4 shadow-xl rounded-xl px-4 py-3 animate-in slide-in-from-left fade-in duration-300",
                            toast.eventType === "new_reservation"
                                ? "border-blue-500"
                                : toast.status === "취소요청"
                                    ? "border-orange-500"
                                    : "border-indigo-500"
                        )}
                    >
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "p-2 rounded-full shrink-0",
                                toast.eventType === "new_reservation"
                                    ? "bg-blue-100"
                                    : toast.status === "취소요청"
                                        ? "bg-orange-100"
                                        : "bg-indigo-100"
                            )}>
                                {toast.eventType === "new_reservation" ? (
                                    <BellRing className="w-5 h-5 text-blue-600 animate-pulse" />
                                ) : toast.status === "취소요청" ? (
                                    <XCircle className="w-5 h-5 text-orange-600" />
                                ) : (
                                    <CalendarRange className="w-5 h-5 text-indigo-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-800">{toast.message}</p>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                        {toast.name}
                                    </span>
                                    {toast.option && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                            {toast.option}
                                        </span>
                                    )}
                                    {toast.tourDate && (
                                        <span className="text-gray-500">{toast.tourDate}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => dismiss(toast.id)}
                                className="text-gray-400 hover:text-gray-600 shrink-0 p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ animation: 'shrink 8s linear forwards' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </>
    );
}
