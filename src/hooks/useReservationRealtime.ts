"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type ReservationEventType =
    | "new_reservation"
    | "status_change"
    | "general_update";

export interface ReservationEvent {
    type: ReservationEventType;
    eventType: "INSERT" | "UPDATE" | "DELETE";
    payload: any;
    old?: any;
    timestamp: Date;
}

interface UseReservationRealtimeOptions {
    onEvent: (event: ReservationEvent) => void;
    onCountRefresh?: () => void;
}

const STATUS_CHANGE_ALERTS = ["변경요청", "취소요청", "예약대기"];

export function useReservationRealtime({ onEvent, onCountRefresh }: UseReservationRealtimeOptions) {
    const onEventRef = useRef(onEvent);
    const onCountRefreshRef = useRef(onCountRefresh);

    useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
    useEffect(() => { onCountRefreshRef.current = onCountRefresh; }, [onCountRefresh]);

    useEffect(() => {
        const channel = supabase
            .channel("admin_reservation_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "reservations" },
                (payload) => {
                    // Always trigger count refresh
                    onCountRefreshRef.current?.();

                    let type: ReservationEventType = "general_update";

                    if (payload.eventType === "INSERT") {
                        type = "new_reservation";
                    } else if (payload.eventType === "UPDATE") {
                        const newStatus = (payload.new as any)?.status;
                        // Check if current status is an alertable status change
                        if (STATUS_CHANGE_ALERTS.includes(newStatus)) {
                            type = "status_change";
                        }
                    }

                    onEventRef.current({
                        type,
                        eventType: payload.eventType as any,
                        payload: payload.new,
                        old: payload.old,
                        timestamp: new Date(),
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
}
