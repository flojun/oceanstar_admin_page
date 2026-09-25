import { defineConfig, devices } from "@playwright/test";

/**
 * 배포 전 회귀 검사 (docs/qa/regression-test-plan.md 참고)
 *
 *   QA_BASE_URL=https://<vercel-preview>.vercel.app npx playwright test
 *
 * 기본값은 로컬(npm run dev / npm start). 운영 URL 을 넣으면 모든 쓰기 요청은 자동 차단된다.
 */
const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3000";
const chromium = process.env.QA_CHROMIUM_PATH ? { executablePath: process.env.QA_CHROMIUM_PATH } : {};

const mobile = {
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone SE"].userAgent,
};

export default defineConfig({
    testDir: "./e2e",
    outputDir: "qa/reports/playwright-artifacts",
    timeout: 90_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    // 재시도하지 않는다: 한 번 실패하면 원인을 본다 (flaky 는 원인이 아님)
    retries: 0,
    reporter: [
        ["list"],
        ["html", { outputFolder: "qa/reports/playwright-html", open: "never" }],
        ["json", { outputFile: "qa/reports/playwright.json" }],
    ],
    use: {
        baseURL,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        launchOptions: chromium,
    },
    projects: [
        // 고객 사이트 — 한국 고객 기준 시간대
        { name: "public-desktop", testDir: "./e2e/public", use: { browserName: "chromium", viewport: { width: 1440, height: 900 }, locale: "ko-KR", timezoneId: "Asia/Seoul" } },
        { name: "public-mobile", testDir: "./e2e/public", use: { browserName: "chromium", ...mobile, locale: "ko-KR", timezoneId: "Asia/Seoul" } },
        // API 계약 (브라우저 없이)
        { name: "api", testDir: "./e2e/api" },
        // 어드민 — 하와이 현장 기준 시간대, 로그인 상태 재사용
        { name: "admin-setup", testDir: "./e2e/admin", testMatch: /.*\.setup\.ts/ },
        {
            name: "admin",
            testDir: "./e2e/admin",
            testIgnore: /.*\.setup\.ts/,
            dependencies: ["admin-setup"],
            use: { browserName: "chromium", viewport: { width: 1440, height: 900 }, locale: "ko-KR", timezoneId: "Pacific/Honolulu", storageState: "qa/.auth/admin.json" },
        },
        { name: "agency", testDir: "./e2e/agency", use: { browserName: "chromium", viewport: { width: 1440, height: 900 }, locale: "ko-KR", timezoneId: "Pacific/Honolulu" } },
    ],
    webServer: process.env.QA_START_SERVER
        ? { command: "npm run build && npm run start", url: baseURL, timeout: 600_000, reuseExistingServer: true }
        : undefined,
});
