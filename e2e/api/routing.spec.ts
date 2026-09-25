import { expect, test } from "@playwright/test";
import { env } from "../support/env";

/**
 * 라우팅 계약: 미들웨어 보호 규칙, 공개 페이지, SEO 파일, 리뉴얼 리다이렉트.
 * 리뉴얼에서 middleware.ts → proxy.ts 이름 변경(Next 16)이나 레이아웃 변경을 해도 이 규칙은 그대로여야 한다.
 */
const noFollow = { maxRedirects: 0 };
const location = (h: Record<string, string>) => new URL(h["location"] ?? "", env.baseURL).pathname;

test("로그인 없이 /dashboard/* → /login", async ({ request }) => {
    for (const p of ["/dashboard/all", "/dashboard/alerts", "/dashboard/vehicle", "/dashboard/website-settings/dates"]) {
        const res = await request.get(p, noFollow);
        expect([307, 308], p).toContain(res.status());
        expect(location(res.headers()), p).toBe("/login");
    }
    const root = await request.get("/dashboard", noFollow);
    expect(location(root.headers())).toBe("/dashboard/alerts");
});

test("에이전시: 쿠키 없이 /agency-dashboard → /agency-login", async ({ request }) => {
    const res = await request.get("/agency-dashboard", noFollow);
    expect([307, 308]).toContain(res.status());
    expect(location(res.headers())).toBe("/agency-login");
    expect((await request.get("/agency-login", noFollow)).status()).toBe(200);
});

test("공개 페이지는 리다이렉트 없이 200", async ({ request }) => {
    for (const p of ["/", "/kr", "/manage-booking", "/kr/manage-booking", "/checkin", "/login"]) expect((await request.get(p, noFollow)).status(), p).toBe(200);
});

test("robots.txt · sitemap.xml", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /dashboard/");
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const p of ["/kr", "/manage-booking", "/kr/manage-booking"]) expect(sitemap, p).toContain(`${p}</loc>`);
    // 사이트맵의 모든 주소가 실제로 열리는지 (운영 도메인 기준 URL 이므로 경로만 떼어 현재 대상에 요청)
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    for (const p of locs) expect((await request.get(p)).status(), `sitemap ${p}`).toBeLessThan(400);
});

test.describe("리뉴얼 리다이렉트 (QA_EXPECT_RENEWAL=1 일 때)", () => {
    test.skip(!env.expectRenewal, "리뉴얼 배포 검증 때만");
    // PRD §8.1: 현장 QR 이 /restaurants 를 가리키므로 404 가 나면 안 된다. Next 의 permanent 리다이렉트는 308.
    for (const [from, to] of [
        ["/restaurants", "/blog/hawaii-restaurants"],
        ["/kr/restaurants", "/kr/blog/hawaii-restaurants"],
    ]) {
        test(`${from} → ${to}`, async ({ request }) => {
            const res = await request.get(from, noFollow);
            expect([301, 308]).toContain(res.status());
            expect(location(res.headers())).toBe(to);
            expect((await request.get(to)).status()).toBe(200);
        });
    }
    test("신규 페이지가 열린다", async ({ request }) => {
        for (const p of ["/kr/reviews", "/reviews", "/kr/faq", "/faq", "/kr/blog", "/blog", "/kr/booking", "/booking"]) expect((await request.get(p)).status(), p).toBe(200);
    });
});
