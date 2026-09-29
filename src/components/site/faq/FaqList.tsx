"use client";

import { useEffect, useState } from "react";
import { FAQ, REFUND_NOTE, REFUND_ROWS } from "../faqData";
import { Arrow } from "../Icons";
import type { Lang } from "../tours";
import FaqSheet, { ASK_EVENT } from "./FaqSheet";

const I_SEARCH = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="6.6" /><path d="M16 16l4.2 4.2" />
    </svg>
);
const I_PLUS = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M12 6v12M6 12h12" />
    </svg>
);

const T = {
    ko: { search: "궁금한 걸 물어보세요 · 예) 아기도 탈 수 있어요?", aria: "질문 검색", send: "물어보기", cats: "분류", catsAria: "FAQ 분류", unit: "개" },
    en: { search: "Ask anything · e.g. Can kids join?", aria: "Search questions", send: "Ask", cats: "Topics", catsAria: "FAQ topics", unit: "" },
};

/** 히어로 안의 검색 칸. 물어보면(엔터·버튼) 목록 쪽 FaqSheet 가 아래에서 올라온다 */
export function FaqSearch({ lang }: { lang: Lang }) {
    const t = T[lang];
    return (
        <form className="search" role="search" onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement;
            input.blur(); // 폰 키보드를 내려야 창이 보인다
            window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: input.value }));
        }}>
            {I_SEARCH}
            <input name="q" type="search" aria-label={t.aria} placeholder={t.search} enterKeyHint="search" />
            <button type="submit" className="go" aria-label={t.send}><Arrow size={16} /></button>
        </form>
    );
}

export default function FaqList({ lang }: { lang: Lang }) {
    const t = T[lang];
    const groups = FAQ[lang];
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState<Set<string>>(() => new Set(groups.flatMap((g, gi) => g.items.filter((it, qi) => (gi === 0 && qi === 0) || it.a === null).map((it) => it.id))));

    // 안내 창의 'FAQ 목록에서 보기': 그 질문을 펴고 화면 가운데로
    const show = (id: string) => {
        setOpen((s) => new Set(s).add(id));
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    };

    // 메인에서 /faq#q2-2 로 오면 그 질문을 펴고 그 자리로 간다
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id || !/^q\d+-\d+$/.test(id)) return;
        const raf = requestAnimationFrame(() => {
            setOpen((s) => new Set(s).add(id));
            requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    // 스크롤하는 동안 지금 보고 있는 분류를 켠다
    useEffect(() => {
        const els = groups.map((_, i) => document.getElementById(`c${i}`)).filter(Boolean) as HTMLElement[];
        const io = new IntersectionObserver((entries) => {
            const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (vis) setActive(Number(vis.target.id.slice(1)));
        }, { rootMargin: "-20% 0px -70% 0px" });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [groups]);

    const links = groups.map((g, i) => (
        <a key={g.group} href={`#c${i}`} className={i === active ? "on" : undefined}>
            {g.group}<span className="n">{g.items.length}</span>
        </a>
    ));

    return (
        <div className="fq-body">
            <aside className="cats d-only"><span className="cats-h">{t.cats}</span><nav aria-label={t.catsAria}>{links}</nav></aside>
            <nav className="chips m-only" aria-label={t.catsAria}>{links}</nav>
            <FaqSheet lang={lang} onShow={show} />
            <div className="grps">
                {groups.map((g, gi) => (
                    <section className="grp" id={`c${gi}`} key={g.group}>
                        <div className="grp-h"><h2>{g.group}</h2><span className="n">{g.items.length}{t.unit}</span></div>
                        <div className="qa">
                            {g.items.map((it) => (
                                <details key={it.id} id={it.id} open={open.has(it.id)}
                                    onToggle={(e) => {
                                        const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                                        setOpen((s) => { const n = new Set(s); if (isOpen) n.add(it.id); else n.delete(it.id); return n; });
                                    }}>
                                    <summary><span className="qm">Q</span><span className="qt">{it.q}</span><span className="pm">{I_PLUS}</span></summary>
                                    <div className="ans">
                                        {it.a === null ? (
                                            <>
                                                <div className="refund">
                                                    {REFUND_ROWS[lang].map((r) => <div key={r.when} className={`rf-c ${r.tone}`}><span>{r.when}</span><b>{r.what}</b></div>)}
                                                </div>
                                                <p className="rf-note">{REFUND_NOTE[lang]}</p>
                                            </>
                                        ) : <p>{it.a}</p>}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
