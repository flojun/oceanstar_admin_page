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
