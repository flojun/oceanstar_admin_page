import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGoogleSummary, getTourData } from "@/lib/siteData";
import { GOOGLE_SUMMARY } from "../siteConfig";
import SiteShell from "../SiteShell";
import { links } from "../links";
import { TOURS, availableTours, tourByKey, type Lang, type TourKey } from "../tours";
import DetailPage from "./DetailPage";
import { DETAIL } from "./content";

/** /kr/tours/[tour] 과 /tours/[tour] 가 같이 쓴다. */
export const detailParams = () => TOURS.map((t) => ({ tour: t.key }));

export function detailMetadata(lang: Lang, tour: string): Metadata {
    const def = tourByKey(tour);
    const C = DETAIL[`${tour}_${lang}`];
    if (!def || !C) return {};
    const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const title = lang === "en" ? `${def.name.en} | Ocean Star Hawaii` : `${def.name.ko} | 오션스타 하와이`;
    const description = `${strip(C.HERO.eyebrow)} · ${strip(C.HERO.h1)}. ${strip(C.HERO.pure)}`;
    const ko = links("ko").tour(def.key);
    const en = links("en").tour(def.key);
    const img = `/renewal/${(C.HERO_IMG ?? ["hero_turtle.webp"])[0]}`;
    return {
        title,
        description,
        alternates: { canonical: lang === "en" ? en : ko, languages: { "ko-KR": ko, "en-US": en, "x-default": en } },
        openGraph: { title, description, type: "website", url: lang === "en" ? en : ko, locale: lang === "en" ? "en_US" : "ko_KR", images: [img] },
    };
}

export async function DetailRoute({ lang, tour }: { lang: Lang; tour: string }) {
    const [{ tourSettings, blockedDates }, google] = await Promise.all([getTourData(), getGoogleSummary(GOOGLE_SUMMARY)]);
    // 판매 중인 상품만 연다 (DB 에 행이 없는 서핑 등은 404)
    if (!availableTours(tourSettings).some((t) => t.key === tour)) notFound();
    return (
        <SiteShell lang={lang} tourSettings={tourSettings} blockedDates={blockedDates}>
            <DetailPage lang={lang} tour={tour as TourKey} tourSettings={tourSettings} google={google} />
        </SiteShell>
    );
}
