import { expect, test } from "@playwright/test";
import { env } from "../support/env";
import { installGuard } from "../support/guard";
import { routesFor } from "../support/routes";
import { isAllowed, loadAllowlist, saveSweep, sweepPage } from "../support/sweep";

/**
 * 고객 페이지 "버튼 전수 클릭".
 * 모든 버튼·링크·클릭 가능한 요소를 눌러
 *   - 누르면 에러(예외, 5xx, 깨진 링크)가 나는 버튼
 *   - 눌러도 아무 일도 일어나지 않는 버튼(죽은 버튼)
 * 을 찾는다. 결과: qa/reports/sweep/<프로젝트>/<라우트>.md
 *
 * 쓰기 요청·Stripe·외부 이동은 guard 가 막으므로 운영 URL 에서도 안전하다.
 */
test.describe.configure({ mode: "parallel" });

const allow = loadAllowlist();

for (const route of [...routesFor("customer"), ...routesFor("checkin")]) {
    test(`버튼 전수 클릭: ${route}`, async ({ page }, info) => {
        test.setTimeout(20 * 60_000);
        const guard = await installGuard(page);
        const probes = await sweepPage(page, { route, guard, limit: env.sweepLimit, depth: env.sweepDepth, only: env.sweepOnly });
        saveSweep(info.project.name, route, probes);

        const broken = probes.filter((p) => p.verdict === "error");
        const dead = probes.filter((p) => p.verdict === "none" && !isAllowed(allow, route, p));
        const fmt = (xs: typeof probes) => xs.map((p) => `  - ${p.path.join(" › ")}  ${[...p.errors, ...p.detail].join(" / ")}`).join("\n");

        expect.soft(broken, `누르면 에러가 나는 요소 ${broken.length}개:\n${fmt(broken)}`).toEqual([]);
        expect.soft(dead, `눌러도 아무 일도 없는 요소 ${dead.length}개 (의도된 것이면 qa/sweep-allowlist.json 에 추가):\n${fmt(dead)}`).toEqual([]);
        expect(probes.length, "클릭 후보를 하나도 찾지 못함 — 페이지가 비었거나 React 가 로드되지 않음").toBeGreaterThan(0);
    });
}
