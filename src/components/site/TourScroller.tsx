"use client";

import Link from "next/link";
import { useState } from "react";
import { BookButton } from "./BookingContext";
import { Arrow } from "./Icons";
import type { TourFilter, TourKey } from "./tours";

export type CardData = {
    key: TourKey;
    filter: Exclude<TourFilter, "all">;
    img: string;
    alt: string;
    name: string;
    times: string[];
    price: string;
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
    const shown = cards.filter((c) => f === "all" || c.filter === f);
    return (
        <>
            <div className="rise">
                <div className="filters" role="tablist">
                    {filters.map((x) => (
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
                                <span className="ac-p"><b className="n">{c.price}</b><i>{c.caption}</i></span>
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
