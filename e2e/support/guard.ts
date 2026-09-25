import type { Page, Request, Route } from "@playwright/test";
import { env } from "./env";

/**
 * 안전망 + 기록기.
 *
 * - 쓰기 요청(POST/PUT/PATCH/DELETE)은 기본 차단한다. 차단된 요청은 "이 버튼이 실제로 무언가를
 *   저장하려 했다"는 증거로 기록된다 (= 버튼이 기능에 연결되어 있음).
 * - Stripe 결제창, 외부 사이트 이동은 항상 막는다.
 * - confirm()/prompt() 는 "취소"로 닫는다 → 파괴적 동작이 진행되지 않는다.
 * - 콘솔 에러, 처리되지 않은 예외, 5xx 응답을 모은다.
 */

/** 쓰기처럼 보이지만 조회인 요청 (차단하지 않음) */
const READ_ONLY_WRITES: RegExp[] = [
    /\/api\/verify-booking$/, // 예약 조회 (POST 이지만 읽기)
    /\/api\/stripe\/verify-session$/, // 결제 확인 — 세션이 없으면 아무것도 쓰지 않음
    /\/auth\/v1\/token/, // Supabase 로그인·토큰 갱신
    /\/auth\/v1\/user$/,
];

/**
 * 광고·분석·채팅 위젯 — 테스트 트래픽이 마케팅 통계를 오염시키지 않게, 그리고 판정 노이즈가 되지 않게
 * 조용히 막는다 (기록하지 않음). 광고 차단기를 켠 방문자와 같은 상태.
 */
const THIRD_PARTY_NOISE: RegExp[] = [
    /googletagmanager\.com|google-analytics\.com|doubleclick\.net|googleadservices\.com|googlesyndication\.com/,
    /google\.com\/(rmkt|ccm|pagead)\//,
    /jnn-pa\.googleapis\.com/,
    /hubspot\.com|hs-scripts\.com|hs-analytics\.net|hscollectedforms\.net|hs-banner\.com|usemessages\.com|hubapi\.com/,
    /youtube\.com\/(youtubei\/v1\/log_event|api\/stats|generate_204|ptracking)/,
    /play\.google\.com\/log/,
];

/** 어떤 경우에도 실제로 보내지 않는 요청 */
const ALWAYS_BLOCK: RegExp[] = [
    /^https:\/\/(checkout|api|js|m)\.stripe\.(com|network)\//,
    /\/api\/notifications\/discord-urgent-reservation/,
    /discord(app)?\.com\/api\/webhooks/,
    /\/api\/cron\//,
];

export type GuardEvent =
    | { t: number; type: "request"; method: string; url: string; resourceType: string }
    | { t: number; type: "blocked"; method: string; url: string; reason: string }
    | { t: number; type: "response-error"; status: number; url: string; method: string; resourceType: string }
    | { t: number; type: "document"; status: number; url: string }
    | { t: number; type: "console-error"; text: string }
    | { t: number; type: "page-error"; text: string }
    | { t: number; type: "dialog"; kind: string; message: string }
    | { t: number; type: "popup"; url: string }
    | { t: number; type: "download"; filename: string };

export interface Guard {
    events: GuardEvent[];
    /** 이 시점 이후의 이벤트만 보고 싶을 때 */
    mark(): number;
    since(mark: number): GuardEvent[];
    /** 초기 로드가 끝난 뒤 호출 — 이후 서버 액션(POST + next-action) 도 차단 */
    arm(): void;
    pageErrors(): string[];
    consoleErrors(): string[];
    serverErrors(): { status: number; url: string; method: string }[];
    blocked(): { method: string; url: string }[];
}

/** 페이지 로드 중 흔히 나오지만 기능과 무관한 콘솔 에러 */
const CONSOLE_NOISE: RegExp[] = [
    /hs-scripts|hubspot|hs-analytics|hsforms/i,
    /googletagmanager|google-analytics|googleads|doubleclick|gtag/i,
    /Failed to load resource: the server responded with a status of 4\d\d/i, // 404 등은 response 로 따로 잡음
    /Download the React DevTools/i,
    /ERR_BLOCKED_BY_CLIENT|net::ERR_ABORTED|net::ERR_FAILED/i, // 우리가 차단한 요청
    /The resource .* was preloaded using link preload/i,
    /Google Maps JavaScript API warning/i,
];

export async function installGuard(page: Page, opts: { allowMutations?: boolean } = {}): Promise<Guard> {
    const allowMutations = opts.allowMutations ?? env.allowMutations;
    const events: GuardEvent[] = [];
    const now = () => Date.now();
    let armed = false;
    const origin = new URL(env.baseURL).origin;

    const isWrite = (req: Request) => !["GET", "HEAD", "OPTIONS"].includes(req.method());

    await page.route("**/*", async (route: Route) => {
        const req = route.request();
        const url = req.url();
        const method = req.method();
        if (THIRD_PARTY_NOISE.some((re) => re.test(url))) return route.abort("blockedbyclient");
        if (ALWAYS_BLOCK.some((re) => re.test(url))) {
            events.push({ t: now(), type: "blocked", method, url, reason: "always-block" });
            return route.abort("blockedbyclient");
        }
        // 다른 사이트로의 문서 이동(외부 링크 target=_self)은 막고 기록만
        if (req.isNavigationRequest() && req.frame() === page.mainFrame() && !url.startsWith(origin) && !url.startsWith("about:")) {
            events.push({ t: now(), type: "blocked", method, url, reason: "external-navigation" });
            return route.abort("blockedbyclient");
        }
        if (isWrite(req) && !allowMutations) {
            const serverAction = !!(await req.headerValue("next-action"));
            const readOnly = READ_ONLY_WRITES.some((re) => re.test(url.split("?")[0]));
            if (!readOnly && (!serverAction || armed)) {
                events.push({ t: now(), type: "blocked", method, url, reason: serverAction ? "server-action" : "write" });
                return route.abort("blockedbyclient");
            }
        }
        return route.continue();
    });

    page.on("request", (req) => {
        if (THIRD_PARTY_NOISE.some((re) => re.test(req.url()))) return;
        events.push({ t: now(), type: "request", method: req.method(), url: req.url(), resourceType: req.resourceType() });
    });
    page.on("response", (res) => {
        const status = res.status();
        const url = res.url();
        if (res.request().isNavigationRequest() && res.frame() === page.mainFrame()) events.push({ t: now(), type: "document", status, url });
        if (status >= 500 || (status === 404 && url.startsWith(origin) && /\/(api|_next)\//.test(url)))
            events.push({ t: now(), type: "response-error", status, url, method: res.request().method(), resourceType: res.request().resourceType() });
    });
    page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (CONSOLE_NOISE.some((re) => re.test(text))) return;
        events.push({ t: now(), type: "console-error", text });
    });
    page.on("pageerror", (err) => events.push({ t: now(), type: "page-error", text: `${err.name}: ${err.message}` }));
    page.on("dialog", async (d) => {
        events.push({ t: now(), type: "dialog", kind: d.type(), message: d.message() });
        // confirm/prompt 는 "취소" → 파괴적 동작 진행 안 됨. alert 는 확인만 가능.
        if (d.type() === "alert" || d.type() === "beforeunload") await d.accept().catch(() => {});
        else await d.dismiss().catch(() => {});
    });
    page.on("popup", async (p) => {
        let url = p.url();
        if (!url || url === "about:blank") {
            const r = await p.waitForRequest((q) => q.isNavigationRequest(), { timeout: 3000 }).catch(() => null);
            url = r?.url() ?? url;
        }
        events.push({ t: now(), type: "popup", url });
        await p.close().catch(() => {});
    });
    page.on("download", async (d) => {
        events.push({ t: now(), type: "download", filename: d.suggestedFilename() });
        await d.cancel().catch(() => {});
    });

    return {
        events,
        mark: () => events.length,
        since: (m) => events.slice(m),
        arm: () => {
            armed = true;
        },
        pageErrors: () => events.filter((e) => e.type === "page-error").map((e) => (e as { text: string }).text),
        consoleErrors: () => events.filter((e) => e.type === "console-error").map((e) => (e as { text: string }).text),
        serverErrors: () => events.filter((e) => e.type === "response-error") as { status: number; url: string; method: string }[],
        blocked: () => events.filter((e) => e.type === "blocked") as { method: string; url: string }[],
    };
}
