"use client";

import Link from "next/link";
import { useState } from "react";
import { BookButton, useBooking } from "./BookingContext";
import { Arrow } from "./Icons";
import { ALOH_TOURS, type TourFilter, type TourKey } from "./tours";

export type CardData = {
    key: TourKey;
    filter: Exclude<TourFilter, "all">;
    img: string;
    alt: string;
    name: string;
    times: string[];
    price: string;
    /** ALOH QR 손님용: 달러 정가와 특가 */
    priceUsd: string;
    salePrice?: string;
    caption: string;
    href: string;
};

/** 메인 "추천 프로그램": 분류 버튼 + 가로 카드. 첫 HTML 에는 전부 실린다. */
export default function TourScroller({
    cards,
    filters,
    labels,
}: {
    cards: CardData[];
    filters: { id: TourFilter; label: string }[];
    labels: { book: string; detail: string };
}) {
    const [f, setF] = useState<TourFilter>("all");
    // ALOH QR 손님은 거북이 · 선셋 · 프라이빗만, 가격은 달러로. 특가 QR 이면 정가에 줄을 긋고 특가를 크게
    const { partner } = useBooking();
    const sale = partner === "aloh-sale";
    const shown = cards.filter((c) => (f === "all" || c.filter === f) && (!partner || ALOH_TOURS.includes(c.key)));
    return (
        <>
            <div className="rise">
                <div className="filters" role="tablist">
                    {filters.filter((x) => x.id === "all" || !partner || cards.some((c) => c.filter === x.id && ALOH_TOURS.includes(c.key))).map((x) => (
                        <button key={x.id} type="button" role="tab" aria-selected={f === x.id} className={`fp${f === x.id ? " on" : ""}`} onClick={() => setF(x.id)}>
                            {x.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="scroller">
                {/* 순서(--i)만 넘긴다. 인라인 animationRange 는 CSS 미디어쿼리를 이겨버린다 */}
                {shown.map((c, i) => (
                    <div key={c.key} className="ac" style={{ ["--i" as string]: i } as React.CSSProperties}>
                        <div className="ac-ph" data-image-slot="landing.tour_card">
                            <img src={c.img} alt={c.alt} width={600} height={400} loading="lazy" />
                        </div>
                        <span className="ac-in">
                            <b>{c.name}</b>
                            <em>{c.times.map((t, j) => <span key={j}>{j > 0 && <br />}{t}</span>)}</em>
                            <span className="ac-f">
                                <span className="ac-p">
                                    {sale && c.salePrice
                                        ? <><s className="n">{c.priceUsd}</s><b className="n sale">{c.salePrice}</b></>
                                        : <b className="n">{partner ? c.priceUsd : c.price}</b>}
                                    <i>{c.caption}</i>
                                </span>
                            </span>
                            <BookButton tour={c.key} className="book">{labels.book} <Arrow /></BookButton>
                            <Link href={c.href} className="detail">{labels.detail}</Link>
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}
