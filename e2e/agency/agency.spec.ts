import { expect, test } from "@playwright/test";
import { waitHydrated } from "../support/customer";
import { env } from "../support/env";
import { installGuard } from "../support/guard";
import { saveSweep, sweepPage } from "../support/sweep";

/** 여행사 포털. 예약 등록·수정·취소(서버 액션)는 guard 가 막는다. */

test("에이전시 로그인 화면", async ({ page }) => {
    const guard = await installGuard(page);
    await page.goto("/agency-login");
    await waitHydrated(page);
    await expect(page.getByPlaceholder("아이디를 입력하세요")).toBeVisible();
    await expect(page.getByPlaceholder("비밀번호를 입력하세요")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인 하기" })).toBeEnabled();
    expect(guard.pageErrors()).toEqual([]);
});

test.describe("로그인 후", () => {
    test.skip(!env.agency.id, "QA_AGENCY_ID / QA_AGENCY_PASSWORD 필요 (어드민 '여행사 관리'에서 테스트용 여행사를 만들어 쓰기)");

    test.beforeEach(async ({ page }) => {
        await page.goto("/agency-login");
        await waitHydrated(page);
        await page.getByPlaceholder("아이디를 입력하세요").fill(env.agency.id);
        await page.getByPlaceholder("비밀번호를 입력하세요").fill(env.agency.password);
        await page.getByRole("button", { name: "로그인 하기" }).click();
        await expect(page).toHaveURL(/\/agency-dashboard/);
    });

    test("대시보드: 주간 가용 현황·예약 목록·새 예약 폼", async ({ page }) => {
        const guard = await installGuard(page);
        const list = page.waitForResponse((r) => r.url().includes("/api/agency/reservations"));
        await page.reload();
        expect((await list).status()).toBe(200);
        await expect(page.getByText("주간 예약 가용 현황 (7일)")).toBeVisible();
        await page.getByRole("button", { name: "새 예약 등록" }).click();
        await expect(page.getByPlaceholder("대표자 이름 (예: 홍길동)")).toBeVisible();
        expect(guard.pageErrors()).toEqual([]);
    });

    test("버튼 전수 클릭 (쓰기 차단)", async ({ page }, info) => {
        test.setTimeout(20 * 60_000);
        const guard = await installGuard(page, { allowMutations: false });
        const probes = await sweepPage(page, {
            route: "/agency-dashboard",
            guard,
            limit: env.sweepLimit,
            depth: env.sweepDepth,
            only: env.sweepOnly,
            allowMutations: false,
            onProgress: (r) => saveSweep(info.project.name, "/agency-dashboard", r),
        });
        expect.soft(probes.filter((p) => p.verdict === "error").map((p) => p.path.join(" › "))).toEqual([]);
    });
});
