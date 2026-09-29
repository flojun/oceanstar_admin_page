"use client";

/**
 * FAQ 안내 창. 히어로 검색 칸에서 물어보면(엔터·버튼) 화면 아래에서 올라와
 * 가장 맞는 질문과 답, 비슷한 질문을 보여 준다. 찾기는 faqSearch.ts (브라우저 안에서만).
 * .os 바로 아래에 그린다 - 히어로·목록 안에 두면 iOS 사파리에서 fixed 창이 잘린다.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FAQ, FAQ_TOP, REFUND_NOTE, REFUND_ROWS } from "../faqData";
import { Arrow, Chevron, Close, KakaoLine } from "../Icons";
import { EXTERNAL, links } from "../links";
import type { Lang } from "../tours";
import { answerFor } from "./faqSearch";

export const ASK_EVENT = "os-faq-ask";

const T = {
    ko: {
        found: "이 질문의 답이에요", maybe: "이 질문을 찾으셨나요?", none: "딱 맞는 질문을 찾지 못했어요",
        noneP: "다른 말로 물어보시거나, 많이 묻는 질문을 확인해 보세요.",
        similar: "비슷한 질문", popular: "많이 묻는 질문", inList: "FAQ 목록에서 보기",
        ask: "궁금한 걸 다시 물어보세요", send: "물어보기", close: "닫기",
        priceH: "요금은 투어마다 달라요", price: "투어별 요금을 한눈에 보실 수 있어요", priceGo: "투어 요금 보기",
        still: "그래도 궁금하시면 편하게 물어봐 주세요", contact: "카카오톡 문의",
    },
    en: {
        found: "Here's the answer", maybe: "Is this what you're looking for?", none: "We couldn't find a match",
        noneP: "Try other words, or check the questions people ask most.",
        similar: "Related questions", popular: "Popular questions", inList: "See it in the FAQ",
        ask: "Ask another question", send: "Ask", close: "Close",
        priceH: "Prices differ by tour", price: "Compare every tour's price on one page", priceGo: "See tour prices",
        still: "Still unsure? We're happy to help", contact: "Email us",
    },
};

const noSubscribe = () => () => {};

export default function FaqSheet({ lang, onShow }: { lang: Lang; onShow: (id: string) => void }) {
    const t = T[lang];
    const groups = FAQ[lang];
    const [q, setQ] = useState<string | null>(null);
    const [pick, setPick] = useState<string | null>(null);
    const [drag, setDrag] = useState(0);
    const startY = useRef<number | null>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
    const open = q !== null;

    useEffect(() => {
        const on = (e: Event) => { setQ(String((e as CustomEvent).detail ?? "").trim()); setPick(null); };
        window.addEventListener(ASK_EVENT, on);
        return () => window.removeEventListener(ASK_EVENT, on);
    }, []);

    // 열려 있는 동안 뒤 페이지를 멈추고 Esc 로 닫는다. 닫으면 초점을 검색 칸으로 돌려준다
    useEffect(() => {
        if (!open) return;
        const back = document.activeElement as HTMLElement | null;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus({ preventScroll: true });
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setQ(null); };
        document.addEventListener("keydown", esc);
        return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", esc); back?.focus?.({ preventScroll: true }); };
    }, [open]);

    const res = useMemo(() => (q ? answerFor(q, groups, lang) : null), [q, groups, lang]);
    const all = useMemo(() => groups.flatMap((g) => g.items.map((item) => ({ item, group: g.group }))), [groups]);
    const byId = (id: string) => all.find((x) => x.item.id === id);

    if (!open || !mounted) return null;
    const root = document.querySelector<HTMLElement>(".os") ?? document.body;

    const cur = pick ? byId(pick) : res?.best ?? undefined;
    const head = !cur ? (res?.price ? t.priceH : t.none) : pick || res?.confident ? t.found : t.maybe;
    // 비슷한 질문: 점수로 가까운 것 → 없으면 같은 분류의 다른 질문. 못 찾았으면 많이 묻는 질문
    const near = (res?.related ?? []).map((h) => h.item).concat(pick && res?.best && res.best.item.id !== pick ? [res.best.item] : []);
    const sameGroup = cur ? (groups.find((g) => g.group === cur.group)?.items ?? []) : [];
    const more = cur
        ? (near.length ? near : sameGroup).filter((it) => it.id !== cur.item.id).slice(0, 3)
        : FAQ_TOP[lang].map((x) => byId(x.id)?.item).filter((x): x is NonNullable<typeof x> => !!x);
    const close = () => setQ(null);

    // 손잡이·머리를 아래로 끌면 닫힌다 (90px 넘게)
    const touch = {
        onTouchStart: (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; },
        onTouchMove: (e: React.TouchEvent) => { if (startY.current !== null) setDrag(Math.max(0, e.touches[0].clientY - startY.current)); },
        onTouchEnd: () => { if (drag > 90) close(); setDrag(0); startY.current = null; },
    };

    return createPortal(
        <div className="fq-sheet-root" role="dialog" aria-modal="true" aria-labelledby="fq-sheet-h">
            <div className="fq-scrim" onClick={close} />
            <div className="fq-sheet" style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}>
                <div className="fq-drag" {...touch}>
                    <span className="fq-grab" aria-hidden />
                    <div className="fq-top">
                        <h2 id="fq-sheet-h">{head}</h2>
                        <button type="button" className="fq-x" ref={closeRef} aria-label={t.close} onClick={close}><Close size={18} /></button>
                    </div>
                </div>

                <form className="fq-ask" role="search" onSubmit={(e) => {
                    e.preventDefault();
                    const v = String(new FormData(e.currentTarget).get("q") ?? "");
                    (e.currentTarget.elements.namedItem("q") as HTMLInputElement | null)?.blur();
                    setQ(v.trim()); setPick(null);
                }}>
                    <input key={q} name="q" type="search" defaultValue={q ?? ""} aria-label={t.ask} placeholder={t.ask} enterKeyHint="search" />
                    <button type="submit" aria-label={t.send}><Arrow size={16} /></button>
                </form>

                {cur ? (
                    <article className="fq-best">
                        <span className="fq-grp">{cur.group}</span>
                        <h3><span className="qm">Q</span><span>{cur.item.q}</span></h3>
                        <div className="fq-a">
                            {cur.item.a === null ? (
                                <>
                                    <div className="refund">
                                        {REFUND_ROWS[lang].map((r) => <div key={r.when} className={`rf-c ${r.tone}`}><span>{r.when}</span><b>{r.what}</b></div>)}
                                    </div>
                                    <p className="rf-note" dangerouslySetInnerHTML={{ __html: REFUND_NOTE[lang] }} />
                                </>
                            ) : <p>{cur.item.a}</p>}
                        </div>
                        <button type="button" className="fq-go" onClick={() => { const id = cur.item.id; close(); onShow(id); }}>{t.inList} <Chevron size={14} /></button>
                    </article>
                ) : !res?.price && (
                    <div className="fq-empty">
                        <p>{t.noneP}</p>
                    </div>
                )}

                {res?.price && (
                    <Link href={`${links(lang).home}#tours`} className="fq-price" onClick={close}>
                        <span>{t.price}</span><b>{t.priceGo} <Arrow size={14} /></b>
                    </Link>
                )}

                {more.length > 0 && (
                    <div className="fq-more">
                        <h4>{cur ? t.similar : t.popular}</h4>
                        <ul>
                            {more.map((it) => (
                                <li key={it.id}><button type="button" onClick={() => setPick(it.id)}><span>{it.q}</span><Chevron size={14} /></button></li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="fq-ct">
                    <span>{t.still}</span>
                    {lang === "ko"
                        ? <a href={EXTERNAL.kakaoChat} target="_blank" rel="noopener noreferrer" className="kk"><KakaoLine />{t.contact}</a>
                        : <a href="mailto:hioceanstar@gmail.com" className="ml">{t.contact}</a>}
                </div>
            </div>
        </div>,
        root,
    );
}
