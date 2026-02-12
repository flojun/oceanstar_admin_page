"use client";

import React, { Suspense } from "react";
import { ReservationListView } from "@/components/ReservationListView";

export default function ListPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
            <ReservationListView />
        </Suspense>
    );
}
