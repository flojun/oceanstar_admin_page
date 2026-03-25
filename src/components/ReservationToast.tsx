"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BellRing, X } from "lucide-react";

interface Toast {
    id: string;
    message: string;
}

export default function ReservationToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const channel = supabase
            .channel("reservation_toast")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "reservations" },
                (payload) => {
                    const name = (payload.new as any)?.name || "고객";
                    const option = (payload.new as any)?.option || "";
                    const toast: Toast = {
                        id: crypto.randomUUID(),
                        message: `🔔 새로운 예약이 들어왔습니다! (${name}${option ? ` · ${option}` : ""})`,
                    };
                    setToasts(prev => [...prev, toast]);

                    // Auto dismiss after 6 seconds
                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }, 6000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const dismiss = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="flex items-center gap-3 bg-white border border-blue-200 shadow-lg rounded-xl px-4 py-3 animate-in slide-in-from-left fade-in duration-300"
                >
                    <BellRing className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
                    <button
                        onClick={() => dismiss(toast.id)}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
