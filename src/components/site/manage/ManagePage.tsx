/** 내 예약 관리 (캔버스 Manage*). 히어로·푸터는 서버에서, 조회·변경·취소는 ManageClient. */
import type { TourSetting } from "@/lib/tourUtils";
import type { BlockedDate } from "@/lib/siteData";
import { BookButton } from "../BookingContext";
import { Arrow } from "../Icons";
import SiteFooter from "../SiteFooter";
import SiteHeader from "../SiteHeader";
import { availableTours, type Lang } from "../tours";
import ManageClient from "./ManageClient";
import "../detail/detail.css";
import "./manage.css";

const T = {
    ko: {
        heroAlt: "와이키키 바다에 떠 있는 오션스타 보트", h1: <>내 <span className="hl">예약 관리</span></>,
        sub: "예약을 확인하고, 날짜 · 픽업 장소를 바꾸거나 취소할 수 있어요.",
        endH: "지금 바다로 나가 볼까요", endSub: "일요일을 제외하고 매일 출항합니다.<br>원하시는 날짜를 골라 주세요.", book: "예약하기",
    },
    en: {
        heroAlt: "OceanStar boat on the sea off Waikiki", h1: <>Manage <span className="hl">my booking</span></>,
        sub: "Check your booking, change the date or pickup, or cancel.",
        endH: "Ready to head out to sea?", endSub: "We sail every day except Sunday.<br>Pick the date that works for you.", book: "Book Now",
    },
};

export default function ManagePage({ lang, tourSettings, blockedDates }: { lang: Lang; tourSettings: TourSetting[]; blockedDates: BlockedDate[] }) {
    const t = T[lang];
    const tours = availableTours(tourSettings);
    return (
        <div className="dp manage">
            <section className="hero mg-hero">
                <img src="/renewal/private_boat.webp" alt={t.heroAlt} className="hero-img" fetchPriority="high" />
                <span className="veil" />
                <SiteHeader lang={lang} active="manage" tours={tours.map((d) => ({ key: d.key, name: d.short[lang] }))} />
                <div className="hero-in">
                    <h1>{t.h1}</h1>
                    <p className="mg-sub">{t.sub}</p>
                </div>
            </section>
            <ManageClient lang={lang} tourSettings={tourSettings} blockedDates={blockedDates} />
            <div style={{ height: 112 }} className="d-only" />
            <div style={{ height: 64 }} className="m-only" />
            <SiteFooter lang={lang} end={{ h2: t.endH, sub: t.endSub, button: <BookButton className="book-pill light">{t.book} <Arrow /></BookButton> }} />
        </div>
    );
}
