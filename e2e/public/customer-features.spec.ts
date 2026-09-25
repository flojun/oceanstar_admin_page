import { expect, test } from "@playwright/test";
import { env } from "../support/env";
import { gotoReady, home, L, prefix, waitHydrated, type Lang } from "../support/customer";
import { installGuard } from "../support/guard";

/**
 * 예약 외 고객 기능: 언어 전환, 내 예약 관리, 리뷰 작성, 맛집 QR, 연락 채널.
 * 쓰기 요청(취소·일정변경·리뷰 등록)은 guard 가 막거나 가짜 응답으로 대체한다.
 */

test("언어 전환: KR ↔ EN 이동 + NEXT_LOCALE 쿠키", async ({ page, context }) => {
    await installGuard(page);
    await gotoReady(page, "/kr");
    await page.getByRole("button", { name: /EN$/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await waitHydrated(page);
    expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("en");
    await page.getByRole("button", { name: /KR$/ }).first().click();
    await expect(page).toHaveURL(/\/kr\/?$/);
    expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("ko");
});

for (const lang of ["ko", "en"] as Lang[]) {
    test(`헤더 '내 예약 관리' 링크 (${lang})`, async ({ page }) => {
        await installGuard(page);
        await gotoReady(page, home(lang));
        await page.getByRole("link", { name: L[lang].header.manageBooking, exact: true }).first().click();
        await expect(page).toHaveURL(new RegExp(`${prefix(lang)}/manage-booking$`));
        await expect(page.getByRole("button", { name: L[lang].manage.submit_btn })).toBeVisible();
    });

    test(`내 예약 관리: 없는 예약번호는 안내 후 멈춘다 (${lang})`, async ({ page }) => {
        const guard = await installGuard(page);
        await gotoReady(page, `${prefix(lang)}/manage-booking`);
        await page.getByPlaceholder(L[lang].manage.res_num_ph).fill("ZZZZZZ");
        await page.getByPlaceholder(L[lang].manage.email_ph).fill("nobody@example.com");
        const res = page.waitForResponse((r) => r.url().includes("/api/verify-booking"));
        await page.getByRole("button", { name: L[lang].manage.submit_btn }).click();
        expect((await res).status()).toBe(404);
        await expect.poll(() => guard.events.some((e) => e.type === "dialog")).toBeTruthy();
        await expect(page.getByText(L[lang].manage.details_title)).toHaveCount(0);
    });
}

test("내 예약 관리: 테스트 예약 조회 → 취소 버튼이 /api/cancel 로 연결", async ({ page }) => {
    test.skip(!env.booking.orderId, "QA_BOOKING_ORDER_ID / QA_BOOKING_EMAIL 이 없으면 건너뜀");
    const guard = await installGuard(page);
    await gotoReady(page, "/kr/manage-booking");
    await page.getByPlaceholder(L.ko.manage.res_num_ph).fill(env.booking.orderId);
    await page.getByPlaceholder(L.ko.manage.email_ph).fill(env.booking.email);
    await page.getByRole("button", { name: L.ko.manage.submit_btn }).click();
    await expect(page.getByText(L.ko.manage.details_title)).toBeVisible();

    // 취소 흐름: 규정 동의 → 취소하기 → 최종 확정. 쓰기 허용이 아니면 요청은 차단되고 "시도"만 기록된다.
    await page.getByRole("button", { name: L.ko.manage.cancel_btn }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "취소하기", exact: true }).click();
    const m = guard.mark();
    await page.getByRole("button", { name: "최종 취소 확정" }).click();
    await expect.poll(() => guard.since(m).some((e) => (e.type === "blocked" || e.type === "request") && "url" in e && e.url.includes("/api/cancel"))).toBeTruthy();
});

test("리뷰 작성: 폼 → POST /api/reviews (가짜 응답) → 오류 문구 표시", async ({ page }) => {
    await installGuard(page);
    let sent: string | null = null;
    await page.route("**/api/reviews", async (r) => {
        if (r.request().method() !== "POST") return r.fallback();
        sent = r.request().postData();
        await r.fulfill({ status: 404, json: { success: false, error: "QA 모의 오류: 존재하지 않는 예약번호" } });
    });
    await gotoReady(page, "/kr");
    await page.getByRole("button", { name: "리뷰 작성하기" }).click();
    await page.getByPlaceholder(L.ko.reviewModal.order_id_placeholder).fill("ZZZZZZ");
    await page.getByPlaceholder(L.ko.reviewModal.name_placeholder).fill("QA");
    await page.getByPlaceholder(L.ko.reviewModal.content_placeholder).fill("회귀 테스트용 후기입니다");
    await page.getByRole("button", { name: L.ko.reviewModal.submitBtn }).click();
    await expect(page.getByText("QA 모의 오류")).toBeVisible();
    expect(sent, "multipart 본문").toContain("ZZZZZZ");
});

for (const lang of ["ko", "en"] as Lang[]) {
    test(`맛집 페이지: QR 보기 → QR 이미지 → 다운로드 (${lang})`, async ({ page }, info) => {
        test.skip(env.expectRenewal, "리뉴얼 후에는 블로그 글에서 검사 (routing.spec 의 리다이렉트 참고)");
        test.skip(info.project.name.includes("mobile"), "모바일에서는 버튼 텍스트가 숨겨져 이름이 없음 (알려진 접근성 문제)");
        const guard = await installGuard(page);
        await gotoReady(page, `${prefix(lang)}/restaurants`);
        await page.getByRole("button", { name: "QR 보기" }).click();
        await expect(page.getByAltText("QR Code")).toBeVisible();
        const m = guard.mark();
        await page.getByRole("button", { name: "QR 코드 다운로드" }).click();
        await expect.poll(() => guard.since(m).some((e) => e.type === "download" || e.type === "popup"), { timeout: 10_000 }).toBeTruthy();
    });
}

test("연락 채널이 고객 사이트에 존재한다 (카카오·인스타·유튜브·구글지도)", async ({ page }) => {
    await installGuard(page);
    await page.goto("/kr");
    const hrefs = await page.locator("a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    const has = (re: RegExp) => hrefs.some((h) => re.test(h));
    expect(has(/pf\.kakao\.com\//), "카카오톡 채널 링크").toBeTruthy();
    expect(has(/instagram\.com\/oceanstar/), "인스타그램 링크").toBeTruthy();
    expect(has(/youtube\.com\/@oceanstarhi/), "유튜브 링크").toBeTruthy();
    expect(has(/google\.com\/maps/), "구글 지도 링크").toBeTruthy();
});
