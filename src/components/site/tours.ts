import { basePrice, type Currency } from "@/lib/pricing";
import type { TourSetting } from "@/lib/tourUtils";

/**
 * 고객 화면의 상품 목록. 글·사진·비교표는 여기(코드)에, 가격·운영 여부는
 * tour_settings(관리자 화면)에 있다. DB 에 행이 없거나 판매중지면 화면에서 빠진다.
 *
 * 거북이 스노클링은 DB 에서 1부(morning1)·2부(morning2) 두 행이지만 손님에게는
 * 한 상품이고, 예약 창에서 시간을 고른다.
 */
export type Lang = "ko" | "en";
export type TourKey = "turtle" | "sunset" | "combo" | "private" | "surf";
export type TourFilter = "all" | "turtle" | "combo" | "private";

export type TourDef = {
    key: TourKey;
    /** 예약 가능한 tour_settings.tour_id. 여러 개면 예약 창에서 시간으로 고른다 */
    tourIds: string[];
    filter: Exclude<TourFilter, "all">;
    img: string;
    name: Record<Lang, string>;
    /** 메뉴에 쓰는 짧은 이름 */
    short: Record<Lang, string>;
    alt: Record<Lang, string>;
    /** 비교표 기능 행 (FEATURES 순서) */
    features: boolean[];
};

export const TOURS: TourDef[] = [
    {
        key: "turtle",
        tourIds: ["morning1", "morning2"],
        filter: "turtle",
        img: "/renewal/turtle.jpg",
        name: { ko: "와이키키 거북이 스노클링", en: "Waikiki Turtle Snorkeling" },
        short: { ko: "거북이 스노클링", en: "Turtle snorkeling" },
        alt: { ko: "와이키키 거북이 스노클링", en: "Waikiki Turtle Snorkeling" },
        features: [true, true, true, true, false, false, false, false],
    },
    {
        key: "sunset",
        tourIds: ["sunset"],
        filter: "turtle",
        img: "/renewal/sunset.jpg",
        name: { ko: "선셋·와인 & 와이키키 거북이 스노클링", en: "Sunset & Wine Turtle Snorkeling" },
        short: { ko: "선셋 거북이 스노클링", en: "Sunset turtle snorkeling" },
        alt: { ko: "선셋·와인 & 와이키키 거북이 스노클링", en: "Sunset & Wine Turtle Snorkeling" },
        features: [true, true, true, true, true, false, false, false],
    },
    {
        key: "combo",
        tourIds: ["combo_marine"],
        filter: "combo",
        img: "/renewal/parasail.jpg",
        name: { ko: "거북이 스노클링 + 패러세일링 / 제트스키", en: "Turtle Snorkeling + Parasailing / Jet Ski" },
        short: { ko: "스노클링 + 패러 · 제트", en: "Snorkeling + parasail · jet ski" },
        alt: { ko: "거북이 스노클링 + 패러세일링 / 제트스키", en: "Turtle Snorkeling + Parasailing / Jet Ski" },
        features: [true, false, true, true, false, true, false, false],
    },
    {
        key: "private",
        tourIds: ["private"],
        filter: "private",
        img: "/renewal/boat_private.webp",
        name: { ko: "[단독] 프라이빗 와이키키 거북이 스노클링", en: "[Private] Waikiki Turtle Snorkeling" },
        short: { ko: "프라이빗 크루즈", en: "Private cruise" },
        alt: { ko: "[단독] 프라이빗 와이키키 거북이 스노클링", en: "[Private] Waikiki Turtle Snorkeling" },
        features: [true, true, true, true, false, false, false, true],
    },
    {
        key: "surf",
        tourIds: ["surf", "combo_surf"],
        filter: "combo",
        img: "/renewal/surf.jpg",
        name: { ko: "거북이 스노클링 + 서핑", en: "Turtle Snorkeling + Surf Lesson" },
        short: { ko: "서핑 레슨", en: "Surf lesson" },
        alt: { ko: "거북이 스노클링 + 서핑", en: "Turtle Snorkeling + Surf Lesson" },
        features: [true, true, true, true, false, false, true, false],
    },
];

export const FEATURES: Record<Lang, string[]> = {
    ko: [
        "거북이 관찰 100% 보장",
        "해양 전문 한국인 크루",
        "수영 못해도 참여 가능",
        "해양 액티비티 4종",
        "선셋 크루즈 · 와인과 치즈보드",
        "패러세일링 / 제트스키",
        "서핑 강습",
        "보트 단독 대관 · 옵션 커스터마이징",
    ],
    en: [
        "100% turtle sighting guarantee",
        "English-speaking ocean crew",
        "Non-swimmers welcome",
        "Four water activities",
        "Sunset cruise with wine and cheese",
        "Parasailing / jet ski",
        "Surf lesson",
        "Whole boat to your group",
    ],
};

/** 한 상품에 속한, 판매 중인 DB 행 */
export function activeRows(def: TourDef, settings: TourSetting[]): TourSetting[] {
    return def.tourIds
        .map((id) => settings.find((s) => s.tour_id === id))
        .filter((s): s is TourSetting => !!s && s.is_active !== false);
}

/** DB 에 판매 중인 행이 있는 상품만 */
export function availableTours(settings: TourSetting[]): TourDef[] {
    return TOURS.filter((t) => activeRows(t, settings).length > 0);
}

export const tourByKey = (key: string) => TOURS.find((t) => t.key === key);
export const tourKeyOf = (tourId: string) => TOURS.find((t) => t.tourIds.includes(tourId))?.key;

export const currencyOf = (lang: Lang): Currency => (lang === "en" ? "USD" : "KRW");

export function fmtMoney(amount: number, currency: Currency): string {
    return currency === "USD"
        ? `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
        : `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}

/** "HH:MM(:SS)" 에 분을 더해 "HH:MM" */
export function shiftTime(t: string | undefined | null, minutes: number): string {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function ampm(t: string | undefined | null): string {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** 거북이 1부·2부의 픽업 포함 시간: 출항 30분 전 ~ 귀항 30분 후 */
export function sessionRange(row: TourSetting): string {
    return `${shiftTime(row.start_time, -30)}-${shiftTime(row.end_time, 30)}`;
}

export function sessionLabel(row: TourSetting, lang: Lang): string {
    const n = row.tour_id === "morning2" ? 2 : 1;
    return lang === "en" ? `Session ${n}` : `${n}부`;
}

/** 카드·표에 쓰는 시간 한 줄 */
export function timeLines(def: TourDef, settings: TourSetting[], lang: Lang): string[] {
    const rows = activeRows(def, settings);
    switch (def.key) {
        case "turtle":
            // 한국어는 1부·2부를 한 줄에, 영어는 줄마다 (캔버스 SianB / SianB_EN)
            return lang === "en"
                ? [...rows.map((r) => `${sessionLabel(r, lang)} ${sessionRange(r)}`), "Pickup included"]
                : [rows.map((r) => `${sessionLabel(r, lang)} ${sessionRange(r)}`).join(" · "), "픽업 포함 시간"];
        case "sunset":
            return [lang === "en" ? "Time varies by season" : "시즌별 시간 변동"];
        case "combo":
            return [lang === "en" ? "Parasail / jet ski 09:30-14:00" : "패러/제트 9:30-2:00"];
        case "private":
            return [lang === "en" ? "Options and schedule customizable" : "옵션·일정 커스터마이징"];
        default:
            return rows[0]?.start_time ? [`${shiftTime(rows[0].start_time, 0)}-${shiftTime(rows[0].end_time, 0)}`] : [];
    }
}

/**
 * "성인 1인" 표시가. 결제 금액과 같은 함수(basePrice)로 계산해 어긋나지 않게 한다.
 * 프라이빗은 1-10명 팀 요금이 시작가다.
 */
export function fromPrice(def: TourDef, settings: TourSetting[], currency: Currency): { amount: number; from: boolean } | null {
    const row = activeRows(def, settings)[0];
    if (!row) return null;
    const amount = basePrice(row, currency, { adultCount: 1, childCount: 0 }, "1");
    return { amount, from: def.key === "private" };
}

export function priceCaption(def: TourDef, lang: Lang): string {
    if (def.key === "private") return lang === "en" ? "Per team, 1-10 guests (varies by group size)" : "팀 요금 · 1-10명 (인원별 상이)";
    return lang === "en" ? "Per adult. Under 24 months free." : "성인가 기준 (24개월 미만 무료)";
}

export function priceText(def: TourDef, settings: TourSetting[], currency: Currency, lang: Lang): string {
    const p = fromPrice(def, settings, currency);
    if (!p) return "";
    const money = fmtMoney(p.amount, currency);
    if (!p.from) return money;
    return lang === "en" ? `From ${money}` : `${money} ~`;
}
