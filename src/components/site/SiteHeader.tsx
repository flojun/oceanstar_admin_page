"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { setLanguageCookie } from "@/lib/translations";
import { BookButton } from "./BookingContext";
import { Arrow, Burger, Chevron, Close, KakaoLine, Ticket } from "./Icons";
import { EXTERNAL, links, otherLangPath } from "./links";
import type { Lang, TourKey } from "./tours";

export type NavKey = "home" | "tours" | "reviews" | "faq" | "restaurants" | "manage" | null;

const T = {
    ko: {
        tours: "투어", reviews: "고객후기", faq: "FAQ", food: "맛집 추천", manage: "내 예약 관리",
        manageSub: "예약 확인 · 날짜 변경 · 취소", book: "투어 예약하기", other: "EN", otherLong: "EN",
        menu: "메뉴 열기", close: "메뉴 닫기", kakao: "카카오톡 문의", hours: "하와이 현지 기준 월~토 09:00~17:00",
        me: "한국어", logo: "오션스타",
    },
    en: {
        tours: "Tours", reviews: "Reviews", faq: "FAQ", food: "Where we eat", manage: "Manage My Booking",
        manageSub: "Check · change date · cancel", book: "Book a tour", other: "한국어", otherLong: "한국어",
        menu: "Open menu", close: "Close menu", kakao: "Ask on KakaoTalk", hours: "Mon to Sat, 09:00-17:00 (HST)",
        me: "EN", logo: "Oceanstar",
    },
};

export default function SiteHeader({ lang, active, tours }: { lang: Lang; active: NavKey; tours: { key: TourKey; name: string }[] }) {
    const t = T[lang];
    const L = links(lang);
    const pathname = usePathname() || L.home;
    const otherHref = otherLangPath(pathname, lang);
    const [drop, setDrop] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const ddRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!drop) return;
        const off = (e: MouseEvent) => { if (!ddRef.current?.contains(e.target as Node)) setDrop(false); };
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setDrop(false); };
        document.addEventListener("mousedown", off);
        document.addEventListener("keydown", esc);
        return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
    }, [drop]);

    useEffect(() => {
        if (!drawer) return;
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
        document.addEventListener("keydown", esc);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
    }, [drawer]);

    const switchLang = () => setLanguageCookie(lang === "ko" ? "en" : "ko");

    return (
        <header className="nav">
            <Link href={L.home} className="logo-link" aria-label={t.logo}>
                <img src="/renewal/logo_full.png" alt={t.logo} className="logo" width={46} height={44} />
            </Link>
            <nav className="menu" aria-label={lang === "en" ? "Main" : "주 메뉴"}>
                <Link href={L.home} className={active === "home" ? "on" : undefined}>Home</Link>
                <div className="dd" ref={ddRef}>
                    <button type="button" className={active === "tours" ? "on" : undefined} aria-expanded={drop} aria-haspopup="true" onClick={() => setDrop((v) => !v)}>
                        {t.tours} <Chevron dir="down" size={13} />
                    </button>
                    {drop && (
                        <div className="dd-list">
                            {tours.map((x) => (
                                <Link key={x.key} href={L.tour(x.key)} onClick={() => setDrop(false)}>
                                    {x.name} <Chevron size={14} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                <Link href={L.reviews} className={active === "reviews" ? "on" : undefined}>{t.reviews}</Link>
                <Link href={L.faq} className={active === "faq" ? "on" : undefined}>FAQ</Link>
            </nav>
            <div className="nav-r">
                <a href={otherHref} className="lang-pill" hrefLang={lang === "ko" ? "en" : "ko"} onClick={switchLang}>{t.other}</a>
                <Link href={L.manage} className="ghost-pill">{t.manage}</Link>
                <BookButton className="book-pill">{t.book} <Arrow /></BookButton>
                <a href={otherHref} className="lang" hrefLang={lang === "ko" ? "en" : "ko"} onClick={switchLang}>{lang === "ko" ? "EN" : "KO"}</a>
                <button type="button" className="burger" aria-label={t.menu} aria-expanded={drawer} onClick={() => setDrawer(true)}><Burger /></button>
            </div>

            {drawer && (
                <div className="os-drawer-root" role="dialog" aria-modal="true" aria-label={lang === "en" ? "Menu" : "메뉴"}>
                    <div className="dim" onClick={() => setDrawer(false)} />
                    <nav className="drawer">
                        <div className="dr-h">
                            <span className="seg">
                                {lang === "ko" ? (
                                    <><a href={pathname} className="on" aria-current="true">한국어</a><a href={otherHref} hrefLang="en" onClick={switchLang}>EN</a></>
                                ) : (
                                    <><a href={otherHref} hrefLang="ko" onClick={switchLang}>한국어</a><a href={pathname} className="on" aria-current="true">EN</a></>
                                )}
                            </span>
                            <button type="button" className="dr-x" aria-label={t.close} onClick={() => setDrawer(false)}><Close /></button>
                        </div>
                        <ul className="links">
                            <li><Link href={L.home} className="lk" onClick={() => setDrawer(false)}>Home</Link></li>
                            <li>
                                <span className="lk">{t.tours}</span>
                                <ul className="sub">
                                    {tours.map((x) => (
                                        <li key={x.key}><Link href={L.tour(x.key)} onClick={() => setDrawer(false)}>{x.name}</Link></li>
                                    ))}
                                </ul>
                            </li>
                            <li><Link href={L.reviews} className="lk" onClick={() => setDrawer(false)}>{t.reviews}</Link></li>
                            <li><Link href={L.faq} className="lk" onClick={() => setDrawer(false)}>FAQ</Link></li>
                            <li><Link href={L.restaurants} className="lk" onClick={() => setDrawer(false)}>{t.food}</Link></li>
                        </ul>
                        <Link href={L.manage} className="mg" onClick={() => setDrawer(false)}>
                            <span className="ic"><Ticket /></span>
                            <span className="mg-t"><b>{t.manage}</b><span>{t.manageSub}</span></span>
                            <Chevron />
                        </Link>
                        <div className="dr-f">
                            <DrawerBook label={t.book} onDone={() => setDrawer(false)} />
                            <p className="dr-ct">
                                <a href={EXTERNAL.kakaoChat} target="_blank" rel="noopener noreferrer"><KakaoLine />{t.kakao}</a>
                                <span>{t.hours}</span>
                            </p>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

function DrawerBook({ label, onDone }: { label: string; onDone: () => void }) {
    // 서랍을 닫고 예약 창을 연다
    return (
        <span onClickCapture={onDone} style={{ display: "contents" }}>
            <BookButton className="book-pill">{label} <Arrow /></BookButton>
        </span>
    );
}
