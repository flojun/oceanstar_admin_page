import { expect, test } from "@playwright/test";
import { installGuard } from "../support/guard";
import { routesFor } from "../support/routes";

/**
 * 고객 페이지 스모크: 모든 고객 라우트가
 *   - 4xx/5xx 없이 열리고
 *   - 처리되지 않은 JS 예외·콘솔 에러·API 5xx 가 없고
 *   - 번역 키가 그대로 노출되지 않고 (t("hero.title1") 이 없으면 "hero.title1" 이 화면에 찍힘)
 *   - 모바일(375px)에서 가로 스크롤이 생기지 않는지 확인한다.
 */
const LOCALE_KEY_LEAK = /\b(meta|header|hero|bento|tour|review|footer|bookingModal|reviewModal|tourDetailsModal|floater|voucherEmail|voucher|manage)\.[a-z][A-Za-z0-9_]+\b/;

for (const route of [...routesFor("customer"), ...routesFor("checkin")]) {
    test(`페이지 열림: ${route}`, async ({ page }, info) => {
        const guard = await installGuard(page);
        const res = await page.goto(route, { waitUntil: "domcontentloaded" });
        expect(res?.status(), `${route} 응답 코드`).toBeLessThan(400);
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

        await expect(page).toHaveTitle(/\S/);
        const body = await page.locator("body").innerText();
        expect(body.trim().length, "본문이 비어 있음").toBeGreaterThan(20);
        expect(body.match(LOCALE_KEY_LEAK)?.[0] ?? null, "번역 키가 그대로 노출됨").toBeNull();

        if (info.project.name.includes("mobile")) {
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
            expect(overflow, "375px 에서 가로 스크롤 발생 (px)").toBeLessThanOrEqual(1);
        }

        expect(guard.pageErrors(), "처리되지 않은 JS 예외").toEqual([]);
        expect(guard.serverErrors(), "5xx 또는 API/_next 404").toEqual([]);
        expect(guard.consoleErrors(), "콘솔 에러").toEqual([]);
    });
}

test("SEO: 홈은 canonical·hreflang 을 유지한다", async ({ page }) => {
    for (const route of ["/", "/kr"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator('link[rel="canonical"]'), `${route} canonical`).toHaveCount(1);
        for (const lang of ["ko-KR", "en-US", "x-default"]) await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`), `${route} hreflang ${lang}`).toHaveCount(1);
    }
});
