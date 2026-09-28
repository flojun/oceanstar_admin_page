"use client";

import { useEffect, useMemo, useState } from "react";
import { FAQ, REFUND_NOTE, REFUND_ROWS } from "../faqData";
import type { Lang } from "../tours";

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
    ko: { search: "멀미, 픽업, 환불처럼 궁금한 말을 검색해 보세요", searchM: "멀미, 픽업, 환불 검색", aria: "질문 검색", cats: "분류", catsAria: "FAQ 분류", unit: "개", none: "찾는 질문이 없어요. 아래 카카오톡으로 물어봐 주세요." },
    en: { search: "Search seasickness, pickup, refunds…", searchM: "Search pickup, refunds…", aria: "Search questions", cats: "Topics", catsAria: "FAQ topics", unit: "", none: "No matching question. Ask us below." },
};

/** 검색 칸은 히어로 안에 있고 목록은 아래에 있어 둘 다 이 컴포넌트가 그린다 (slot 으로 나눠 놓는다) */
export function FaqSearch({ lang }: { lang: Lang }) {
    const t = T[lang];
    return (
        <label className="search">
            {I_SEARCH}
            <input
                type="search"
                aria-label={t.aria}
                placeholder={t.search}
                onChange={(e) => window.dispatchEvent(new CustomEvent("os-faq-search", { detail: e.target.value }))}
            />
        </label>
    );
}

export default function FaqList({ lang }: { lang: Lang }) {
    const t = T[lang];
    const groups = FAQ[lang];
    const [q, setQ] = useState("");
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState<Set<string>>(() => new Set(groups.flatMap((g, gi) => g.items.filter((it, qi) => (gi === 0 && qi === 0) || it.a === null).map((it) => it.id))));

    useEffect(() => {
        const on = (e: Event) => setQ(String((e as CustomEvent).detail ?? ""));
        window.addEventListener("os-faq-search", on);
        return () => window.removeEventListener("os-faq-search", on);
    }, []);

    // 메인에서 /faq#q2-2 로 오면 그 질문을 펴고 그 자리로 간다
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id || !/^q\d+-\d+$/.test(id)) return;
        setOpen((s) => new Set(s).add(id));
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
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

    const norm = (s: string) => s.replace(/<[^>]+>/g, "").toLowerCase();
    const needle = q.trim().toLowerCase();
    const shown = useMemo(() => groups.map((g) => ({
        ...g,
        items: needle ? g.items.filter((it) => norm(it.q).includes(needle) || norm(it.a ?? "환불 refund").includes(needle)) : g.items,
    })), [groups, needle]);
    const total = shown.reduce((n, g) => n + g.items.length, 0);

    const links = shown.map((g, i) => (
        <a key={g.group} href={`#c${i}`} className={i === active ? "on" : undefined}>
            {g.group}<span className="n">{g.items.length}</span>
        </a>
    ));

    return (
        <div className="fq-body">
            <aside className="cats d-only"><span className="cats-h">{t.cats}</span><nav aria-label={t.catsAria}>{links}</nav></aside>
            <nav className="chips m-only" aria-label={t.catsAria}>{links}</nav>
            <div className="grps">
                {total === 0 && <p className="fq-none">{t.none}</p>}
                {shown.map((g, gi) => g.items.length > 0 && (
                    <section className="grp" id={`c${gi}`} key={g.group}>
                        <div className="grp-h"><h2>{g.group}</h2><span className="n">{g.items.length}{t.unit}</span></div>
                        <div className="qa">
                            {g.items.map((it) => (
                                <details key={it.id} id={it.id} open={!!needle || open.has(it.id)}
                                    onToggle={(e) => {
                                        const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                                        if (needle) return;
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
