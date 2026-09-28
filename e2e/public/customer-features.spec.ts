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
    // 리뉴얼 후 언어 전환은 버튼이 아니라 같은 페이지 다른 언어 주소로 가는 링크다
    const toggle = (re: RegExp) => (env.expectRenewal ? page.getByRole("link", { name: re }) : page.getByRole("button", { name: re })).first();
    await toggle(/EN$/).click();
    await expect(page).toHaveURL(/\/$/);
    await waitHydrated(page);
    expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("en");
    await toggle(env.expectRenewal ? /^(한국어|KO)$/ : /KR$/).click();
    await expect(page).toHaveURL(/\/kr\/?$/);
    expect((await context.cookies()).find((c) => c.name === "NEXT_LOCALE")?.value).toBe("ko");
});

for (const lang of ["ko", "en"] as Lang[]) {
    test(`헤더 '내 예약 관리' 링크 (${lang})`, async ({ page }, info) => {
        await installGuard(page);
        await gotoReady(page, home(lang));
        // 리뉴얼 모바일: 머리에는 없고 메뉴 서랍 안에 있다 (캔버스 MenuKo_M, 운영자 요청)
        if (env.expectRenewal && info.project.name.includes("mobile")) {
            await page.getByRole("button", { name: lang === "en" ? "Open menu" : "메뉴 열기" }).click();
        }
        await page.getByRole("link", { name: new RegExp(`^${L[lang].header.manageBooking}`) }).filter({ visible: true }).first().click();
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
        // 리뉴얼 후에는 알림창 대신 화면 안에 안내가 뜬다
        if (env.expectRenewal) await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toBeVisible(); // 빈 알림은 Next 의 route announcer
        else await expect.poll(() => guard.events.some((e) => e.type === "dialog")).toBeTruthy();
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
    if (env.expectRenewal) {
        // 리뉴얼(캔버스 ManageCancel): 한 창에서 규정 확인 · 동의 → 취소 요청하기
        await expect(page.getByText("예약 변경 · 취소")).toBeVisible();
        await page.getByRole("button", { name: "예약 취소", exact: true }).click();
        await page.getByRole("checkbox").check();
    } else {
        await expect(page.getByText(L.ko.manage.details_title)).toBeVisible();
        // 취소 흐름: 규정 동의 → 취소하기 → 최종 확정. 쓰기 허용이 아니면 요청은 차단되고 "시도"만 기록된다.
        await page.getByRole("button", { name: L.ko.manage.cancel_btn }).click();
        await page.getByRole("checkbox").check();
        await page.getByRole("button", { name: "취소하기", exact: true }).click();
    }
    const m = guard.mark();
    await page.getByRole("button", { name: env.expectRenewal ? "취소 요청하기" : "최종 취소 확정" }).click();
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
    // 리뉴얼 후 후기 작성은 고객후기 페이지(/kr/reviews)의 창
    await gotoReady(page, env.expectRenewal ? "/kr/reviews" : "/kr");
    await page.getByRole("button", { name: env.expectRenewal ? "후기 작성하기" : "리뷰 작성하기" }).click();
    await page.getByPlaceholder(L.ko.reviewModal.order_id_placeholder).fill("ZZZZZZ");
    await page.getByPlaceholder(L.ko.reviewModal.name_placeholder).fill("QA");
    await page.getByPlaceholder(L.ko.reviewModal.content_placeholder).fill("회귀 테스트용 후기입니다");
    await page.getByRole("button", { name: L.ko.reviewModal.submitBtn }).click();
    await expect(page.getByText("QA 모의 오류")).toBeVisible();
    expect(sent, "multipart 본문").toContain("ZZZZZZ");
});

for (const lang of ["ko", "en"] as Lang[]) {
    test(`맛집 페이지: QR 보기 → QR 이미지 → 다운로드 (${lang})`, async ({ page }, info) => {
        test.skip(!env.expectRenewal && info.project.name.includes("mobile"), "옛 화면: 모바일에서는 버튼 텍스트가 숨겨져 이름이 없음 (알려진 접근성 문제)");
        const guard = await installGuard(page);
        await gotoReady(page, `${prefix(lang)}/restaurants`);
        if (env.expectRenewal) {
            // 리뉴얼(캔버스 Food): QR 이 마무리 칸에 바로 보이고, 아래 버튼으로 PNG 를 내려받는다
            await expect(page.getByRole("img", { name: lang === "en" ? "QR code for this page" : "맛집 추천 페이지 QR 코드" })).toBeVisible();
        } else {
            await page.getByRole("button", { name: "QR 보기" }).click();
            await expect(page.getByAltText("QR Code")).toBeVisible();
        }
        const m = guard.mark();
        await page.getByRole("button", { name: env.expectRenewal && lang === "en" ? "Download QR code" : "QR 코드 다운로드" }).click();
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
    // 확정 캔버스 푸터에서 유튜브 채널 아이콘은 빠졌고, 메인 '투어 영상' 이 유튜브 영상으로 간다
    expect(has(env.expectRenewal ? /youtube\.com\// : /youtube\.com\/@oceanstarhi/), "유튜브 링크").toBeTruthy();
    expect(has(/google\.com\/maps|maps\.google\.com/), "구글 지도 링크").toBeTruthy();
});
