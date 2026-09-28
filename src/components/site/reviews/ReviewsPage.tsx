/**
 * 고객후기 (캔버스 ReviewsKo/En · ReviewWriteKo/En). docs/design-canvas/v3/build_reviews.py 를 옮겼다.
 * 순서: 홈페이지 후기(DB reviews) → 구글 리뷰(DB google_reviews).
 * 캔버스의 GetYourGuide 칸은 불러올 데이터가 없어(캔버스에도 "배포 때 연동" 자리만 있음) 싣지 않았다.
 */
import { maskName } from "@/lib/utils";
import type { TourSetting } from "@/lib/tourUtils";
import type { GoogleReview, SiteReview } from "@/lib/siteData";
import { BookButton } from "../BookingContext";
import { Arrow } from "../Icons";
import { EXTERNAL } from "../links";
import SiteFooter from "../SiteFooter";
import SiteHeader from "../SiteHeader";
import { GOOGLE_SUMMARY } from "../siteConfig";
import { availableTours, type Lang } from "../tours";
import { Carousel, SiteReviews, Stars, WriteReview } from "./ReviewsClient";
import "../detail/detail.css";
import "./reviews.css";

const T = {
    ko: {
        heroAlt: "다이아몬드헤드를 배경으로 뱃머리에 앉은 두 사람",
        h1: <>생생한 <span className="hl">리얼 후기</span></>, sub: "당일 취소, 노쇼 없이 검증된 고객님들의 찐 후기입니다.",
        plat: ["구글", "GetYourGuide", "마이리얼트립"], loved: "업계 통합 누적 리뷰 15,000+",
        tabs: "후기 모아보기", tabSite: "홈페이지 후기", tabGoogle: "구글 리뷰", wSite: "후기", wGoogle: "리뷰",
        siteH: "홈페이지 후기", siteLede: ["오션스타에서 예약하고 다녀오신 분만 남길 수 있어요.", "예약번호로 한 번 더 확인한 후기입니다."],
        googleH: "구글 리뷰", googleLine: (n: string) => <>구글 맵 기준 <b className="n">{n}</b>개의 실제 고객 리뷰</>, googleGo: "구글에서 전체 리뷰 보기",
        star: (n: number) => `별점 ${n}점`, endH: "지금 바다로 나가 볼까요", endSub: "일요일을 제외하고 매일 출항합니다.<br>원하시는 날짜를 골라 주세요.", book: "예약하기",
    },
    en: {
        heroAlt: "Two people sitting on the bow with Diamond Head behind",
        h1: <>Real <span className="hl">reviews</span></>, sub: "Verified guests only. No same-day cancellations or no-shows.",
        plat: ["Google", "GetYourGuide", "MyRealTrip"], loved: "15,000+ reviews across platforms",
        tabs: "Review sources", tabSite: "Our site", tabGoogle: "Google", wSite: "review", wGoogle: "review",
        siteH: "Reviews on our site", siteLede: ["Only guests who booked with OceanStar can post here.", "Every review is checked against a booking number."],
        googleH: "Google reviews", googleLine: (n: string) => <><b className="n">{n}</b> real customer reviews on Google Maps</>, googleGo: "View all reviews on Google",
        star: (n: number) => `Rated ${n} out of 5`, endH: "Ready to head out to sea?", endSub: "We sail every day except Sunday.<br>Pick the date that works for you.", book: "Book Now",
    },
};

export default function ReviewsPage({ lang, tourSettings, siteReviews, googleReviews }: { lang: Lang; tourSettings: TourSetting[]; siteReviews: SiteReview[]; googleReviews: GoogleReview[] }) {
    const t = T[lang];
    const tours = availableTours(tourSettings);
    const count = GOOGLE_SUMMARY.count.toLocaleString("en-US");
    return (
        <div className="dp reviews">
            <section className="hero rv-hero">
                <picture>
                    <source media="(max-width: 767px)" srcSet="/renewal/hero_reviews_m.webp" />
                    <img src="/renewal/act_photo.webp" alt={t.heroAlt} className="hero-img" data-image-slot="reviews.hero" fetchPriority="high" />
                </picture>
                <span className="veil" />
                <SiteHeader lang={lang} active="reviews" tours={tours.map((d) => ({ key: d.key, name: d.short[lang] }))} />
                <div className="hero-in">
                    <h1>{t.h1}</h1>
                    <p className="rv-sub">{t.sub}</p>
                    <div className="loved">
                        <span className="dots">
                            <i><img src="/renewal/plat_google.png" alt={t.plat[0]} /></i>
                            <i><img src="/renewal/plat_gyg.png" alt={t.plat[1]} /></i>
                            <i><img src="/renewal/plat_mrt.png" alt={t.plat[2]} /></i>
                        </span>
                        <b>{t.loved}</b>
                    </div>
                </div>
            </section>
            <nav className="tabs" aria-label={t.tabs}>
                <a href="#site" className="on">{t.tabSite} <span className="n">{siteReviews.length}</span></a>
                <a href="#google">{t.tabGoogle} <span className="n">{count}</span></a>
            </nav>

            <section className="sect" id="site">
                <div className="rv-h">
                    <div className="sh"><h2>{t.siteH}</h2><p className="lede">{t.siteLede[0]}<br />{t.siteLede[1]}</p></div>
                    <WriteReview lang={lang} />
                </div>
                <SiteReviews reviews={siteReviews} lang={lang} what={t.wSite} />
            </section>

            <section className="sect" id="google">
                <div className="src-h">
                    <img src="/renewal/plat_google.png" alt="Google" className="src-logo" />
                    <div className="src-t">
                        <h2>{t.googleH}</h2>
                        <p><b className="n">{GOOGLE_SUMMARY.rating.toFixed(1)}</b><Stars label={t.star(5)} /><span>{t.googleLine(count)}</span></p>
                    </div>
                    <a href={EXTERNAL.googleReviews} className="src-go" target="_blank" rel="noopener noreferrer">{t.googleGo} <Arrow /></a>
                </div>
                <Carousel cls="grow" what={t.wGoogle} lang={lang}>
                    {googleReviews.map((r) => (
                        <article className="gc" key={r.id}>
                            <div className="gc-h">
                                <span className="av">{r.author_name.charAt(0)}</span>
                                <div><b>{maskName(r.author_name)}</b><Stars n={r.rating} label={t.star(r.rating)} /></div>
                                <img src="/renewal/plat_google.png" alt="" className="gc-g" />
                            </div>
                            <p>{r.content}</p>
                        </article>
                    ))}
                </Carousel>
            </section>

            <div style={{ height: 112 }} className="d-only" />
            <div style={{ height: 64 }} className="m-only" />
            <SiteFooter lang={lang} end={{ h2: t.endH, sub: t.endSub, button: <BookButton className="book-pill light">{t.book} <Arrow /></BookButton> }} />
        </div>
    );
}
