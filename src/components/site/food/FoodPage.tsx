/**
 * 맛집 추천 (캔버스 FoodKo · FoodEn). docs/design-canvas/v3/build_restaurants.py 를 옮겼다.
 * 투어를 마친 손님이 배에서 QR 로 여는 페이지라, 인사와 재예약 혜택을 맨 위에, 친구에게 넘길 QR 을 맨 끝에 둔다.
 * 가게 목록은 카드 없이 안내서처럼: 분류 제목은 왼쪽 기둥(폰은 위), 가게는 오른쪽에 두 줄로 흐른다.
 */
import type { TourSetting } from "@/lib/tourUtils";
import { BookButton } from "../BookingContext";
import { Arrow } from "../Icons";
import { EXTERNAL } from "../links";
import SiteFooter from "../SiteFooter";
import SiteHeader from "../SiteHeader";
import { availableTours, type Lang } from "../tours";
import { FoodChips, FoodQr } from "./FoodClient";
import { FOOD, POKE_TIP, type FoodKey } from "./foodData";
import "../detail/detail.css";
import "./food.css";

const svg = (p: React.ReactNode, size = 22, sw = 1.7) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{p}</svg>
);
const I_PIN = svg(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>, 15, 1.8);
const I_CHAT = svg(<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z" />, 18, 1.8);
const I_MAIL = svg(<><rect x="3.6" y="5.6" width="16.8" height="12.8" rx="2" /><path d="M4.4 7l7.6 6 7.6-6" /></>, 18, 1.8);
const I_TAG = svg(<><path d="M3.8 12.6V4.8a1 1 0 0 1 1-1h7.8l7.6 7.6a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0z" /><circle cx="8.3" cy="8.3" r="1.4" /></>);
const I_HEART = svg(<path d="M12 20s-7.4-4.4-7.4-10a4.2 4.2 0 0 1 7.4-2.7A4.2 4.2 0 0 1 19.4 10c0 5.6-7.4 10-7.4 10z" />);
const CAT_ICON: Record<FoodKey, React.ReactNode> = {
    sushi: svg(<><path d="M3 12c3-4.5 9-6 14-2l3.6-2.4-1.2 4.4 1.2 4.4L17 14c-5 4-11 2.5-14-2z" /><circle cx="8" cy="11.2" r=".9" fill="currentColor" /></>),
    local: svg(<><path d="M12 21v-9" /><path d="M12 12c-1.5-3.5-5-5-8.5-4.2 2.2.4 4.6 1.8 5.6 4.2" /><path d="M12 12c1.5-3.5 5-5 8.5-4.2-2.2.4-4.6 1.8-5.6 4.2" /><path d="M12 12c-.4-3.6 1.6-6.6 4.8-7.8-1.6 1.6-2.6 3.8-2.4 6" /></>),
    waikiki: svg(<><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></>),
    poke: svg(<><path d="M3.4 10.6h17.2a8.6 8.6 0 0 1-17.2 0z" /><path d="M8 7.6c0-1.2 1-1.6 1-2.7M12 7.3c0-1.4 1-1.8 1-3M16 7.6c0-1.2 1-1.6 1-2.7" /></>, 24),
    dessert: svg(<><path d="M8 10a4 4 0 1 1 8 0" /><path d="M7 10h10l-5 11z" /></>),
};

const T = {
    ko: {
        heroAlt: "와이키키 시내와 다이아몬드헤드가 보이는 바다",
        h1: <>오션스타 <span className="hl">하와이 맛집</span></>,
        sub: "크루들이 직접 다니는 와이키키 · 호놀룰루 맛집을 모았어요.",
        hiH: "오늘 즐거운 투어 되셨길 바랍니다", hiP: "오션스타 많이많이 추천 부탁드립니다.",
        dealH: "웹사이트로 예약하면 추가 할인", dealP: "다음 투어는 오션스타 홈페이지에서 예약해 주세요.",
        tellH: "예약 때 이렇게 말씀해 주세요", tellP: <><b>재방문</b> 또는 <b>지인추천</b></>,
        book: "투어 예약하기", catsAria: "맛집 분류", map: "지도 보기",
        endH: "하와이에서 더 맛있고 즐거운 여행 되세요", endP: "마할로! 더 궁금한 점은 카카오톡으로 물어봐 주세요.", endBtn: "카카오톡 문의",
        qrH: "친구에게 이 페이지 보내기", qrP: "휴대폰 카메라로 찍으면 바로 열려요.", qrDl: "QR 코드 다운로드",
        qrUrl: "https://oceanstarhi.com/kr/restaurants", qrAlt: "맛집 추천 페이지 QR 코드",
        footH: "지금 바다로 나가 볼까요", footSub: "일요일을 제외하고 매일 출항합니다.<br>원하시는 날짜를 골라 주세요.", footBtn: "예약하기",
    },
    en: {
        heroAlt: "The sea off Waikiki with the city and Diamond Head",
        h1: <>OceanStar <span className="hl">food picks</span></>,
        sub: "Places our crew actually eat at around Waikiki and Honolulu.",
        hiH: "Hope you had a great tour today!", hiP: "Tell your friends about OceanStar.",
        dealH: "Extra discount when you book on our site", dealP: "Book your next tour on the OceanStar website.",
        tellH: "When you book, mention", tellP: <><b>Returning guest</b> or <b>Friend referral</b></>,
        book: "Book a Tour", catsAria: "Food categories", map: "View map",
        endH: "Enjoy great food in Hawaii!", endP: "Mahalo! Questions? Send us an email or give us a call.", endBtn: "Email Us",
        qrH: "Share this page", qrP: "Point your phone camera here to open it.", qrDl: "Download QR code",
        qrUrl: "https://oceanstarhi.com/restaurants", qrAlt: "QR code for this page",
        footH: "Ready to head out to sea?", footSub: "We sail every day except Sunday.<br>Pick the date that works for you.", footBtn: "Book Now",
    },
};

export default function FoodPage({ lang, tourSettings }: { lang: Lang; tourSettings: TourSetting[] }) {
    const t = T[lang];
    const tours = availableTours(tourSettings);
    const cats = FOOD[lang];
    const [tipH, tipA, tipB] = POKE_TIP[lang];
    return (
        <div className="dp food">
            {/* 히어로 — 사진 속 배를 가리지 않게 글은 왼쪽 위(폰은 위 가운데)에만 둔다 */}
            <section className="hero rs-hero">
                <img src="/renewal/hero_waikiki.jpg" alt={t.heroAlt} className="hero-img" fetchPriority="high" />
                <span className="veil" />
                <SiteHeader lang={lang} active="restaurants" tours={tours.map((d) => ({ key: d.key, name: d.short[lang] }))} />
                <div className="hero-in">
                    <h1>{t.h1}</h1>
                    <p className="rs-sub">{t.sub}</p>
                </div>
            </section>

            {/* 인사 · 재예약 혜택 (예전 페이지 맨 위 인사 칸) */}
            <section className="hello rise">
                <div className="hi"><h2>{t.hiH}</h2><p>{t.hiP}</p></div>
                <ul className="perks">
                    <li><span className="ic">{I_TAG}</span><div><b>{t.dealH}</b><span>{t.dealP}</span></div></li>
                    <li><span className="ic">{I_HEART}</span><div><b>{t.tellH}</b><span className="say">{t.tellP}</span></div></li>
                </ul>
                <BookButton className="book-pill">{t.book} <Arrow /></BookButton>
            </section>

            <div className="rs-body">
                <FoodChips aria={t.catsAria} chips={cats.map((c) => ({ key: c.key, icon: CAT_ICON[c.key], title: c.title, n: c.items.length }))} />
                {cats.map((c) => (
                    <section className="cat rise" id={c.key} key={c.key}>
                        <header className="cat-h">
                            <span className="ic">{CAT_ICON[c.key]}</span>
                            <h2>{c.title}</h2>
                            {c.key === "poke" && <div className="tip"><span className="tip-h">{tipH}</span><b>{tipA}</b><p>{tipB}</p></div>}
                        </header>
                        <ul className="ents">
                            {c.items.map((it) => (
                                <li key={it.name}>
                                    <h3>{it.name}</h3>
                                    {it.desc && <p>{it.desc}</p>}
                                    <a href={it.map} className="map" target="_blank" rel="noopener noreferrer" aria-label={`${it.name} ${t.map}`}>{I_PIN}{t.map}</a>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>

            {/* 맺음 칸 — 문의 버튼 + 친구에게 넘길 QR (예전 페이지의 'QR 보기' 창을 여기로 옮겼다) */}
            <section className="ending rise">
                <div className="e-l">
                    <h2>{t.endH}</h2>
                    <p>{t.endP}</p>
                    {lang === "ko"
                        ? <a href={EXTERNAL.kakaoChat} className="book-pill" target="_blank" rel="noopener noreferrer">{I_CHAT}{t.endBtn}</a>
                        : <a href="mailto:hioceanstar@gmail.com" className="book-pill">{I_MAIL}{t.endBtn}</a>}
                </div>
                <FoodQr url={t.qrUrl} alt={t.qrAlt} h={t.qrH} p={t.qrP} download={t.qrDl} />
            </section>
            <SiteFooter lang={lang} end={{ h2: t.footH, sub: t.footSub, button: <BookButton className="book-pill light">{t.footBtn} <Arrow /></BookButton> }} />
        </div>
    );
}
