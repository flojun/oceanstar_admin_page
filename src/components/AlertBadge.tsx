"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AlertBadge() {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        const [uncheckedRes, rescheduleRes, cancelRes] = await Promise.all([
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("is_admin_checked", false),
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "변경요청"),
            supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "취소요청"),
        ]);
        setCount((uncheckedRes.count || 0) + (rescheduleRes.count || 0) + (cancelRes.count || 0));
    };

    useEffect(() => {
        fetchCount();

        const handleLocalUpdate = () => fetchCount();
        window.addEventListener("reservation_status_changed", handleLocalUpdate);

        // Realtime: update badge when reservations change
        const channel = supabase
            .channel("sidebar_alert_badge")
            .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => {
                fetchCount();
            })
            .subscribe();

        return () => { 
            supabase.removeChannel(channel); 
            window.removeEventListener("reservation_status_changed", handleLocalUpdate);
        };
    }, []);

    if (count <= 0) return null;

    return (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full shadow-sm">
            {count > 99 ? "99+" : count}
        </span>
    );
}
