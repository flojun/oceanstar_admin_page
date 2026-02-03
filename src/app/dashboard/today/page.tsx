"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReservationListView } from "@/components/ReservationListView";

function TodayContent() {
    const searchParams = useSearchParams();
    const date = searchParams.get("date") || undefined;

    return <ReservationListView defaultDate={date} />;
}

export default function TodayPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Date...</div>}>
            <TodayContent />
        </Suspense>
    );
}
