/**
 * 상품 상세 (캔버스 Detail · DetailSunset · DetailCombo · DetailPrivate · DetailSurf, 한/영).
 * docs/design-canvas/v3/build_detail.py 의 조각 함수를 그대로 옮겼다. 문안은 ./content.ts.
 * 데스크탑·모바일 마크업이 다른 곳(특장점·시간표·인증샷)은 두 벌을 그리고 d-only / m-only 로 가린다.
 */
import Link from "next/link";
import type { TourSetting } from "@/lib/tourUtils";
import { BookButton } from "../BookingContext";
import { Arrow, Instagram } from "../Icons";
import { EXTERNAL, links } from "../links";
import SiteFooter from "../SiteFooter";
import SiteHeader from "../SiteHeader";
import { availableTours, currencyOf, priceText, type Lang, type TourKey } from "../tours";
import { DETAIL } from "./content";
import "./detail.css";

/* eslint-disable @typescript-eslint/no-explicit-any */
const H = ({ html, as: Tag = "span", className }: { html: string; as?: any; className?: string }) => (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const svg = (paths: React.ReactNode, size = 18, sw = 1.7) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths}</svg>
);
const I_ARROW = <Arrow />;
const I_CLOCK = svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.3V12l3.2 1.9" /></>);
const I_STAR = svg(<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor" stroke="none" />, 15);
const I_CHEV = svg(<path d="M6 9.5l6 6 6-6" />, 20, 2);
const I_SWIPE = svg(<path d="M4 12h15M14 7l5 5-5 5" />, 16, 2);
const I_VAN = <><path d="M2.6 16.4V8.6a1 1 0 0 1 1-1h9.9v8.8H2.6z" /><path d="M13.5 11h3.6l3.3 3.4v2h-6.9z" /><circle cx="7" cy="16.6" r="2" /><circle cx="16.8" cy="16.6" r="2" /></>;
const PERK_ICONS: Record<string, React.ReactNode> = {
    van: svg(I_VAN, 24),
    gear: svg(<><circle cx="7.8" cy="12" r="3.7" /><circle cx="16.2" cy="12" r="3.7" /><path d="M11.5 12h1M4.1 12H2.2M19.9 12h1.9" /></>, 24),
    bowl: svg(<><path d="M3.4 10.6h17.2a8.6 8.6 0 0 1-17.2 0z" /><path d="M8 7.6c0-1.2 1-1.6 1-2.7M12 7.3c0-1.4 1-1.8 1-3M16 7.6c0-1.2 1-1.6 1-2.7" /></>, 24),
    turtle: svg(<><path d="M4.6 13.4a6.6 5 0 0 1 13.2 0z" /><path d="M3.4 13.4h15.6" /><circle cx="19.6" cy="11.2" r="1.7" /><path d="M6.4 13.6l-1.6 3.2M15.8 13.6l1.6 3.2M9.2 8.9l1.9 4.5M13.3 8.9l-1.9 4.5" /></>, 24),
    wine: svg(<><path d="M7.6 3.6h8.8l-.5 5.6a3.9 3.9 0 0 1-7.8 0z" /><path d="M8 7.6h8" /><path d="M12 13.1v6.9M8.6 20.4h6.8" /></>, 24),
    sup: svg(<><path d="M3 18.6c4.4 1.5 13.6 1.5 18 0" /><circle cx="11" cy="4.8" r="1.7" /><path d="M11 7.2v5.4l-2.6 4.4M11 12.6l2.6 4.4M8.6 9.6h4.8" /><path d="M17.4 3.4l-2.6 14.2" /></>, 24),
    guide: svg(<><circle cx="9" cy="7.4" r="3.2" /><path d="M3 20.2a6 6 0 0 1 12 0" /><path d="M17.6 3.6v9.4M17.6 3.6h3.6l-1.2 2.1 1.2 2.1h-3.6" /></>, 24),
    para: svg(<><path d="M3 10a9 6 0 0 1 18 0" /><path d="M3 10c2-1.2 4-1.2 6 0 2-1.2 4-1.2 6 0 2-1.2 4-1.2 6 0" /><path d="M3 10l8.2 7.6M21 10l-8.2 7.6M9 10l2.4 7.4M15 10l-2.4 7.4" /><circle cx="12" cy="19.4" r="1.5" /></>, 24),
    jet: svg(<><path d="M2.8 15.4h14.4l3.8-3.2h-6.2l-2-2.6H9.4l-1.6 2.6H4.4z" /><path d="M12.6 9.6l1.3-3.1" /><path d="M2.4 19c2.2 1 4.4 1 6.6 0s4.4-1 6.6 0 4.4 1 6.6 0" /></>, 24),
    cal: svg(<><rect x="3.6" y="5.2" width="16.8" height="15" rx="2" /><path d="M3.6 10h16.8M8 3.4v3.6M16 3.4v3.6M8 14h2M14 14h2M8 17h2" /></>, 24),
    check: svg(<><circle cx="12" cy="12" r="8.6" /><path d="M8.2 12.3l2.6 2.6 5-5.2" /></>, 24),
    float: svg(<><ellipse cx="12" cy="13" rx="8.6" ry="4.6" /><ellipse cx="12" cy="13" rx="3.6" ry="1.8" /><path d="M2.8 19c2.2 1 4.4 1 6.6 0s4.4-1 6.6 0 4.4 1 6.2 0" /></>, 24),
    sun: svg(<><circle cx="12" cy="12" r="4.2" /><path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" /></>, 24),
    camera: svg(<><path d="M3.6 8.6h3l1.5-2.1h5.8l1.5 2.1h3a1 1 0 0 1 1 1v7.8a1 1 0 0 1-1 1h-14.8a1 1 0 0 1-1-1V9.6a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.2" r="3.4" /></>, 24),
};
const ANCHOR_IC: Record<string, React.ReactNode> = {
    van: svg(<><path d="M2.6 16.4V8.6a1 1 0 0 1 1-1h9.9v8.8H2.6z" /><path d="M13.5 11h3.6l3.3 3.4v2h-6.9z" /><circle cx="7" cy="16.6" r="1.9" /><circle cx="16.8" cy="16.6" r="1.9" /></>, 24, 2.2),
    hotel: svg(<><path d="M5 20V5.6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20" /><path d="M15 11.2h3.4a1 1 0 0 1 1 1V20" /><path d="M3 20h18" /></>, 24, 2.2),
};

// 코스 소개 사진 (build_detail.py CS_MEDIA / CS_ALT_EN)
const CS_MEDIA: Record<string, [string, string, string][]> = {
    van: [["course_van.webp", "측면에 오션스타 로고를 붙인 흰색 포드 15인승 밴", "White Ford 15-seat van with the OceanStar logo on its side"]],
    bowl: [["course_snack.webp", "와이키키 바다를 배경으로 든 컵라면과 팝타르트", "Cup noodles and Pop-Tarts held up against the Waikiki sea"]],
    boat: [["act_roof.webp", "와이키키 앞바다에 정박한 오션스타 보트와 나무 루프탑", "OceanStar boat with its wooden rooftop moored off Waikiki"]],
    turtle: [["turtle.jpg", "모래바닥 산호 위에 모여 있는 푸른바다거북 무리", "Group of green sea turtles resting on the sandy reef"]],
    sup2: [["act_sup.webp", "다이아몬드헤드를 배경으로 패들보드 위에 올라선 손님", "Guest standing on a paddleboard with Diamond Head behind"],
        ["act_kayak.webp", "씨카약을 탄 두 사람 앞으로 지나가는 푸른바다거북", "Green sea turtle swimming past two people in a sea kayak"]],
    dive: [["act_dive.webp", "보트 위에서 바다로 뛰어드는 손님", "Guest jumping from the boat into the sea"]],
    wine: [["course_wine.webp", "체크 식탁보 위에 차린 살라미·치즈 보드와 과일, 케이크, 와인", "Salami and cheese board with fruit, cake and wine on a gingham tablecloth"]],
    sup3: [["course_sup_sunset.webp", "노을 진 바다 위 패들보드에 올라 두 팔을 든 손님", "Guest on a paddleboard raising both arms on the sunset sea"],
        ["act_kayak.webp", "씨카약을 탄 두 사람 앞으로 지나가는 푸른바다거북", "Green sea turtle swimming past two people in a sea kayak"]],
    pv_free: [["pv_sup.webp", "다이아몬드헤드를 배경으로 패들보드 위에 선 손님", "Guest standing on a paddleboard with Diamond Head behind"],
        ["pv_dive.webp", "보트 난간에서 바다로 백플립 하는 손님", "Guest backflipping off the boat rail into the sea"]],
    pv_cruise: [["pv_couple.webp", "다이아몬드헤드를 배경으로 선상에 나란히 앉은 커플", "Couple sitting side by side on deck with Diamond Head behind"]],
    photo: [["act_photo.webp", "다이아몬드헤드를 배경으로 뱃머리에 앉은 두 사람", "Two people sitting on the bow with Diamond Head behind"]],
};

const UI = {
    ko: { book: "예약하기", rest: "휴무", moreStars: "인증샷 더 보기", swipe: "옆으로 넘겨 보세요", go: "바로가기", dock: "성인 1인 · 4시간", heroAlt: "와이키키 앞바다 산호 위의 푸른바다거북" },
    en: { book: "Book Now", rest: "Closed", moreStars: "See more photos", swipe: "Swipe for more", go: "View", dock: "Per adult · 4 hours", heroAlt: "Green sea turtle over the reef off Waikiki" },
};

const R = (f: string) => `/renewal/${f}`;
/** '다른 상품' 카드의 사진 → 상품 */
const MORE_KEY: Record<string, TourKey> = {
    "turtle.jpg": "turtle", "sunset.jpg": "sunset", "course_sup_sunset.webp": "sunset",
    "private_boat.webp": "private", "boat_private.webp": "private", "parasail.jpg": "combo", "surf.jpg": "surf",
};
/** 콤보 패키지 카드 → 예약 창에서 고를 상품 (서핑 콤보 카드는 서핑) */

export default function DetailPage({ lang, tour, tourSettings }: { lang: Lang; tour: TourKey; tourSettings: TourSetting[] }) {
    const C = DETAIL[`${tour}_${lang}`];
    const u = UI[lang];
    const L = links(lang);
    const tours = availableTours(tourSettings);
    const def = tours.find((t) => t.key === tour);
    // 가격은 DB 값. 프라이빗은 캔버스대로 달러 팀 요금(1-10명)을 보인다.
    const price = tour === "private" || !def ? C.HERO.price : priceText(def, tourSettings, currencyOf(lang), lang);
    const per = C.HERO.price_per ? <small className="per">{C.HERO.price_per}</small> : null;

    const sh = (h2: string, lede?: string | null, cls = "") => (
        <header className={`sh${cls ? ` ${cls}` : ""} rise`}>
            <H as="h2" html={h2} />
            {lede && <H as="p" className="lede" html={lede} />}
        </header>
    );
    const book = (cls: string, label = u.book) => <BookButton tour={tour} className={cls}>{label} {I_ARROW}</BookButton>;

    const [heroSrc, heroAlt] = C.HERO_IMG ?? ["hero_turtle.webp", u.heroAlt];
    const heroM = C.HERO_IMG_M?.[0];

    const hero = (
        <>
            <section className={`hero${C.THEME ? ` ${C.THEME}` : ""}`}>
                <picture>
                    {heroM && <source media="(max-width: 767px)" srcSet={R(heroM)} />}
                    <img src={R(heroSrc)} alt={heroAlt} className="hero-img" data-image-slot="detail.hero" fetchPriority="high" />
                </picture>
                <span className="veil" />
                <SiteHeader lang={lang} active="tours" tours={tours.map((d) => ({ key: d.key, name: d.short[lang] }))} />
                <div className="hero-in">
                    <H className="eyebrow" html={C.HERO.eyebrow} />
                    <H as="h1" html={C.HERO.h1} />
                    <span className="rev">{I_STAR} {C.HERO.badge}</span>
                </div>
            </section>
            <section className="buy">
                <dl className="facts">
                    {C.HERO.facts.map(([k, v]: [string, string]) => <div key={k}><dt>{k}</dt><H as="dd" html={v} /></div>)}
                </dl>
                <div className="buy-r">
                    <b className="amt n">{per}{price}</b>
                    <span className="amt-s">{C.HERO.price_sub}</span>
                    {book("book-pill")}
                </div>
                <p className="pure">{I_CLOCK}<H html={C.HERO.pure} /></p>
            </section>
        </>
    );

    const perks = () => {
        const grid = (
            <div className={`inc${C.PERKS.length === 6 ? " n6" : ""} rise`}>
                {C.PERKS.map(([k, t, b]: [string, string, string]) => (
                    <div className="inc-c" key={t}>
                        <div className="inc-h"><span className="ic">{PERK_ICONS[k]}</span><H as="h3" html={t} /></div>
                        {b && <H as="p" html={b} />}
                    </div>
                ))}
            </div>
        );
        if (!C.PERK_PHOTO) return <section className="sect" key="perks">{sh(C.PERKS_H2)}{grid}</section>;
        return (
            <section className="sect" key="perks">
                <div className="intro">
                    {sh(C.PERKS_H2, C.PERKS_LEDE)}
                    <figure className="intro-ph rise" data-image-slot="detail.intro"><img src={R(C.PERK_PHOTO[0])} alt={C.PERK_PHOTO[1]} loading="lazy" /></figure>
                </div>
                <H as="h3" className="hl-h rise" html={C.PERKS_SUB_H} />
                {grid}
                {C.PERK_NOTES?.length > 0 && <ul className="pnotes rise">{C.PERK_NOTES.map((x: string) => <H as="li" key={x} html={x} />)}</ul>}
            </section>
        );
    };

    const SPAN: Record<string, string> = { "01": "w3", "02": "w3", "03": "w6", "04": "w4", "05": "w2", "06": "w6" };
    const features = () => (
        <section className="sect" key="features">
            {sh(C.FEAT_H2, C.FEAT_LEDE)}
            <div className="feats d-only">
                {C.FEATURES.map(([no, t, sub, paras, em]: [string, string, string, string[], string | null]) => (
                    <div className={`ft ${SPAN[no]} rise`} key={no}>
                        <div className="ft-b">
                            <div className="ft-h"><span className="no">{no}</span><H as="h3" html={t} /><H className="sub" html={sub} /></div>
                            <div className="ft-t">{paras.map((x) => <H as="p" key={x} html={x} />)}{em && <H as="p" className="em" html={em} />}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="accs rise m-only">
                {C.FEATURES.map(([no, t, sub, paras, em]: [string, string, string, string[], string | null], i: number) => (
                    <details className="acc" open={i === 0} key={no}>
                        <summary><span className="no">{no}</span><span className="ac-t"><H as="b" html={t} /><H as="i" html={sub} /></span><span className="chev">{I_CHEV}</span></summary>
                        <div className="ac-b">{paras.map((x) => <H as="p" key={x} html={x} />)}{em && <H as="p" className="em" html={em} />}</div>
                    </details>
                ))}
            </div>
        </section>
    );

    const times = () => {
        const notes = <>{C.TIME_NOTES.map((x: string) => <H as="li" key={x} html={x} />)}</>;
        const pure = (cls = "") => <p className={`tnote${cls}`}>{I_CLOCK}<H html={C.TIME_PURE} /></p>;
        return (
            <section className="sect" key="times">
                <div className="time d-only">
                    <div>{sh(C.TIME_H2, C.TIME_SUB)}<ul className="tlist rise">{notes}</ul></div>
                    <div className="rise">
                        <div className="week">
                            <div className="wrow whead">{C.DAYS.map((d: string) => <span key={d}>{d}</span>)}</div>
                            {C.SLOTS.map(([name, lines, span, col]: [string, string[], number, string]) => (
                                <div className="wrow" key={name}>
                                    <div className={`slot ${col}`} style={{ gridColumn: `1 / span ${span}` }}><b>{name}</b>{lines.map((x) => <em key={x}>{x}</em>)}</div>
                                    {span < 7 && <span className="rest" style={{ gridColumn: `${span + 1} / -1` }}>{C.REST_LABEL ?? u.rest}</span>}
                                </div>
                            ))}
                        </div>
                        {pure()}
                    </div>
                </div>
                <div className="m-only">
                    {sh(C.TIME_H2, C.TIME_SUB)}
                    <div className="tdays rise">
                        {C.SLOTS.map(([name, lines, span, col]: [string, string[], number, string]) => (
                            <div className={`trow ${col}`} key={name}>
                                <div className="th"><b>{name}</b><span className="tt">{lines.map((x) => <em key={x}>{x}</em>)}</span></div>
                                <div className="dchips">{C.DAYS.map((d: string, i: number) => <span key={d} className={i < span ? "on" : undefined}>{d}</span>)}</div>
                            </div>
                        ))}
                    </div>
                    {pure(" rise")}
                    <ul className="tlist">{notes}</ul>
                </div>
            </section>
        );
    };

    const flow = () => (
        <section className="sect" key="flow">
            {sh(C.FLOW_H2, C.FLOW_SUB)}
            <div className="hops rise" style={{ ["--n" as string]: C.JOURNEY.length } as React.CSSProperties}>
                {C.JOURNEY.map(([name, anchor]: [string, string | null]) => (
                    <span className={`hop${anchor ? " anchor" : ""}`} key={name}>
                        <span className="hop-d">{anchor ? ANCHOR_IC[anchor] : null}</span><H className="hop-l" html={name} />
                    </span>
                ))}
            </div>
            <H as="p" className="hnote" html={C.FLOW_NOTE} />
        </section>
    );

    const course = () => (
        <section className="sect" key="course">
            {sh(C.COURSE_H2)}
            <p className="cs-hint m-only">{C.COURSE_HINT} {I_SWIPE}</p>
            <div className="cs">
                {C.COURSE.map(([title, dur, body, note, media]: [string, string | null, string, string | null, string], k: number) => {
                    const imgs = CS_MEDIA[media] ?? [];
                    return (
                        <article className="cs-s rise" key={title}>
                            <div className="cs-h"><span className="cs-n n">{String(k + 1).padStart(2, "0")}</span>
                                <div className="cs-ht"><H as="h3" html={title} />{dur && <H className="cs-t" html={dur} />}</div></div>
                            <div className={`cs-m${imgs.length === 2 ? " two" : ""}`} data-image-slot={imgs.length === 2 ? "detail.course_half" : "detail.course"}>
                                {imgs.map(([src, ko, en]) => <img key={src} src={R(src)} alt={lang === "en" ? en : ko} loading="lazy" />)}
                            </div>
                            <div className="cs-b"><H as="p" html={body} />{note && <H as="p" className="cs-note" html={note} />}</div>
                        </article>
                    );
                })}
            </div>
        </section>
    );

    const stars = () => (
        <section className="sect center" key="stars">
            {sh(C.STAR_H2, C.STAR_SUB)}
            <span className="pill" style={{ marginTop: 18 }}>{C.STAR_BADGE}</span>
            <div className="stars rise">
                {C.STARS.map((n: string, i: number) => (
                    <div className="star-c" key={n} data-image-slot="detail.stars">
                        <img src={R(`star${String(i + 1).padStart(2, "0")}.webp`)} alt={n} loading="lazy" /><H as="b" html={n} />
                    </div>
                ))}
                <a className="star-c ig-c m-only" href={EXTERNAL.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram size={26} /><b>{C.STAR_TAG}</b><span>{u.moreStars}</span>
                </a>
            </div>
            <p className="ig d-only"><a href={EXTERNAL.instagram} target="_blank" rel="noopener noreferrer">{C.STAR_TAG}</a></p>
        </section>
    );

    const acts = () => (
        <section className="sect" key="acts">
            {sh(C.ACTS_H2, C.ACTS_LEDE)}
            <div className="acts">
                {C.ACTS.map(([tag, name, kick, paras, spec, img, alt]: [string, string, string, string[], [string, string][], string, string], i: number) => (
                    <article className={`act${i % 2 ? " rev" : ""} rise`} key={name}>
                        <figure className="act-ph" data-image-slot="detail.activity"><img src={R(img)} alt={alt} loading="lazy" /></figure>
                        <div className="act-b">
                            <span className="act-tag">{tag}</span><H as="h3" html={name} />
                            <H as="p" className="act-k" html={kick} />
                            <div className="act-t">{paras.map((x) => <H as="p" key={x} html={x} />)}</div>
                            <dl className="act-spec">{spec.map(([k, v]) => <div key={k}><dt>{k}</dt><H as="dd" html={v} /></div>)}</dl>
                        </div>
                    </article>
                ))}
            </div>
            <p className="tnote rise">{PERK_ICONS.van}<H html={C.ACTS_NOTE} /></p>
        </section>
    );

    const cbPrice = (tag: string) => {
        const v = C.COMBO_PRICES?.[tag];
        // 콤보 A 는 DB 가격(1인)을 보인다. 캔버스는 값이 없어 '콤보 특별 할인가' 였다.
        if (!v) return <p className="cb-p">{C.COMBO_PRICE}</p>;
        const val = tour === "surf" && def ? priceText(def, tourSettings, currencyOf(lang), lang) : v[0];
        return <p className="cb-p has"><b className="n">{v[2] ? <small className="per">{v[2]}</small> : null}{val}</b>{v[1] && <span>{v[1]}</span>}</p>;
    };
    const combo = () => {
        const n = C.COMBOS.length;
        return (
            <section className="sect" key="combo">
                {sh(C.COMBO_H2, C.COMBO_LEDE)}
                {n === 3 && <p className="cs-hint m-only">{u.swipe} {I_SWIPE}</p>}
                <div className={`combo${n === 3 ? " n3" : ""}${n === 1 ? " n1" : ""}`}>
                    {C.COMBOS.map(([tag, t, lines]: [string, string, string[]]) => (
                        <article className="cb rise" key={tag}>
                            <span className="act-tag">{tag}</span><H as="h3" html={t} />
                            {cbPrice(tag)}
                            <ul>{lines.map((x) => <H as="li" key={x} html={x} />)}</ul>
                            {book("book-pill")}
                        </article>
                    ))}
                </div>
            </section>
        );
    };

    const days = () => (
        <section className="sect" key="days">
            {sh(C.TIME_H2, C.TIME_SUB)}
            <div className="dlist rise">
                {C.DAY_SLOTS.map(([d, ts]: [string, string[]]) => (
                    <div className="dl" key={d}>
                        <h3>{d}</h3>
                        <ul>
                            {ts.map((t) => {
                                const m = t.match(/(\d+:\d+)\s*[- ]+\s*(\d+:\d+)\s*(.*)/);
                                const rng = m ? `${m[1]} - ${m[2]}` : t;
                                const tag = m?.[3]?.trim();
                                return <li key={t} className={tag ? "sun" : undefined}><b className="n">{rng}</b>{tag && <i>{tag}</i>}</li>;
                            })}
                        </ul>
                    </div>
                ))}
            </div>
            <p className="tnote rise">{I_CLOCK}<H html={C.TIME_PURE} /></p>
        </section>
    );

    const reco = () => (
        <section className="sect" key="reco">
            {sh(C.RECO_H2)}
            <ul className="reco rise">{C.RECO.map((x: string) => <H as="li" key={x} html={x} />)}</ul>
        </section>
    );

    const sessions = () => (
        <section className="sect" key="sessions">
            {sh(C.SESS_H2, C.SESS_SUB)}
            <div className="sess rise">{C.SESSIONS.map(([k, t]: [string, string]) => <div className="se" key={k}><span>{k}</span><b className="n">{t}</b></div>)}</div>
            <p className="tnote rise">{I_CLOCK}<H html={C.SESS_NOTE} /></p>
        </section>
    );

    const meet = () => (
        <section className="sect" key="meet">
            {sh(C.MEET_H2)}
            <div className="meet rise">
                <figure className="meet-ph" data-image-slot="detail.meet"><img src={R(C.MEET_PHOTO[0])} alt={C.MEET_PHOTO[1]} loading="lazy" /></figure>
                <div className="meet-c">
                    {C.MEET.map(([t, b, lk]: [string, string, string | null]) => (
                        <div className="mt" key={t}>
                            <H as="h3" html={t} /><H as="p" html={b} />
                            {lk && <a className="mt-go" href={C.MAP_URL} target="_blank" rel="noopener noreferrer">{lk} {I_ARROW}</a>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    const rules = () => (
        <section className="sect" key="rules">
            {sh(C.RULES_H2)}
            <div className="rules rise">
                <ul className="rl">{C.RULES.map(([k, t, hot]: [string, string, boolean]) => <li key={t}><span className={`rk${hot ? " no" : ""}`}>{k}</span><H as="p" html={t} /></li>)}</ul>
                <figure className="rules-ph" data-image-slot="detail.rules"><img src={R(C.RULES_PHOTO[0])} alt={C.RULES_PHOTO[1]} loading="lazy" /></figure>
            </div>
        </section>
    );

    const more = () => {
        const cards = C.MORE.map(([img, t, b]: [string, string, string]) => ({ img, t, b, key: MORE_KEY[img] }))
            .filter((c: { key?: TourKey }) => c.key && tours.some((d) => d.key === c.key));
        if (!cards.length) return null;
        return (
            <section className="sect" key="more">
                {sh(C.MORE_H2)}
                <div className="more">
                    {cards.map((c: { img: string; t: string; b: string; key: TourKey }) => (
                        <Link className="mc rise" href={L.tour(c.key)} key={c.t} data-image-slot="detail.more">
                            <img src={R(c.img)} alt={c.t.replace(/&amp;/g, "&")} loading="lazy" />
                            <span className="tx"><H as="h3" html={c.t} /><H as="p" html={c.b} /><span className="go">{u.go} {I_ARROW}</span></span>
                        </Link>
                    ))}
                </div>
            </section>
        );
    };

    const FN: Record<string, () => React.ReactNode> = { perks, features, times, flow, course, stars, more, acts, combo, days, reco, sessions, meet, rules };
    let order: string[] = C.SECTIONS ?? ["perks", "features", "times", "flow", "course", "stars", "more"];
    if (C.SHOW_STARS === false) order = order.filter((x) => x !== "stars");

    return (
        <div className={`dp${C.THEME ? ` ${C.THEME}` : ""}`}>
            {hero}
            {order.map((k) => FN[k]())}
            <SiteFooter lang={lang} end={{ h2: C.END_H2, sub: C.END_SUB, button: book("book-pill light") }} />
            <div className="dock m-only">
                <span className="d-l"><b className="n">{per}{price}</b><span>{C.DOCK_SUB ?? u.dock}</span></span>
                {book("book-pill")}
            </div>
        </div>
    );
}
