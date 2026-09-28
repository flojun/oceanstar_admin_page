/**
 * FAQ (캔버스 FaqKo · FaqEn). docs/design-canvas/v3/build_faq.py 를 옮겼다.
 * 모든 분류를 한 페이지에 싣고 왼쪽(폰은 위쪽) 분류 목록으로 건너뛴다. 검색 칸은 질문·답을 거른다.
 */
import type { TourSetting } from "@/lib/tourUtils";
import { BookButton } from "../BookingContext";
import { Arrow } from "../Icons";
import SiteFooter from "../SiteFooter";
import SiteHeader from "../SiteHeader";
import { availableTours, type Lang } from "../tours";
import FaqList, { FaqSearch } from "./FaqList";
import { faqJsonLd, ldJson } from "../jsonLd";
import "../detail/detail.css";
import "./faq.css";

const svg = (p: React.ReactNode, size = 24, sw = 1.7) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p}</svg>
);
const IC = {
    float: svg(<><ellipse cx="12" cy="13" rx="8.6" ry="4.6" /><ellipse cx="12" cy="13" rx="3.6" ry="1.8" /><path d="M2.8 19c2.2 1 4.4 1 6.6 0s4.4-1 6.6 0 4.4 1 6.2 0" /></>),
    guide: svg(<><circle cx="9" cy="7.4" r="3.2" /><path d="M3 20.2a6 6 0 0 1 12 0" /><path d="M17.6 3.6v9.4M17.6 3.6h3.6l-1.2 2.1 1.2 2.1h-3.6" /></>),
    cal: svg(<><rect x="3.6" y="5.2" width="16.8" height="15" rx="2" /><path d="M3.6 10h16.8M8 3.4v3.6M16 3.4v3.6M8 14h2M14 14h2M8 17h2" /></>),
    turtle: svg(<><path d="M4.6 13.4a6.6 5 0 0 1 13.2 0z" /><path d="M3.4 13.4h15.6" /><circle cx="19.6" cy="11.2" r="1.7" /><path d="M6.4 13.6l-1.6 3.2M15.8 13.6l1.6 3.2M9.2 8.9l1.9 4.5M13.3 8.9l-1.9 4.5" /></>),
};
const I_CHAT = svg(<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z" />, 18, 1.8);
const I_MAIL = svg(<><rect x="3.6" y="5.6" width="16.8" height="12.8" rx="2" /><path d="M4.4 7l7.6 6 7.6-6" /></>, 18, 1.8);

const T = {
    ko: {
        heroAlt: "와이키키 앞바다에 떠 있는 오션스타 보트와 다이아몬드헤드",
        h1: <>자주 묻는 <span className="hl">질문</span></>, sub: "예약 전에 가장 많이 물어보시는 것들을 분류별로 모았어요.",
        quick: [["float", "수영 못해도 괜찮아요", "크루가 물속에서 옆에"], ["guide", "만 24개월부터", "보호자와 함께 타요"], ["cal", "7일 전 전액 환불", "하와이 현지 시각 기준"], ["turtle", "거북이 100% 보장", "못 보면 재방문 혜택"]] as const,
        quickAria: "먼저 알면 좋은 것",
        askH: "원하는 답이 없으신가요?", askP: ["카카오톡으로 물어보시면 한국어로 바로 답해 드려요.", "하와이 현지 기준 월~토 09:00~17:00"],
        askA: "카카오톡 문의", askB: "이메일 보내기",
        endH: "지금 바다로 나가 볼까요", endSub: "일요일을 제외하고 매일 출항합니다.<br>원하시는 날짜를 골라 주세요.", book: "예약하기",
    },
    en: {
        heroAlt: "OceanStar boat off Waikiki with Diamond Head behind",
        h1: <>Questions, <span className="hl">answered</span></>, sub: "What guests ask us most before booking, sorted by topic.",
        quick: [["float", "Non-swimmers welcome", "Crew beside you in the water"], ["guide", "Ages 2 and up", "Minors with a guardian"], ["cal", "Full refund 7+ days out", "Based on Hawaii time"], ["turtle", "Turtles guaranteed", "Or a perk next visit"]] as const,
        quickAria: "Good to know",
        askH: "Still have a question?", askP: ["Message us and we’ll get back to you quickly.", "Mon - Sat 09:00 - 17:00, Hawaii time"],
        askA: "Email Us", askB: "Call +1 808-308-1792",
        endH: "Ready to head out to sea?", endSub: "We sail every day except Sunday.<br>Pick the date that works for you.", book: "Book Now",
    },
};

export default function FaqPage({ lang, tourSettings }: { lang: Lang; tourSettings: TourSetting[] }) {
    const t = T[lang];
    const tours = availableTours(tourSettings);
    return (
        <div className="dp faq">
            <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqJsonLd(lang))} />
            <section className="hero fq-hero">
                <img src="/renewal/hero_waikiki.jpg" alt={t.heroAlt} className="hero-img" fetchPriority="high" />
                <span className="veil" />
                <SiteHeader lang={lang} active="faq" tours={tours.map((d) => ({ key: d.key, name: d.short[lang] }))} />
                <div className="hero-in">
                    <h1>{t.h1}</h1>
                    <p className="fq-sub">{t.sub}</p>
                    <FaqSearch lang={lang} />
                </div>
            </section>
            <ul className="quick" aria-label={t.quickAria}>
                {t.quick.map(([k, h, s]) => <li key={h}><span className="ic">{IC[k]}</span><div><b>{h}</b><span>{s}</span></div></li>)}
            </ul>
            <FaqList lang={lang} />
            <section className="ask rise">
                <div><h2>{t.askH}</h2><p>{t.askP[0]}<br />{t.askP[1]}</p></div>
                <div className="ask-b">
                    {lang === "ko" ? (
                        <>
                            <a href="http://pf.kakao.com/_yxfcExj" className="book-pill" target="_blank" rel="noopener noreferrer">{I_CHAT}{t.askA}</a>
                            <a href="mailto:hioceanstar@gmail.com" className="line-pill">{I_MAIL}{t.askB}</a>
                        </>
                    ) : (
                        <>
                            <a href="mailto:hioceanstar@gmail.com" className="book-pill">{I_MAIL}{t.askA}</a>
                            <a href="tel:+18083081792" className="line-pill">{t.askB}</a>
                        </>
                    )}
                </div>
            </section>
            <SiteFooter lang={lang} end={{ h2: t.endH, sub: t.endSub, button: <BookButton className="book-pill light">{t.book} <Arrow /></BookButton> }} />
        </div>
    );
}
