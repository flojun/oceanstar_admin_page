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

/**
 * 검색 결과에 뜨는 제목·설명. 사람들이 치는 말("하와이 거북이 스노클링", "private boat charter")을 앞에 두고,
 * 설명은 상세 페이지에 이미 적힌 사실만 쓴다. 가격·리뷰 수처럼 바뀌는 값은 넣지 않는다.
 */
const SEO: Record<string, [title: string, description: string]> = {
    turtle_ko: ["하와이 거북이 스노클링 · 와이키키 터틀캐니언 | 오션스타 하와이", "와이키키 터틀캐니언에서 하와이 바다거북과 스노클링. 거북이 100% 보장, 한국인 크루, 수영 못해도 참여 가능. 카약·패들보드·보트 다이빙, 라면 간식, 와이키키 호텔 픽업 포함 4시간."],
    turtle_en: ["Waikiki Turtle Snorkeling Tour at Turtle Canyon | Ocean Star Hawaii", "Swim with Hawaiian green sea turtles at Turtle Canyon. Turtle sighting guaranteed, non-swimmers welcome, kayak, paddleboard and boat diving, snacks and Waikiki hotel pickup. 4 hours."],
    sunset_ko: ["하와이 선셋 크루즈 & 거북이 스노클링 · 와인 | 오션스타 하와이", "해 질 녘 와이키키 바다에서 거북이 스노클링과 와인 파티. 거북이 100% 보장, 한국인 크루, 카약·패들보드·보트 다이빙, 다이아몬드헤드 배경 인생샷, 호텔 픽업 포함 4시간."],
    sunset_en: ["Waikiki Sunset Cruise & Turtle Snorkeling with Wine | Ocean Star Hawaii", "Turtle snorkeling at golden hour off Waikiki, then a wine party on deck. Turtle sighting guaranteed, kayak, paddleboard and boat diving, Diamond Head photos, hotel pickup. 4 hours."],
    combo_ko: ["하와이 거북이 스노클링 + 패러세일링 · 제트스키 | 오션스타 하와이", "와이키키 거북이 스노클링과 패러세일링 또는 제트스키를 한 번에 예약하세요. 거북이 100% 보장, 수영 못해도 참여 가능. 두 액티비티는 날짜를 각각 고릅니다."],
    combo_en: ["Turtle Snorkeling + Parasailing or Jet Ski, Waikiki | Ocean Star Hawaii", "Book Waikiki turtle snorkeling together with parasailing or a jet ski ride. Turtle sighting guaranteed, non-swimmers welcome. Each activity runs on its own day."],
    private_ko: ["하와이 프라이빗 보트 대관 · 거북이 스노클링 | 오션스타 하와이", "와이키키 보트를 우리 팀만 단독으로. 터틀캐니언 거북이 스노클링, 자유 액티비티, 다이아몬드헤드 해안 크루즈. 1-10명 팀 요금, 한국인 크루, 호텔 픽업 포함."],
    private_en: ["Private Boat Charter Waikiki · Turtle Snorkeling | Ocean Star Hawaii", "The whole boat to your group off Waikiki: Turtle Canyon snorkeling, free activities and a Diamond Head coastal cruise. Team rate for 1-10 guests, hotel pickup included."],
    surf_ko: ["하와이 서핑 레슨 + 거북이 스노클링 · 알라모아나 | 오션스타 하와이", "알라모아나 서핑 레슨과 와이키키 거북이 스노클링을 한 번에 예약하세요. 거북이 100% 보장, 한국인 크루, 수영 못해도 참여 가능."],
    surf_en: ["Hawaii Surf Lesson + Turtle Snorkeling, Ala Moana | Ocean Star Hawaii", "Book an Ala Moana surf lesson and Waikiki turtle snorkeling together. Turtle sighting guaranteed, non-swimmers welcome."],
};

export function detailMetadata(lang: Lang, tour: string): Metadata {
    const def = tourByKey(tour);
    const C = DETAIL[`${tour}_${lang}`];
    const seo = SEO[`${tour}_${lang}`];
    if (!def || !C || !seo) return {};
    const [title, description] = seo;
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
