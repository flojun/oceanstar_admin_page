import fs from "node:fs";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { env } from "../support/env";

/** 관리자 로그인 1회 → 세션을 qa/.auth/admin.json 에 저장해 어드민 테스트가 재사용 */
const STATE = path.join(process.cwd(), "qa", ".auth", "admin.json");

setup("관리자 로그인", async ({ page }) => {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    if (!env.admin.email || !env.admin.password) {
        fs.writeFileSync(STATE, JSON.stringify({ cookies: [], origins: [] }));
        setup.skip(true, "QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD 가 없으면 어드민 검사는 건너뜀");
    }
    await page.goto("/login");
    await page.getByPlaceholder("admin").fill(env.admin.email);
    await page.locator('input[type="password"]').fill(env.admin.password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await expect(page, "로그인 실패 — 계정/비밀번호 확인").toHaveURL(/\/dashboard\/alerts/, { timeout: 20_000 });
    await page.context().storageState({ path: STATE });
});
