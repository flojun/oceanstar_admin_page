import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import type { Guard, GuardEvent } from "./guard";

/**
 * "버튼 전수 클릭" — 페이지에 보이는 모든 클릭 가능한 요소를 하나씩 눌러 보고,
 * 무엇이 일어났는지(이동/새 창/다운로드/대화상자/저장 시도/조회/스크롤/화면 변화/아무 일 없음)를 기록한다.
 *
 * - 클릭 대상은 네이티브 button·a[href] + React onClick 등이 붙은 모든 요소(__reactProps$ 로 식별).
 *   그래서 리뉴얼로 마크업·클래스가 바뀌어도 선택자 수정 없이 그대로 돌아간다.
 * - 매 클릭마다 페이지를 새로 연다 → 앞의 클릭이 다음 클릭에 영향을 주지 않는다.
 * - depth 2 이면 클릭으로 새로 나타난 요소(모달 안 버튼 등)까지 한 단계 더 들어간다.
 * - 쓰기 요청은 guard 가 막는다. 막힌 쓰기 = "이 버튼은 저장 기능에 연결되어 있다"는 증거.
 */

export type Verdict = "error" | "navigate" | "popup" | "download" | "dialog" | "write-attempt" | "request" | "scroll" | "ui" | "none" | "unclickable" | "skipped";

export interface Candidate {
    sig: string;
    nth: number;
    tag: string;
    label: string;
    href: string | null;
    target: string | null;
    handlers: string[];
    submitsForm: boolean;
}

export interface Probe {
    path: string[];
    tag: string;
    label: string;
    href: string | null;
    handlers: string[];
    verdict: Verdict;
    detail: string[];
    errors: string[];
}

const SKIP_LABEL = /로그아웃|logout|log out|sign ?out/i;

/**
 * 페이지 안에서 실행: 클릭 후보 나열. 요소 참조는 window.__qaEls 에 같은 순서로 보관한다.
 * (Playwright 가 함수를 문자열로 넘기므로 바깥 변수를 참조하면 안 된다)
 */
function collectInPage(): Candidate[] {
    const HANDLERS = ["onClick", "onMouseDown", "onPointerDown", "onTouchEnd", "onDoubleClick"];
    const propsOf = (el: Element): Record<string, unknown> | null => {
        const k = Object.keys(el).find((x) => x.startsWith("__reactProps$"));
        return k ? ((el as unknown as Record<string, Record<string, unknown>>)[k] ?? null) : null;
    };
    const isShown = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        for (let a: Element | null = el; a; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (s.display === "none" || s.visibility === "hidden") return false;
        }
        return getComputedStyle(el).pointerEvents !== "none";
    };
    const text = (el: Element) =>
        (el.getAttribute("aria-label") || el.getAttribute("title") || (el as HTMLElement).innerText || (el as HTMLInputElement).value || el.querySelector("img[alt]")?.getAttribute("alt") || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
    const picked: { el: Element; c: Omit<Candidate, "sig" | "nth"> }[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
        const tag = el.tagName.toLowerCase();
        if (tag === "form") continue;
        const p = propsOf(el);
        const handlers = p ? HANDLERS.filter((h) => typeof p[h] === "function") : [];
        const input = el as HTMLInputElement;
        const native = tag === "button" || (tag === "a" && el.hasAttribute("href")) || (tag === "input" && ["submit", "button"].includes(input.type)) || tag === "summary";
        if (!native && !handlers.length) continue;
        if ((el as HTMLButtonElement).disabled || !isShown(el)) continue;
        const form = el.closest("form");
        const formProps = form ? propsOf(form) : null;
        const submitsForm = tag === "button" && !!form && (el as HTMLButtonElement).type === "submit" && typeof formProps?.onSubmit === "function";
        picked.push({ el, c: { tag, label: text(el), href: el.getAttribute("href"), target: el.getAttribute("target"), handlers, submitsForm } });
    }
    // 버튼/링크 안에 들어 있는 안쪽 후보는 같은 동작이므로 제외 (button > span[onClick] 등)
    const set = new Set(picked.map((x) => x.el));
    const outer = picked.filter((x) => {
        for (let a = x.el.parentElement; a; a = a.parentElement) if (set.has(a) && (a.tagName === "BUTTON" || a.tagName === "A")) return false;
        return true;
    });
    const counts = new Map<string, number>();
    const cands = outer.map(({ c }) => {
        const sig = `${c.tag}|${c.label}|${c.href ?? ""}`;
        const nth = counts.get(sig) ?? 0;
        counts.set(sig, nth + 1);
        return { ...c, sig, nth };
    });
    const w = window as unknown as { __qaEls: Element[]; __qaCands: Candidate[] };
    w.__qaEls = outer.map((x) => x.el);
    w.__qaCands = cands;
    return cands;
}

async function enumerate(page: Page): Promise<Candidate[]> {
    return page.evaluate(collectInPage);
}

/** sig/nth 로 요소를 다시 찾아 data-qa-sweep 표시 */
async function mark(page: Page, c: { sig: string; nth: number }): Promise<boolean> {
    await enumerate(page);
    return page.evaluate(({ sig, nth }) => {
        document.querySelectorAll("[data-qa-sweep]").forEach((e) => e.removeAttribute("data-qa-sweep"));
        const w = window as unknown as { __qaEls: Element[]; __qaCands: { sig: string; nth: number }[] };
        const i = w.__qaCands.findIndex((x) => x.sig === sig && x.nth === nth);
        if (i < 0) return false;
        w.__qaEls[i].setAttribute("data-qa-sweep", "1");
        return true;
    }, c);
}

/** 스크롤 가능한 영역들을 중간쯤으로 — 앵커 이동 버튼이 "이미 그 자리라서 안 움직임"으로 오판되지 않게 */
async function centerScrollers(page: Page) {
    await page.evaluate(() => {
        const els = [document.scrollingElement, ...Array.from(document.querySelectorAll("main, [class*=overflow-y-auto], [class*=overflow-auto]"))].filter(Boolean) as Element[];
        for (const el of els) if (el.scrollHeight > el.clientHeight + 200) el.scrollTop = Math.floor((el.scrollHeight - el.clientHeight) / 2);
    });
}

async function snapshot(page: Page) {
    return page.evaluate(() => {
        let scroll = window.scrollX + window.scrollY;
        for (const el of Array.from(document.querySelectorAll("*"))) if (el.scrollTop || el.scrollLeft) scroll += el.scrollTop + el.scrollLeft;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        w.__qaMut = 0;
        w.__qaMO?.disconnect();
        w.__qaMO = new MutationObserver((ms) => {
            w.__qaMut += ms.filter((m) => !(m.type === "attributes" && m.attributeName === "data-qa-sweep")).length;
        });
        w.__qaMO.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
        return { scroll, url: location.href };
    });
}

async function settle(page: Page, guard: Guard, m: number) {
    const start = Date.now();
    let last = -1;
    let stable = Date.now();
    while (Date.now() - start < 3500) {
        await page.waitForTimeout(150);
        const n = guard.since(m).filter((e) => e.type === "request" || e.type === "blocked").length;
        if (n !== last) {
            last = n;
            stable = Date.now();
        }
        if (Date.now() - stable > 500 && Date.now() - start > 800) break;
    }
}

const STATIC_RES = new Set(["image", "font", "stylesheet", "media", "script", "manifest", "other"]);

/** 우리 서버·Supabase·Stripe 요청만 "기능"으로 센다 (지도 타일, 유튜브 등 외부 리소스 제외) */
function firstParty(url: string, origin: string) {
    return url.startsWith(origin) || /\.supabase\.co\//.test(url) || /stripe\.com/.test(url);
}

function classify(evts: GuardEvent[], navigated: string | null, scrolled: boolean, mutations: number, origin: string): { verdict: Verdict; detail: string[]; errors: string[] } {
    const errors: string[] = [];
    const detail: string[] = [];
    for (const e of evts) {
        if (e.type === "page-error") errors.push(`예외: ${e.text}`);
        // 이미지·폰트 같은 정적 리소스 5xx 는 버튼 탓이 아니다 (페이지 스모크가 따로 잡음)
        if (e.type === "response-error" && STATIC_RES.has(e.resourceType)) detail.push(`정적 리소스 ${e.status} ${e.url}`);
        else if (e.type === "response-error") errors.push(`${e.status} ${e.method} ${e.url}`);
        if (e.type === "document" && e.status >= 400) errors.push(`이동한 페이지가 ${e.status}: ${e.url}`);
    }
    const popups = evts.filter((e) => e.type === "popup").map((e) => (e as { url: string }).url);
    const downloads = evts.filter((e) => e.type === "download").map((e) => (e as { filename: string }).filename);
    const dialogs = evts.filter((e) => e.type === "dialog").map((e) => `${(e as { kind: string }).kind}: ${(e as { message: string }).message.slice(0, 60)}`);
    const writes = evts
        .filter((e) => e.type === "blocked" && (e as { reason: string }).reason !== "external-navigation" && firstParty((e as { url: string }).url, origin))
        .map((e) => `${(e as { method: string }).method} ${(e as { url: string }).url.split("?")[0]}`);
    const extNav = evts.filter((e) => e.type === "blocked" && (e as { reason: string }).reason === "external-navigation").map((e) => (e as { url: string }).url);
    const reads = evts
        .filter((e) => e.type === "request" && !STATIC_RES.has((e as { resourceType: string }).resourceType) && firstParty((e as { url: string }).url, origin))
        .filter((e) => !(e as { method: string }).method.match(/^(POST|PUT|PATCH|DELETE)$/) || !evts.some((b) => b.type === "blocked" && (b as { url: string }).url === (e as { url: string }).url))
        .map((e) => `${(e as { method: string }).method} ${(e as { url: string }).url.split("?")[0]}`);
    if (navigated) detail.push(`→ ${navigated}`);
    if (extNav.length) detail.push(...extNav.map((u) => `외부이동 ${u}`));
    if (popups.length) detail.push(...popups.map((u) => `새 창 ${u}`));
    if (downloads.length) detail.push(...downloads.map((f) => `다운로드 ${f}`));
    if (dialogs.length) detail.push(...dialogs);
    if (writes.length) detail.push(...[...new Set(writes)].map((w) => `저장 시도(차단) ${w}`));
    if (reads.length) detail.push(...[...new Set(reads)].slice(0, 5).map((r) => `조회 ${r}`));
    if (scrolled) detail.push("스크롤");
    if (mutations) detail.push(`화면 변화 ${mutations}`);
    const verdict: Verdict = errors.length
        ? "error"
        : navigated || extNav.length
          ? "navigate"
          : popups.length
            ? "popup"
            : downloads.length
              ? "download"
              : dialogs.length
                ? "dialog"
                : writes.length
                  ? "write-attempt"
                  : reads.length
                    ? "request"
                    : scrolled
                      ? "scroll"
                      : mutations
                        ? "ui"
                        : "none";
    return { verdict, detail, errors };
}

export interface SweepOptions {
    route: string;
    guard: Guard;
    limit: number;
    depth: number;
    /** 페이지를 연 뒤 준비 작업 (로그인 확인 등) */
    ready?: (page: Page) => Promise<void>;
    /** 라벨이 이 정규식에 맞는 최상위 요소만 검사 (QA_SWEEP_ONLY) */
    only?: RegExp;
}

/**
 * 페이지를 새로 연다. 로드 중 5xx·JS 예외가 있으면 한 번 다시 열고, 그래도 실패하면 오류 목록을 돌려준다.
 * (로드가 망가진 상태에서 누른 버튼을 "죽은 버튼"으로 오판하지 않기 위해)
 */
async function open(page: Page, route: string, guard: Guard, ready?: (page: Page) => Promise<void>): Promise<string[]> {
    let errors: string[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
        const m = guard.mark();
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        if (ready) await ready(page);
        errors = guard
            .since(m)
            .flatMap((e) => (e.type === "response-error" ? [`${e.status} ${e.method} ${e.url}`] : e.type === "page-error" ? [`예외: ${e.text}`] : e.type === "document" && e.status >= 400 ? [`문서 ${e.status}`] : []));
        if (!errors.length) break;
    }
    guard.arm();
    return errors;
}

async function replay(page: Page, pathSigs: Candidate[], guard: Guard): Promise<boolean> {
    for (const c of pathSigs) {
        if (!(await mark(page, c))) return false;
        await page.locator('[data-qa-sweep="1"]').click({ timeout: 4000 }).catch(() => {});
        await settle(page, guard, guard.mark());
    }
    return true;
}

async function probeOne(page: Page, guard: Guard, c: Candidate): Promise<Omit<Probe, "path">> {
    const base = { tag: c.tag, label: c.label, href: c.href, handlers: c.handlers };
    if (SKIP_LABEL.test(c.label)) return { ...base, verdict: "skipped", detail: ["세션 종료 버튼은 누르지 않음"], errors: [] };
    if (c.href && /^(tel:|mailto:|sms:)/.test(c.href)) return { ...base, verdict: "skipped", detail: [`${c.href} (OS 앱 호출, 형식만 확인)`], errors: [] };
    if (!(await mark(page, c))) return { ...base, verdict: "unclickable", detail: ["다시 열었을 때 요소를 찾지 못함 (동적 콘텐츠)"], errors: [] };
    const loc = page.locator('[data-qa-sweep="1"]');
    await centerScrollers(page);
    await loc.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    const before = await snapshot(page);
    const m = guard.mark();
    try {
        await loc.click({ timeout: 4000 });
    } catch (e) {
        return { ...base, verdict: "unclickable", detail: [String((e as Error).message).split("\n")[0].slice(0, 160)], errors: [] };
    }
    await settle(page, guard, m);
    const after = await page
        .evaluate(() => {
            let scroll = window.scrollX + window.scrollY;
            for (const el of Array.from(document.querySelectorAll("*"))) if (el.scrollTop || el.scrollLeft) scroll += el.scrollTop + el.scrollLeft;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { scroll, url: location.href, mut: (window as any).__qaMut ?? 0 };
        })
        .catch(() => ({ scroll: before.scroll, url: page.url(), mut: 0 }));
    const navigated = after.url !== before.url ? after.url : null;
    return { ...base, ...classify(guard.since(m), navigated, Math.abs(after.scroll - before.scroll) > 4, navigated ? 0 : after.mut, new URL(page.url()).origin) };
}

export async function sweepPage(page: Page, opts: SweepOptions): Promise<Probe[]> {
    const { route, guard, limit, depth, ready, only } = opts;
    const results: Probe[] = [];
    const firstLoad = await open(page, route, guard, ready);
    if (firstLoad.length) return [{ path: ["(페이지 로드)"], tag: "page", label: route, href: null, handlers: [], verdict: "error", detail: [], errors: firstLoad }];
    const top = (await enumerate(page)).filter((c) => !only || only.test(c.label));
    const queue: { path: Candidate[]; c: Candidate }[] = top.map((c) => ({ path: [], c }));
    const seen = new Set(top.map((c) => `${c.sig}#${c.nth}`));
    while (queue.length && results.length < limit) {
        const { path: parents, c } = queue.shift()!;
        const loadErrors = await open(page, route, guard, ready);
        if (loadErrors.length) {
            results.push({ path: [...parents.map((p) => p.label || p.tag), c.label || c.tag], tag: c.tag, label: c.label, href: c.href, handlers: c.handlers, verdict: "error", detail: ["클릭 전 페이지 로드 실패"], errors: loadErrors });
            continue;
        }
        if (parents.length && !(await replay(page, parents, guard))) {
            results.push({ path: [...parents.map((p) => p.label || p.tag), c.label || c.tag], tag: c.tag, label: c.label, href: c.href, handlers: c.handlers, verdict: "unclickable", detail: ["상위 요소 재현 실패"], errors: [] });
            continue;
        }
        let probe = await probeOne(page, guard, c);
        // "무반응"은 한 번 더 새로 열어 확인한다 (느린 로드·애니메이션 중 클릭으로 인한 오판 방지)
        if (probe.verdict === "none") {
            const again = await open(page, route, guard, ready);
            if (!again.length && (!parents.length || (await replay(page, parents, guard)))) {
                const retry = await probeOne(page, guard, c);
                probe = retry.verdict === "none" ? { ...retry, detail: [...retry.detail, "재시도 1회 후에도 무반응"] } : { ...retry, detail: [...retry.detail, "첫 시도 무반응 → 재시도에서 반응"] };
            }
        }
        results.push({ path: [...parents.map((p) => p.label || p.tag), c.label || c.tag], ...probe });
        // 모달이 열리는 등 화면만 바뀐 경우: 새로 나타난 요소를 다음 깊이로
        if (probe.verdict === "ui" && parents.length + 1 < depth) {
            const now = await enumerate(page).catch(() => [] as Candidate[]);
            for (const child of now) {
                const key = `${child.sig}#${child.nth}`;
                if (seen.has(key)) continue;
                seen.add(key);
                queue.push({ path: [...parents, c], c: child });
            }
        }
    }
    return results;
}

// ─────────────────────────────────────────────────────────────
// 결과 저장 · 판정
// ─────────────────────────────────────────────────────────────
export interface Allow {
    route?: string;
    label: string;
    reason: string;
}
export function loadAllowlist(): Allow[] {
    const p = path.join(process.cwd(), "qa", "sweep-allowlist.json");
    if (!fs.existsSync(p)) return [];
    return (JSON.parse(fs.readFileSync(p, "utf8")).allow ?? []) as Allow[];
}
export function isAllowed(allow: Allow[], route: string, probe: Probe) {
    return allow.some((a) => (!a.route || a.route === route) && new RegExp(a.label).test(probe.label));
}

export function saveSweep(project: string, route: string, probes: Probe[]) {
    const dir = path.join(process.cwd(), "qa", "reports", "sweep", project);
    fs.mkdirSync(dir, { recursive: true });
    const slug = route.replace(/^\//, "").replace(/[/?&=]/g, "_") || "root";
    fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify({ route, project, at: new Date().toISOString(), probes }, null, 2));
    const lines = [`# ${route} (${project}) — ${probes.length}개 요소`, "", "| 판정 | 경로 | 결과 |", "|---|---|---|"];
    for (const p of probes) lines.push(`| ${p.verdict} | ${p.path.join(" › ").replace(/\|/g, "\\|")} | ${[...p.errors, ...p.detail].join("<br>").replace(/\|/g, "\\|")} |`);
    fs.writeFileSync(path.join(dir, `${slug}.md`), lines.join("\n"));
}
