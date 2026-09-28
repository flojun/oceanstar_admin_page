import Link from "next/link";
import { maskName } from "@/lib/utils";
import type { TourSetting } from "@/lib/tourUtils";
import type { GoogleReview } from "@/lib/siteData";
import { BookButton } from "./BookingContext";
import { Arrow, Check, Chevron, Play, Plus, Stars } from "./Icons";
import { EXTERNAL, links } from "./links";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import TourScroller, { type CardData } from "./TourScroller";
import { FAQ_TOP } from "./faqData";
import { GOOGLE_SUMMARY } from "./siteConfig";
import { homeJsonLd, ldJson } from "./jsonLd";
import { FEATURES, availableTours, currencyOf, priceCaption, priceText, timeLines, type Lang } from "./tours";

const T = {
    ko: {
        heroAlt: "와이키키 앞바다의 오션스타 보트, 왼쪽으로 와이키키 스카이라인과 오른쪽으로 다이아몬드헤드",
        tag: "Hawaii's Best Tour",
        h1a: "평생토록 기억에 남을 스노클링", h1b: "지금, ", h1em: "오션스타", h1c: "에서",
        hft: "하와이 와이키키 거북이 스노클링 투어",
        loved: "누적 리뷰 15,000+ · Since 2019 하와이 최초 개설", lovedM: "누적 리뷰 15,000+",
        intro: ["와이키키 앞바다에서 야생 바다거북을 만나는 한국어 스노클링 투어입니다. 51인승 루프탑 보트로 이동하고 해양 전문 한국인 크루가 함께해, 수영을 못해도 참여할 수 있습니다.", "거북이 관찰 100% 보장."],
        bookNow: "바로 예약하기",
        strip: [["Since", "2019", "하와이 최초 개설"], ["", "15,000+", "누적 리뷰"], ["", "100%", "거북이 관찰 보장"], ["", "51인승", "루프탑 보트"]],
        toursPill: "투어 프로그램", toursH: "오션스타 추천 프로그램", toursHl: "당신의 완벽한 하와이 여행을 위한 최고의 선택",
        filters: ["전체", "거북이 스노클링", "콤보", "프라이빗 단독"],
        book: "예약하기", detail: "진행 코스 보기",
        cmpPill: "상품 고르기", cmpH: (n: number) => `${["", "한", "두", "세", "네", "다섯", "여섯"][n] ?? n} 가지 바다,`, cmpHl: "당신에게 맞는 하나",
        popular: "가장 많이 찾는", picked: "고르셨다면",
        rvPill: "투어 리뷰", rvH: "다녀오신 분들이", rvHl: "직접 남긴 후기",
        rvP: ["구글에 남겨주신 후기에서 글과 별점을 그대로 옮겼습니다.", "이름은 운영 중인 화면과 같은 규칙으로 가립니다."],
        rvLab: "Google 리뷰", rvN: (n: string, d: string) => <>구글 맵 리뷰 <b>{n}</b>개 · {d} 기준</>,
        rvAll: "구글 리뷰 전체 보기", rvSite: "웹사이트 리뷰 보기",
        filmPill: "투어 영상", filmH: "오션스타 투어를", filmHl: "영상으로 먼저 보기",
        filmAlt: "사춘기 딸 vs 갱년기 엄마 위기의 하와이 모녀 여행", filmB: "야노시호 · 추사랑 모녀가 다녀간 날", filmI: "유튜브 야노시호 YanoShiho",
        faqH: "자주 묻는", faqHl: "질문", faqP: ["가장 많이 주신 질문 여섯 가지입니다.", "나머지도 FAQ 페이지에 전부 답해 뒀습니다."], faqAll: "FAQ 전체 보기",
        plat: ["구글", "GetYourGuide", "마이리얼트립"],
    },
    en: {
        heroAlt: "The Oceanstar boat off Waikiki, with the Waikiki skyline to the left and Diamond Head to the right",
        tag: "Hawaii’s Best Tour",
        h1a: "Snorkel with wild sea turtles", h1b: "off Waikiki, with ", h1em: "Oceanstar", h1c: "",
        hft: "Waikiki Turtle Snorkeling Tour",
        loved: "15,000+ guest reviews. On the water since 2019.", lovedM: "15,000+ guest reviews",
        intro: ["Wild sea turtles off Waikiki, from a 51-seat rooftop boat.", "English-speaking crew swim beside you. Non-swimmers welcome."],
        bookNow: "Book a tour",
        strip: [["Since", "2019", "Running in Waikiki"], ["", "15,000+", "Guest reviews"], ["", "100%", "Turtle sighting guarantee"], ["", "51 seats", "Rooftop boat"]],
        toursPill: "Our tours", toursH: "Tours we recommend", toursHl: "for your days in Hawaii",
        filters: ["All", "Turtle snorkeling", "Combo", "Private charter"],
        book: "Book a tour", detail: "View details",
        cmpPill: "Compare", cmpH: (n: number) => `${["", "One", "Two", "Three", "Four", "Five", "Six"][n] ?? n} tours,`, cmpHl: "one that fits your trip",
        popular: "Most booked", picked: "Ready to book",
        rvPill: "Reviews", rvH: "From the people", rvHl: "who were on the boat",
        rvP: ["Star ratings and text are copied from Google exactly as written.", "Names are masked the same way they are on the live site."],
        rvLab: "Google reviews", rvN: (n: string, d: string) => <><b>{n}</b> Google Maps reviews as of {d}</>,
        rvAll: "Read all on Google", rvSite: "Reviews on our site",
        filmPill: "Video", filmH: "See the tour", filmHl: "before you book",
        filmAlt: "Shiho Yano and her daughter on the Oceanstar boat", filmB: "Shiho Yano and her daughter on board", filmI: "YouTube · YanoShiho",
        faqH: "Questions we get", faqHl: "a lot", faqP: ["The six we are asked most.", "Everything else is answered in full on the FAQ page."], faqAll: "See all FAQs",
        plat: ["Google", "GetYourGuide", "MyRealTrip"],
    },
};

export default function HomePage({ lang, tourSettings, googleReviews }: { lang: Lang; tourSettings: TourSetting[]; googleReviews: GoogleReview[] }) {
    const t = T[lang];
    const L = links(lang);
    const cur = currencyOf(lang);
    const tours = availableTours(tourSettings);
    const cards: CardData[] = tours.map((d) => ({
        key: d.key,
        filter: d.filter,
        img: d.img,
        alt: d.alt[lang],
        name: d.name[lang],
        times: timeLines(d, tourSettings, lang),
        price: priceText(d, tourSettings, cur, lang),
        caption: priceCaption(d, lang),
        href: L.tour(d.key),
    }));
    const filterIds = ["all", "turtle", "combo", "private"] as const;
    const filters = filterIds
        .map((id, i) => ({ id, label: t.filters[i] }))
        .filter((f) => f.id === "all" || tours.some((d) => d.filter === f.id));
    // 비교표: 판매 중인 상품에 해당하는 기능 행만 남긴다 (서핑이 없으면 '서핑 강습' 행도 빠진다)
    const featureRows = FEATURES[lang]
        .map((label, i) => ({ label, cells: tours.map((d) => d.features[i]) }))
        .filter((r) => r.cells.some(Boolean));
    const reviews = googleReviews.slice(0, 6);
    const cols = { ["--cols" as string]: tours.length } as React.CSSProperties;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(homeJsonLd(lang, tourSettings))} />
            <section className="hero home-hero">
                <img src="/renewal/hero_waikiki.jpg" alt={t.heroAlt} className="hero-img" data-image-slot="landing.hero" fetchPriority="high" width={1900} height={805} />
                <span className="veil" />
                <SiteHeader lang={lang} active="home" tours={tours.map((d) => ({ key: d.key, name: d.short[lang] }))} />
                <div className="hero-mid">
                    <span className="tag">{t.tag}</span>
                    <h1>
                        <span className="thin">{t.h1a}</span><br />
                        {t.h1b}<em>{t.h1em}</em>{t.h1c}
                    </h1>
                </div>
                <div className="hero-foot">
                    <div className="hf-left">
                        <span className="hf-t">{t.hft}</span>
                        <div className="loved">
                            <span className="dots">
                                <i><img src="/renewal/plat_google.png" alt={t.plat[0]} width={22} height={22} /></i>
                                <i><img src="/renewal/plat_gyg.png" alt={t.plat[1]} width={22} height={19} /></i>
                                <i><img src="/renewal/plat_mrt.png" alt={t.plat[2]} width={22} height={16} /></i>
                            </span>
                            <b><span className="d-only">{t.loved}</span><span className="m-only">{t.lovedM}</span></b>
                        </div>
                        <p className="bal">{t.intro[0]}<br />{t.intro[1]}</p>
                        <BookButton className="book-pill light">{t.bookNow} <Arrow /></BookButton>
                    </div>
                </div>
            </section>

            <section className="strip" aria-label={lang === "en" ? "At a glance" : "한눈에 보기"}>
                {t.strip.map(([pre, big, cap]) => (
                    <span key={cap}><b>{pre && <em>{pre}</em>}{big}</b><i>{cap}</i></span>
                ))}
            </section>

            <section className="sect center" id="tours">
                <div className="rise">
                    <span className="pill"><Plus size={13} /> {t.toursPill}</span>
                    <h2>{t.toursH}<br /><span className="hl">{t.toursHl}</span></h2>
                </div>
                <TourScroller cards={cards} filters={filters} labels={{ book: t.book, detail: t.detail }} />
            </section>

            <section className="panel">
                <div className="center rise">
                    <span className="pill"><Plus size={13} /> {t.cmpPill}</span>
                    <h2>{t.cmpH(tours.length)}<br /><span className="hl">{t.cmpHl}</span></h2>
                </div>
                <div className="cmp" role="table">
                    <div className="crow chead rise" role="row" style={cols}>
                        <div className="cc lead" role="columnheader" />
                        {tours.map((d, i) => (
                            <div key={d.key} className={`cc${i === 0 ? " on" : ""}`} role="columnheader">
                                {i === 0 && <span className="ctag">{t.popular}</span>}
                                <b>{d.name[lang]}</b>
                                <em className="n">{priceText(d, tourSettings, cur, lang)}</em>
                                <i>{priceCaption(d, lang)}</i>
                            </div>
                        ))}
                    </div>
                    {featureRows.map((r, ri) => (
                        <div key={r.label} className="crow rise" role="row" style={{ ...cols, animationRange: `entry ${6 + ri * 2}% cover ${30 + ri * 2}%` }}>
                            <div className="cc lead" role="rowheader">{r.label}</div>
                            {r.cells.map((on, i) => (
                                <div key={i} className={`cc${i === 0 ? " on" : ""}`} role="cell">
                                    {on ? <Check /> : null}
                                    <span className="sr">{on ? "O" : "X"}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <div className="crow cfoot rise" role="row" style={cols}>
                        <div className="cc lead" role="rowheader">{t.picked}</div>
                        {tours.map((d, i) => (
                            <div key={d.key} className={`cc${i === 0 ? " on" : ""}`} role="cell">
                                <BookButton tour={d.key} className="book" label={`${d.name[lang]} ${t.book}`}>{t.book} <Arrow /></BookButton>
                                <Link href={L.tour(d.key)} className="detail" aria-label={`${d.name[lang]} ${t.detail}`}>{t.detail}</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="sect" id="reviews">
                <div className="rv-top"><span className="pill"><Plus size={13} /> {t.rvPill}</span></div>
                <div className="rv-head rise">
                    <div>
                        <span className="pill m-only m-pill"><Plus size={13} /> {t.rvPill}</span>
                        <h2>{t.rvH}<br /><span className="hl">{t.rvHl}</span></h2>
                        <p>{t.rvP[0]}<br />{t.rvP[1]}</p>
                    </div>
                    <div className="rv-sum">
                        <span className="lab">{t.rvLab}</span>
                        <div className="rv-score"><b>{GOOGLE_SUMMARY.rating.toFixed(1)}</b><Stars /></div>
                        <span className="rv-n">{t.rvN(GOOGLE_SUMMARY.count.toLocaleString("en-US"), GOOGLE_SUMMARY.asOf)}</span>
                        <div className="rv-btn">
                            <a href={EXTERNAL.googleReviews} className="dark-pill" target="_blank" rel="noopener noreferrer">{t.rvAll} <Arrow /></a>
                            <Link href={L.reviews} className="line-pill">{t.rvSite} <Arrow /></Link>
                        </div>
                    </div>
                </div>
                {reviews.length > 0 && (
                    <div className="rv-list rise">
                        {reviews.map((r) => (
                            <figure key={r.id} className="rv-c">
                                <Stars />
                                <blockquote>{r.content}</blockquote>
                                <figcaption>{maskName(r.author_name)}<i>{r.created_at.slice(0, 10)}</i></figcaption>
                            </figure>
                        ))}
                    </div>
                )}
            </section>

            <section className="sect center film">
                <div className="rise">
                    <span className="pill"><Plus size={13} /> {t.filmPill}</span>
                    <h2>{t.filmH}<br /><span className="hl">{t.filmHl}</span></h2>
                </div>
                <a className="film-card rise" href={EXTERNAL.youtube} target="_blank" rel="noopener noreferrer" data-image-slot="landing.video">
                    <img src="/renewal/video_yano.jpg" alt={t.filmAlt} width={1280} height={720} loading="lazy" />
                    <span className="play"><Play /></span>
                    <span className="film-cap"><b>{t.filmB}</b><i>{t.filmI}</i></span>
                </a>
            </section>

            <section className="sect faq" id="faq">
                <div className="faq-wrap">
                    <div className="faq-left rise">
                        <span className="pill"><Plus size={13} /> FAQ</span>
                        <h2>{t.faqH} <span className="hl">{t.faqHl}</span></h2>
                        <p>{t.faqP[0]}<br />{t.faqP[1]}</p>
                        <Link href={L.faq} className="dark-pill">{t.faqAll} <Arrow /></Link>
                    </div>
                    <ul className="faq-list">
                        {FAQ_TOP[lang].map((q) => (
                            <li key={q.id}><Link href={`${L.faq}#${q.id}`}><span>{q.q}</span><Chevron /></Link></li>
                        ))}
                    </ul>
                    <Link href={L.faq} className="dark-pill faq-all">{t.faqAll} <Arrow /></Link>
                </div>
            </section>

            <SiteFooter lang={lang} />
        </>
    );
}
