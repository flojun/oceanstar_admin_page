import { expect, type Locator, type Page } from "@playwright/test";
import en from "../../src/locales/en";
import ko from "../../src/locales/ko";
import { getTourNameByLang } from "../../src/lib/tourUtils";
import { env } from "./env";

/**
 * 고객 사이트 조작 모음 (page object).
 *
 * 선택자는 전부 로케일 문구(src/locales)로 잡는다. 리뉴얼 PRD 가 "문구 100% 보존"을 요구하므로
 * 디자인·마크업이 바뀌어도 대부분 그대로 동작한다. 리뉴얼에서 구조가 바뀌는 곳은 ★ 표시 —
 * 리뉴얼 후 이 파일의 ★ 함수만 고치면 흐름 테스트(계약 검증)는 그대로 재사용된다.
 */
export type Lang = "ko" | "en";
export const L = { ko, en } as const;
export const home = (lang: Lang) => (lang === "ko" ? "/kr" : "/");
export const prefix = (lang: Lang) => (lang === "ko" ? "/kr" : "");

export interface Tour {
    tour_id: string;
    name: string;
    is_active: boolean;
    is_flat_rate?: boolean;
    max_capacity: number;
    display_order?: number;
}

/** 페이지 이동 후 React 가 붙을 때까지 기다린다 (붙기 전에 누른 클릭은 무시되므로) */
export async function gotoReady(page: Page, path: string) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await waitHydrated(page);
}
export async function waitHydrated(page: Page) {
    await page.waitForFunction(() => {
        const b = document.querySelector("button, a[href]");
        return !!b && Object.keys(b).some((k) => k.startsWith("__reactProps$"));
    });
}

/** 예약 흐름에 쓸 "평범한" 투어 하나 (정원제·활성·콤보/프라이빗 아님) */
export async function pickPlainTour(page: Page): Promise<Tour> {
    const res = await page.request.get("/api/settings");
    expect(res.ok(), "/api/settings").toBeTruthy();
    const { tourSettings } = (await res.json()) as { tourSettings: Tour[] };
    const tour = tourSettings
        .filter((t) => t.is_active && !t.is_flat_rate && !/combo|private/i.test(t.tour_id))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))[0];
    expect(tour, "판매 중인 일반 투어가 없음").toBeTruthy();
    return tour;
}

/** ★ 예약 화면 열기. 리뉴얼 전: 홈 히어로 버튼 → 모달 / 리뉴얼 후: /booking 페이지 */
export async function openBooking(page: Page, lang: Lang): Promise<Locator> {
    if (env.expectRenewal) {
        await gotoReady(page, `${prefix(lang)}/booking`);
        return page.locator("main");
    }
    await gotoReady(page, home(lang));
    await page.getByRole("button", { name: L[lang].hero.mainBtn, exact: true }).click();
    // 모달 패널: 제목과 폼을 함께 품은 가장 안쪽 div (결제 버튼은 폼 밖 하단 바에 있음)
    const root = page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: L[lang].bookingModal.title, exact: true }) })
        .filter({ has: page.locator("form") })
        .last();
    await expect(root.getByText(L[lang].bookingModal.step1)).toBeVisible();
    return root;
}

/** ★ 1단계: 투어 카드 선택 */
export async function chooseTour(root: Locator, tour: Tour, lang: Lang) {
    const name = getTourNameByLang(tour.tour_id, tour.name, lang);
    await root.getByRole("heading", { name, exact: true }).first().click();
}

/** 2단계: 인원 */
export async function setPax(root: Locator, adults: number, children = 0) {
    await root.locator('input[name="adultCount"]').fill(String(adults));
    const child = root.locator('input[name="childCount"]');
    if (await child.isVisible().catch(() => false)) await child.fill(String(children));
}

/** 3단계: 예약 가능한 첫 날짜 (없으면 다음 달로, 최대 4개월) */
export async function pickFirstAvailableDate(page: Page, root: Locator): Promise<void> {
    for (let i = 0; i < 4; i++) {
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        const day = root.locator(".rdp-day_button:not([disabled])").first();
        if (await day.count()) {
            await day.click();
            return;
        }
        await root.getByRole("button", { name: "Go to the Next Month" }).first().click();
    }
    throw new Error("4개월 안에 예약 가능한 날짜가 없음 (정원/차단일 설정 확인)");
}

/** 4단계: 픽업 장소(목록 첫 항목) + 예약자 정보 */
export async function fillBooker(root: Locator, who = { name: "QA 테스트", email: "qa-test@example.com", phone: "010-0000-0000" }) {
    const pickup = root.locator("select").first();
    await expect(pickup).toBeVisible();
    await pickup.selectOption({ index: 1 });
    await root.locator('input[name="bookerName"]').fill(who.name);
    await root.locator('input[name="bookerEmail"]').fill(who.email);
    await root.locator('input[name="bookerPhone"]').fill(who.phone);
}

/** ★ 결제하기 → 통화 선택 모달 → 통화 선택 */
export async function checkout(page: Page, root: Locator, lang: Lang, currency: "KRW" | "USD") {
    await root.getByRole("button", { name: L[lang].bookingModal.checkout_btn, exact: true }).click();
    await page.getByRole("button", { name: new RegExp(currency) }).click();
}

/**
 * Stripe 결제 요청을 가로채 본문을 돌려주고, 가짜 결제창 URL 로 응답한다.
 * 실제 Stripe 세션은 만들어지지 않는다.
 */
export async function interceptCheckout(page: Page) {
    const origin = new URL(env.baseURL).origin;
    const captured: { body?: Record<string, unknown> } = {};
    await page.route("**/__qa__/**", (r) => r.fulfill({ contentType: "text/html", body: "<h1>QA Stripe stub</h1>" }));
    await page.route("**/api/stripe/checkout", async (r) => {
        captured.body = r.request().postDataJSON();
        await r.fulfill({ json: { success: true, order_id: "QATEST", url: `${origin}/__qa__/stripe-checkout` } });
    });
    return captured;
}
