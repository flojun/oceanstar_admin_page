"use client";

import Link from "next/link";
import { BookButton, useBooking } from "./BookingContext";
import { Arrow, Check } from "./Icons";
import type { CardData } from "./TourScroller";
import { ALOH_TOURS } from "./tours";

/** 메인 비교표. ALOH QR 손님에겐 카드와 똑같이 거북이 · 선셋 · 프라이빗만, 달러로, 특가 QR 이면 특가로 보인다. */
export default function CompareTable({
    cards,
    featureRows,
    labels,
}: {
    cards: CardData[];
    featureRows: { label: string; cells: boolean[] }[];
    labels: { popular: string; picked: string; book: string; detail: string };
}) {
    const { partner } = useBooking();
    const sale = partner === "aloh-sale";
    const idx = cards.map((_, i) => i).filter((i) => !partner || ALOH_TOURS.includes(cards[i].key));
    const rows = featureRows.filter((r) => idx.some((i) => r.cells[i]));
    const cols = { ["--cols" as string]: idx.length } as React.CSSProperties;

    return (
        <div className="cmp" role="table">
            <div className="crow chead rise" role="row" style={cols}>
                <div className="cc lead" role="columnheader" />
                {idx.map((ci, i) => {
                    const c = cards[ci];
                    return (
                        <div key={c.key} className={`cc${i === 0 ? " on" : ""}`} role="columnheader">
                            {i === 0 && <span className="ctag">{labels.popular}</span>}
                            <b>{c.name}</b>
                            {sale && c.salePrice
                                ? <><s className="n">{c.priceUsd}</s><em className="n sale">{c.salePrice}</em></>
                                : <em className="n">{partner ? c.priceUsd : c.price}</em>}
                            <i>{c.caption}</i>
                        </div>
                    );
                })}
            </div>
            {rows.map((r, ri) => (
                <div key={r.label} className="crow rise" role="row" style={{ ...cols, ["--i" as string]: ri } as React.CSSProperties}>
                    <div className="cc lead" role="rowheader">{r.label}</div>
                    {idx.map((ci, i) => (
                        <div key={ci} className={`cc${i === 0 ? " on" : ""}`} role="cell">
                            {r.cells[ci] ? <Check /> : null}
                            <span className="sr">{r.cells[ci] ? "O" : "X"}</span>
                        </div>
                    ))}
                </div>
            ))}
            <div className="crow cfoot rise" role="row" style={cols}>
                <div className="cc lead" role="rowheader">{labels.picked}</div>
                {idx.map((ci, i) => {
                    const c = cards[ci];
                    return (
                        <div key={c.key} className={`cc${i === 0 ? " on" : ""}`} role="cell">
                            <BookButton tour={c.key} className="book" label={`${c.name} ${labels.book}`}>{labels.book} <Arrow /></BookButton>
                            <Link href={c.href} className="detail" aria-label={`${c.name} ${labels.detail}`}>{labels.detail}</Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
