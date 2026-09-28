import { SITE_URL } from "@/lib/site";
import type { TourSetting } from "@/lib/tourUtils";
import { FAQ, REFUND_ROWS } from "./faqData";
import { links } from "./links";
import type { GoogleSummary } from "@/lib/siteData";
import { availableTours, fromPrice, type Lang, type TourDef } from "./tours";

/**
 * 검색엔진용 구조화 데이터. 가격은 결제와 같은 계산(tours.ts → pricing.ts)의 USD 값.
 * 예전 메인의 TouristAttraction(원화 150000 고정)은 쓰지 않는다.
 */
const abs = (p: string) => `${SITE_URL}${p}`;

const rating = (g: GoogleSummary) => ({ "@type": "AggregateRating", ratingValue: g.rating, reviewCount: g.count, bestRating: 5 });

const business = (lang: Lang, g: GoogleSummary) => ({
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#business`,
    name: lang === "en" ? "Ocean Star Hawaii" : "오션스타 하와이",
    url: abs(links(lang).home),
    telephone: "+1-808-308-1792",
    email: "hioceanstar@gmail.com",
    image: abs("/renewal/hero_waikiki.jpg"),
    address: { "@type": "PostalAddress", streetAddress: "1125 Kewalo Basin Harbor, Gate D #110", addressLocality: "Honolulu", addressRegion: "HI", postalCode: "96814", addressCountry: "US" },
    aggregateRating: rating(g),
});

function product(def: TourDef, settings: TourSetting[], lang: Lang, g: GoogleSummary) {
    const p = fromPrice(def, settings, "USD");
    const url = abs(links(lang).tour(def.key));
    return {
        "@type": "Product",
        name: def.name[lang],
        image: abs(def.img),
        url,
        brand: { "@type": "Brand", name: "Ocean Star Hawaii" },
        aggregateRating: rating(g),
        ...(p && { offers: { "@type": "Offer", price: p.amount, priceCurrency: "USD", availability: "https://schema.org/InStock", url } }),
    };
}

export function homeJsonLd(lang: Lang, settings: TourSetting[], g: GoogleSummary) {
    return { "@context": "https://schema.org", "@graph": [business(lang, g), ...availableTours(settings).map((d) => product(d, settings, lang, g))] };
}

export function detailJsonLd(lang: Lang, settings: TourSetting[], key: string, description: string, g: GoogleSummary) {
    const def = availableTours(settings).find((d) => d.key === key);
    if (!def) return null;
    return { "@context": "https://schema.org", ...product(def, settings, lang, g), description };
}

export function faqJsonLd(lang: Lang) {
    const refund = REFUND_ROWS[lang].map((r) => `${r.when}: ${r.what}`).join(" / ");
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ[lang].flatMap((g) => g.items.map((it) => ({
            "@type": "Question",
            name: it.q,
            acceptedAnswer: { "@type": "Answer", text: it.a ?? refund },
        }))),
    };
}

/** <script type="application/ld+json"> 로 넣는다. '<' 는 태그가 닫히지 않게 이스케이프. */
export const ldJson = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
