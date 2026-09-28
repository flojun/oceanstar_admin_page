import fs from "node:fs";
import path from "node:path";

/**
 * 검사할 라우트 목록. `npm run qa:audit` 가 만든 인벤토리(qa/reports/ui-inventory.json)에서 읽으므로
 * 리뉴얼로 페이지가 늘면(예: /kr/faq, /kr/blog) 자동으로 검사 대상에 들어간다.
 * 인벤토리가 없으면 리뉴얼 전 기준 목록을 쓴다.
 */
type Surface = "customer" | "admin" | "agency" | "checkin";

const FALLBACK: Record<Surface, string[]> = {
    customer: ["/", "/kr", "/manage-booking", "/kr/manage-booking", "/restaurants", "/kr/restaurants", "/booking/success", "/kr/booking/success", "/booking/payment-cancel", "/kr/booking/payment-cancel"],
    checkin: ["/checkin"],
    agency: ["/agency-login", "/agency-dashboard"],
    admin: [
        "/login",
        "/dashboard/alerts",
        "/dashboard/all",
        "/dashboard/home",
        "/dashboard/list",
        "/dashboard/today",
        "/dashboard/reconfirm",
        "/dashboard/refunds",
        "/dashboard/bulk-add",
        "/dashboard/vehicle",
        "/dashboard/monthly",
        "/dashboard/overview",
        "/dashboard/stats",
        "/dashboard/settlement",
        "/dashboard/invoice",
        "/dashboard/crew",
        "/dashboard/crew/attendance",
        "/dashboard/agencies",
        "/dashboard/website-settings/dates",
        "/dashboard/website-settings/pickup",
        "/dashboard/website-settings/images",
    ],
};

/** 쿼리 없이 열면 영원히 로딩하거나 의미 없는 페이지 — 스모크에서는 제외하고 흐름 테스트에서 다룬다 */
const NEEDS_QUERY = new Set(["/booking/payment-success", "/kr/booking/payment-success"]);

/**
 * 동적 세그먼트 값. 상품 상세는 판매 중인 네 상품을 기본으로 모두 연다 (서핑은 DB 행이 없어 404).
 * 더 넣으려면 QA_ROUTE_SAMPLES='{"/blog/[slug]":"hawaii-restaurants"}' (값은 문자열 또는 배열)
 */
const TOUR_KEYS = ["turtle", "sunset", "combo", "private"];
const samples: Record<string, string | string[]> = (() => {
    const base = { "/tours/[tour]": TOUR_KEYS, "/kr/tours/[tour]": TOUR_KEYS };
    try {
        return { ...base, ...JSON.parse(process.env.QA_ROUTE_SAMPLES ?? "{}") };
    } catch {
        return base;
    }
})();

export function routesFor(surface: Surface): string[] {
    const inv = ["qa/reports/ui-inventory.json", "qa/baseline/ui-inventory.json"].map((p) => path.join(process.cwd(), p)).find((p) => fs.existsSync(p));
    if (!inv) return FALLBACK[surface];
    const data = JSON.parse(fs.readFileSync(inv, "utf8")) as { routes: { pages: { route: string; surface: string }[] } };
    const out: string[] = [];
    for (const p of data.routes.pages) {
        if (p.surface !== surface || NEEDS_QUERY.has(p.route)) continue;
        if (p.route === "/dashboard/website-settings") continue; // 서버 redirect 전용
        if (/\[.+\]/.test(p.route)) {
            const s = samples[p.route];
            for (const v of Array.isArray(s) ? s : s ? [s] : []) out.push(p.route.replace(/\[[^\]]+\]/, v));
            continue;
        }
        out.push(p.route);
    }
    return out.length ? out : FALLBACK[surface];
}
