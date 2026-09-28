"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { TourSetting } from "@/lib/tourUtils";
import type { BlockedDate } from "@/lib/siteData";
import { tourByKey, type Lang, type TourKey } from "./tours";

// 예약 창은 누를 때 불러온다. 첫 화면 자바스크립트에 구글 지도·달력이 실리지 않게.
const BookingModal = dynamic(() => import("./BookingModal"), { ssr: false });

type Ctx = { open: (tour?: TourKey) => void };
const BookingCtx = createContext<Ctx>({ open: () => {} });
export const useBooking = () => useContext(BookingCtx);

export function BookingProvider({
    lang,
    tourSettings,
    blockedDates,
    children,
}: {
    lang: Lang;
    tourSettings: TourSetting[];
    blockedDates: BlockedDate[];
    children: React.ReactNode;
}) {
    const [state, setState] = useState<{ open: boolean; tour?: TourKey; n: number }>({ open: false, n: 0 });
    const open = useCallback((tour?: TourKey) => setState((s) => ({ open: true, tour, n: s.n + 1 })), []);

    // ?book=turtle 로 들어오면 예약 창을 바로 연다 (광고·상세 페이지·외부 링크용)
    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get("book");
        if (q === null) return;
        const key = tourByKey(q)?.key;
        // 첫 렌더가 끝난 뒤 연다 (effect 안에서 바로 setState 하지 않게).
        // 주소창의 book= 도 그때 지운다. 새로고침마다 창이 다시 뜨지 않게.
        const id = setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("book");
            window.history.replaceState(null, "", url.pathname + url.search + url.hash);
            open(key);
        }, 0);
        return () => clearTimeout(id);
    }, [open]);

    return (
        <BookingCtx.Provider value={{ open }}>
            {children}
            {state.open && (
                <BookingModal
                    key={state.n}
                    lang={lang}
                    initialTour={state.tour}
                    tourSettings={tourSettings}
                    blockedDates={blockedDates}
                    onClose={() => setState((s) => ({ ...s, open: false }))}
                />
            )}
        </BookingCtx.Provider>
    );
}

/** 예약 창을 여는 버튼. 서버 컴포넌트 안에서 그대로 쓴다. */
export function BookButton({ tour, className, children, label }: { tour?: TourKey; className?: string; children: React.ReactNode; label?: string }) {
    const { open } = useBooking();
    return (
        <button type="button" className={className} onClick={() => open(tour)} aria-label={label} data-book={tour ?? "any"}>
            {children}
        </button>
    );
}
