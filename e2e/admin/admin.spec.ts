import { expect, test } from "@playwright/test";
import { waitHydrated } from "../support/customer";
import { env } from "../support/env";
import { installGuard } from "../support/guard";
import { routesFor } from "../support/routes";
import { isAllowed, loadAllowlist, saveSweep, sweepPage } from "../support/sweep";

/**
 * 어드민 회귀 검사. 모든 쓰기(Supabase insert/update/delete, 서버 액션, 환불 API)는 guard 가 막는다.
 * → 운영 계정으로 돌려도 데이터가 바뀌지 않는다. (단, 알림 벨을 열면 읽음 처리 요청이 "차단됨"으로 기록됨)
 *
 * 주의: /login 과 /dashboard/* 는 고객 사이트와 같은 루트 레이아웃 src/app/(ko)/layout.tsx 를 쓴다.
 *       리뉴얼에서 이 레이아웃에 헤더/푸터를 넣으면 어드민에도 나타난다 → 아래 "고객 사이트 요소가 새지 않는다" 테스트.
 */
test.skip(!env.admin.email, "QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD 필요");

const ADMIN_ROUTES = routesFor("admin").filter((r) => r !== "/login");

for (const route of ADMIN_ROUTES) {
    test(`어드민 페이지 열림: ${route}`, async ({ page }) => {
        const guard = await installGuard(page);
        const res = await page.goto(route, { waitUntil: "domcontentloaded" });
        expect(res?.status()).toBeLessThan(400);
        await expect(page, "로그인 화면으로 튕김 (세션/미들웨어 확인)").not.toHaveURL(/\/login/);
        await waitHydrated(page);
        await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
        await expect(page.locator("aside nav")).toBeVisible();
        expect(guard.pageErrors(), "JS 예외").toEqual([]);
        expect(guard.serverErrors(), "5xx").toEqual([]);
    });
}

const SIDEBAR: [string | null, string, string][] = [
    [null, "알림", "/dashboard/alerts"],
    [null, "명단보기", "/dashboard/list"],
    [null, "차량용 명단", "/dashboard/vehicle"],
    [null, "캘린더", "/dashboard/monthly"],
    [null, "예약관리", "/dashboard/all"],
    [null, "취소 및 환불", "/dashboard/refunds"],
    ["크루 스케쥴", "스케쥴 관리", "/dashboard/crew"],
    ["크루 스케쥴", "출석 현황", "/dashboard/crew/attendance"],
    ["대시보드", "Overview", "/dashboard/overview"],
    ["대시보드", "정산 검토", "/dashboard/settlement"],
    ["대시보드", "인보이스 발급", "/dashboard/invoice"],
    ["예약홈페이지 관리", "가격 및 날짜 관리", "/dashboard/website-settings/dates"],
    ["예약홈페이지 관리", "픽업시간 관리", "/dashboard/website-settings/pickup"],
    ["예약홈페이지 관리", "사진 및 배너 관리", "/dashboard/website-settings/images"],
    [null, "여행사 관리", "/dashboard/agencies"],
];

test("사이드바: 모든 메뉴가 제 페이지로 간다", async ({ page }) => {
    await installGuard(page);
    for (const [group, label, href] of SIDEBAR) {
        await page.goto("/dashboard/alerts");
        await waitHydrated(page);
        const nav = page.locator("aside nav");
        if (group) {
            const child = nav.getByRole("button", { name: label, exact: true });
            if (!(await child.isVisible())) await nav.getByRole("button", { name: group }).click();
            await child.click();
        } else {
            await nav.getByRole("button", { name: new RegExp(`^${label}`) }).click();
        }
        await expect(page, `${group ? group + " › " : ""}${label}`).toHaveURL(new RegExp(`${href}$`));
    }
});

test("리뉴얼 안전장치: 고객 사이트 헤더/푸터·카카오 위젯이 어드민에 새지 않는다", async ({ page }) => {
    await page.goto("/dashboard/alerts");
    await waitHydrated(page);
    await expect(page.getByRole("link", { name: "카카오톡 1:1 상담하기" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "내 예약 관리" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "투어 예약하기" })).toHaveCount(0);
});

const allow = loadAllowlist();
for (const route of ADMIN_ROUTES) {
    test(`어드민 버튼 전수 클릭 (쓰기 차단): ${route}`, async ({ page }, info) => {
        test.skip(!process.env.QA_ADMIN_SWEEP, "QA_ADMIN_SWEEP=1 일 때만 (시간이 오래 걸림)");
        test.setTimeout(30 * 60_000);
        const guard = await installGuard(page, { allowMutations: false });
        const probes = await sweepPage(page, {
            route,
            guard,
            limit: env.sweepLimit,
            depth: Math.min(env.sweepDepth, 1),
            only: env.sweepOnly,
            allowMutations: false,
            onProgress: (r) => saveSweep(info.project.name, route, r),
            ready: async (p) => {
                await expect(p).not.toHaveURL(/\/login/);
            },
        });
        const broken = probes.filter((p) => p.verdict === "error");
        const dead = probes.filter((p) => p.verdict === "none" && !isAllowed(allow, route, p));
        const fmt = (xs: typeof probes) => xs.map((p) => `  - ${p.path.join(" › ")}  ${[...p.errors, ...p.detail].join(" / ")}`).join("\n");
        expect.soft(broken, `누르면 에러:\n${fmt(broken)}`).toEqual([]);
        expect.soft(dead, `반응 없음:\n${fmt(dead)}`).toEqual([]);
    });
}

/**
 * 어드민 설정 → 고객 사이트 반영. 실제로 값을 바꿨다가 되돌리므로 스테이징/프리뷰 + QA_ALLOW_MUTATIONS=1 에서만.
 */
test("판매중지 토글이 고객 /api/settings 에 반영되고 원복된다", async ({ page, request }) => {
    test.skip(!env.allowMutations || env.isProduction, "스테이징에서 QA_ALLOW_MUTATIONS=1 일 때만");
    await page.goto("/dashboard/website-settings/dates");
    await waitHydrated(page);
    const before = (await (await request.get("/api/settings")).json()).tourSettings as { tour_id: string; is_active: boolean; name: string }[];
    const target = before.find((t) => t.is_active)!;
    const card = page.locator("div.rounded-xl").filter({ has: page.locator(`input[value="${target.name}"]`) }).first();
    const toggle = card.getByRole("button", { name: /판매중/ });
    await toggle.click();
    await expect.poll(async () => ((await (await request.get("/api/settings")).json()).tourSettings as typeof before).find((t) => t.tour_id === target.tour_id)?.is_active).toBe(false);
    await toggle.click();
    await expect.poll(async () => ((await (await request.get("/api/settings")).json()).tourSettings as typeof before).find((t) => t.tour_id === target.tour_id)?.is_active).toBe(true);
});
