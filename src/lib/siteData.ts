import { supabaseServer } from "@/lib/supabaseServer";
import type { TourSetting } from "@/lib/tourUtils";

/**
 * 고객 사이트(리뉴얼) 화면이 서버에서 읽는 데이터.
 *
 * 가격·후기를 첫 HTML 에 싣기 위해(SSR) 페이지가 직접 부른다. 브라우저가
 * 나중에 /api/* 를 부르는 방식이면 검색엔진과 느린 휴대폰에서 가격이 비어 보인다.
 *
 * PREVIEW_DATA_ORIGIN 이 있으면 DB 대신 그 사이트의 공개 읽기 API 를 부른다.
 * 운영 DB 키 없이 미리보기 서버를 띄울 때만 쓴다. 운영 배포에는 설정하지 않는다.
 */
const PREVIEW_ORIGIN = process.env.PREVIEW_DATA_ORIGIN;

export const SITE_REVALIDATE_SECONDS = 300;

async function previewGet<T>(path: string): Promise<T> {
    const res = await fetch(`${PREVIEW_ORIGIN}${path}`, { next: { revalidate: SITE_REVALIDATE_SECONDS } });
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return res.json() as Promise<T>;
}

export type BlockedDate = { date: string; tour_id: string; reason: string | null };

export async function getTourData(): Promise<{ tourSettings: TourSetting[]; blockedDates: BlockedDate[] }> {
    try {
        if (PREVIEW_ORIGIN) {
            const data = await previewGet<{ tourSettings: TourSetting[]; blockedDates: BlockedDate[] }>("/api/settings");
            return { tourSettings: data.tourSettings ?? [], blockedDates: data.blockedDates ?? [] };
        }
        const todayStr = new Date().toISOString().split("T")[0];
        const [tours, blocked] = await Promise.all([
            supabaseServer.from("tour_settings").select("*"),
            supabaseServer.from("blocked_dates").select("*").gte("date", todayStr),
        ]);
        if (tours.error) throw tours.error;
        return { tourSettings: (tours.data ?? []) as TourSetting[], blockedDates: (blocked.data ?? []) as BlockedDate[] };
    } catch (e) {
        console.error("[siteData] tour settings", e);
        return { tourSettings: [], blockedDates: [] };
    }
}

export type GoogleReview = {
    id: string;
    author_name: string;
    rating: number;
    content: string;
    review_photos: string[] | null;
    created_at: string;
};

export async function getGoogleReviews(): Promise<GoogleReview[]> {
    try {
        if (PREVIEW_ORIGIN) return (await previewGet<{ reviews: GoogleReview[] }>("/api/google-reviews")).reviews ?? [];
        const { data, error } = await supabaseServer
            .from("google_reviews")
            .select("*")
            .eq("is_visible", true)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as GoogleReview[];
    } catch (e) {
        console.error("[siteData] google reviews", e);
        return [];
    }
}

export type SiteReview = {
    id: string;
    order_id: string;
    rating: number;
    content: string;
    content_en?: string | null;
    author_name: string;
    author_name_en?: string | null;
    image_urls: string[] | null;
    created_at: string;
};

export async function getSiteReviews(): Promise<SiteReview[]> {
    try {
        if (PREVIEW_ORIGIN) return (await previewGet<{ reviews: SiteReview[] }>("/api/reviews")).reviews ?? [];
        const { data, error } = await supabaseServer
            .from("reviews")
            .select("*")
            .eq("is_hidden", false)
            .order("created_at", { ascending: false });
        if (error) {
            if (error.code === "42P01") return [];
            throw error;
        }
        return (data ?? []) as SiteReview[];
    } catch (e) {
        console.error("[siteData] site reviews", e);
        return [];
    }
}

/**
 * 구글 지도 평점 · 리뷰 수. Google Places API (New) Place Details 에서 하루 한 번 읽는다.
 *
 * 필요한 서버 환경값:
 *   GOOGLE_PLACES_API_KEY  Places API (New) 가 켜진 서버용 키 (없으면 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 를 쓴다)
 *   GOOGLE_PLACE_ID        오션스타의 place ID (ChIJ… ). 없으면 이름으로 한 번 찾는다.
 * 실패하면 siteConfig 의 고정값(확인한 날짜 포함)을 쓴다. 화면이 비지 않게.
 */
export type GoogleSummary = { rating: number; count: number; asOf: string; live: boolean };

const PLACES = "https://places.googleapis.com/v1";
const DAY = 86400;

async function findPlaceId(key: string): Promise<string | null> {
    const res = await fetch(`${PLACES}/places:searchText`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.formattedAddress" },
        body: JSON.stringify({ textQuery: "Ocean Star turtle snorkeling, 1125 Kewalo Basin Harbor, Honolulu, HI 96814" }),
        next: { revalidate: DAY },
    });
    if (!res.ok) throw new Error(`searchText ${res.status}`);
    const data = (await res.json()) as { places?: { id: string; formattedAddress?: string }[] };
    // 주소가 케왈로 베이슨인 것만 믿는다 (엉뚱한 가게를 집지 않게)
    return data.places?.find((p) => /Kewalo|96814/i.test(p.formattedAddress ?? ""))?.id ?? null;
}

/** Places API (New) */
async function ratingNew(key: string) {
    const id = process.env.GOOGLE_PLACE_ID || (await findPlaceId(key));
    if (!id) throw new Error("place id not found");
    const res = await fetch(`${PLACES}/places/${encodeURIComponent(id)}`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount" },
        next: { revalidate: DAY },
    });
    if (!res.ok) throw new Error(`place details ${res.status}`);
    const data = (await res.json()) as { rating?: number; userRatingCount?: number };
    return { rating: data.rating, count: data.userRatingCount };
}

/** 예전 Places API. 구글 클라우드에 예전 것만 켜져 있어도 동작하게 둔다. */
async function ratingLegacy(key: string) {
    const base = "https://maps.googleapis.com/maps/api/place";
    let id = process.env.GOOGLE_PLACE_ID;
    if (!id) {
        const q = encodeURIComponent("Ocean Star turtle snorkeling, 1125 Kewalo Basin Harbor, Honolulu, HI 96814");
        const f = await (await fetch(`${base}/findplacefromtext/json?input=${q}&inputtype=textquery&fields=place_id,formatted_address&key=${key}`, { next: { revalidate: DAY } })).json();
        id = (f.candidates as { place_id: string; formatted_address?: string }[] | undefined)?.find((c) => /Kewalo|96814/i.test(c.formatted_address ?? ""))?.place_id;
        if (!id) throw new Error(`legacy find ${f.status}`);
    }
    const d = await (await fetch(`${base}/details/json?place_id=${encodeURIComponent(id)}&fields=rating,user_ratings_total&key=${key}`, { next: { revalidate: DAY } })).json();
    if (d.status !== "OK") throw new Error(`legacy details ${d.status}`);
    return { rating: d.result?.rating as number | undefined, count: d.result?.user_ratings_total as number | undefined };
}

export async function getGoogleSummary(fallback: { rating: number; count: number; asOf: string }): Promise<GoogleSummary> {
    const key = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return { ...fallback, live: false };
    for (const get of [ratingNew, ratingLegacy]) {
        try {
            const r = await get(key);
            if (!r.rating || !r.count) throw new Error("no rating in response");
            const asOf = new Date().toLocaleDateString("en-CA", { timeZone: "Pacific/Honolulu" });
            return { rating: r.rating, count: r.count, asOf, live: true };
        } catch (e) {
            console.error(`[siteData] google places (${get.name})`, e);
        }
    }
    return { ...fallback, live: false };
}
