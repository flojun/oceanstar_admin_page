import { SITE_URL } from "@/lib/site";
import { getTourData } from "@/lib/siteData";
import { FAQ, REFUND_ROWS } from "@/components/site/faqData";
import { links } from "@/components/site/links";
import { GOOGLE_SUMMARY } from "@/components/site/siteConfig";
import { availableTours, FEATURES, priceText, type Lang } from "@/components/site/tours";

/**
 * AI 검색(ChatGPT·퍼플렉시티·구글 AI 개요)이 한 번에 읽어 가는 요약 (llmstxt.org 형식).
 * 가격은 화면과 같은 계산, 답은 FAQ 문안 그대로라 여기서 따로 고칠 것은 없다.
 */
export const revalidate = 300;

const abs = (p: string) => `${SITE_URL}${p === "/" ? "" : p}`;

function section(lang: Lang, settings: Awaited<ReturnType<typeof getTourData>>["tourSettings"]) {
    const L = links(lang);
    const ko = lang === "ko";
    const tours = availableTours(settings).map((d) => {
        const feats = FEATURES[lang].filter((_, i) => d.features[i]).join(", ");
        return `- [${d.name[lang]}](${abs(L.tour(d.key))}): ${priceText(d, settings, ko ? "KRW" : "USD", lang)}. ${feats}`;
    });
    const faq = FAQ[lang].flatMap((g) => g.items.map((it) =>
        `Q. ${it.q}\nA. ${it.a ?? REFUND_ROWS[lang].map((r) => `${r.when}: ${r.what}`).join(" / ")}`));
    return [
        ko ? "## 투어 (한국어)" : "## Tours (English)",
        ...tours,
        "",
        ko ? "## 자주 묻는 질문" : "## FAQ",
        ...faq,
        "",
        `- [${ko ? "후기" : "Reviews"}](${abs(L.reviews)})`,
        `- [FAQ](${abs(L.faq)})`,
    ].join("\n");
}

export async function GET() {
    const { tourSettings } = await getTourData();
    const body = [
        "# Ocean Star Hawaii (오션스타 하와이)",
        "",
        "> Waikiki turtle snorkeling boat tours in Honolulu, Oahu, with hotel pickup in Waikiki. Korean and English speaking crew.",
        "> 하와이 와이키키 거북이 스노클링 투어. 와이키키 호텔 픽업, 한국인 크루.",
        "",
        "- Departs: 1125 Kewalo Basin Harbor, Gate D #110, Honolulu, HI 96814",
        "- Phone: +1-808-308-1792 · Email: hioceanstar@gmail.com",
        `- Google rating: ${GOOGLE_SUMMARY.rating.toFixed(1)} (${GOOGLE_SUMMARY.count.toLocaleString("en-US")} reviews, ${GOOGLE_SUMMARY.asOf})`,
        "- Sails every day except Sunday. Ages 24 months and up. Non-swimmers welcome.",
        `- Book online: ${abs("/")} (English) · ${abs("/kr")} (한국어)`,
        "",
        section("ko", tourSettings),
        "",
        section("en", tourSettings),
        "",
    ].join("\n");
    return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
