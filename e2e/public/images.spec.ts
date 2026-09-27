import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { env } from "../support/env";
import { waitHydrated } from "../support/customer";
import { installGuard } from "../support/guard";
import { routesFor } from "../support/routes";

/**
 * 사진 규격 검사. 기준: docs/design-canvas/v3/image-slots.json (사람이 읽는 판: docs/image-slots.html)
 *
 * 1) 모든 사진: 깨진 이미지, 표시 크기보다 작은 원본(흐림), 비율이 찌그러진 사진(object-fit: fill)을 찾는다.
 * 2) 사진 칸: 리뉴얼 코드가 칸마다 data-image-slot="landing.hero" 처럼 표시하면
 *    그 칸의 화면 비율·해상도·대체 문구·모바일 전용 사진을 규격과 대조한다.
 *
 * 화면을 스크롤해 지연 로딩 사진까지 불러온 뒤 잰다. 결과: qa/reports/images/<프로젝트>.md
 */
type Slot = {
    id: string;
    page: string;
    name: string;
    display_desktop: [number, number];
    display_mobile: [number, number];
    ratio_desktop: string;
    ratio_mobile: string;
    min_upload: [number, number];
    separate_mobile_image: boolean;
};
const SPEC = path.join(process.cwd(), "docs", "design-canvas", "v3", "image-slots.json");
const slots: Slot[] = fs.existsSync(SPEC) ? JSON.parse(fs.readFileSync(SPEC, "utf8")).slots : [];
/** /_next/image?url=/images/a.jpg&w=640 → /images/a.jpg */
const fileOf = (src: string) => {
    try {
        const u = new URL(src);
        if (u.pathname.startsWith("/_next/image")) return decodeURIComponent(u.searchParams.get("url") ?? src);
        return u.pathname;
    } catch {
        return src;
    }
};
const ratioOf = (r: string) => {
    const [a, b] = r.split(":").map(Number);
    return a / (b || 1);
};

type Measured = {
    route: string;
    slot: string | null;
    src: string;
    alt: string | null;
    boxW: number;
    boxH: number;
    natW: number;
    natH: number;
    fit: string;
    broken: boolean;
    background: boolean;
    /** srcset 이 있으면 naturalWidth 가 sizes 기준으로 환산돼 나오므로 파일을 따로 불러 실제 픽셀을 잰다 */
    srcset: boolean;
};

test("사진 규격: 깨짐·흐림·찌그러짐 + 사진 칸 규격", async ({ page }, info) => {
    test.setTimeout(10 * 60_000);
    const mobile = info.project.name.includes("mobile");
    await installGuard(page);
    const all: Measured[] = [];

    for (const route of routesFor("customer")) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitHydrated(page).catch(() => {});
        // 지연 로딩 사진까지 불러오기: 모든 스크롤 영역을 끝까지 내렸다 올린다
        await page.evaluate(async () => {
            const scrollers = [document.scrollingElement, ...Array.from(document.querySelectorAll("main, [class*=overflow-y-auto]"))].filter(Boolean) as Element[];
            for (const el of scrollers) {
                for (let y = 0; y < el.scrollHeight; y += 600) {
                    el.scrollTop = y;
                    await new Promise((r) => setTimeout(r, 60));
                }
                el.scrollTop = 0;
            }
        });
        await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
        const rows = await page.evaluate(() => {
            const out: Omit<Measured, "route">[] = [];
            for (const img of Array.from(document.querySelectorAll("img"))) {
                const r = img.getBoundingClientRect();
                const cs = getComputedStyle(img);
                if (r.width < 80 || r.height < 60 || cs.display === "none" || cs.visibility === "hidden") continue;
                const slotEl = img.closest("[data-image-slot]");
                out.push({
                    slot: slotEl?.getAttribute("data-image-slot") ?? null,
                    src: img.currentSrc || img.src,
                    alt: img.getAttribute("alt"),
                    boxW: Math.round(r.width),
                    boxH: Math.round(r.height),
                    natW: img.naturalWidth,
                    natH: img.naturalHeight,
                    fit: cs.objectFit,
                    broken: img.complete && img.naturalWidth === 0,
                    background: false,
                    srcset: !!img.getAttribute("srcset"),
                });
            }
            // 배경 사진으로 그린 칸 (data-image-slot 이 붙은 것만 — 크기는 따로 불러 잰다)
            for (const el of Array.from(document.querySelectorAll("[data-image-slot]"))) {
                if (el.querySelector("img")) continue;
                const m = getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/);
                if (!m) continue;
                const r = el.getBoundingClientRect();
                out.push({ slot: el.getAttribute("data-image-slot"), src: m[1], alt: el.getAttribute("aria-label"), boxW: Math.round(r.width), boxH: Math.round(r.height), natW: 0, natH: 0, fit: "cover", broken: false, background: true, srcset: false });
            }
            return out;
        });
        for (const row of rows) {
            if (row.background || (row.srcset && !row.broken)) {
                const size = await page.evaluate(
                    (src) => new Promise<[number, number]>((res) => {
                        const i = new Image();
                        i.onload = () => res([i.naturalWidth, i.naturalHeight]);
                        i.onerror = () => res([0, 0]);
                        i.src = src;
                    }),
                    row.src,
                );
                [row.natW, row.natH] = size;
                if (row.background) row.broken = size[0] === 0;
            }
            all.push({ route, ...row });
        }
    }

    // ── 판정 ──
    const broken = all.filter((m) => m.broken);
    // 배수 = CSS 1px 에 들어가는 원본 픽셀 수 (꽉 채움 기준). image-slots.html 의 "1.3×" 와 같은 값.
    // 1배 미만 = 확대돼서 흐림(실패), 2배 미만 = 레티나에서 덜 선명(경고)
    const scale = (m: Measured) => Math.min(m.natW / m.boxW, m.natH / m.boxH);
    const blurry = all.filter((m) => !m.broken && m.natW > 0 && m.fit !== "contain" && scale(m) < 1);
    const soft = all.filter((m) => !m.broken && m.natW > 0 && scale(m) >= 1 && scale(m) < 2);
    const stretched = all.filter((m) => !m.broken && m.fit === "fill" && m.natH > 0 && Math.abs(m.natW / m.natH / (m.boxW / m.boxH) - 1) > 0.03);

    const slotIssues: string[] = [];
    for (const m of all.filter((x) => x.slot)) {
        const spec = slots.find((s) => s.id === m.slot);
        if (!spec) {
            slotIssues.push(`${m.route} data-image-slot="${m.slot}" 은 image-slots.json 에 없는 칸`);
            continue;
        }
        const want = ratioOf(mobile ? spec.ratio_mobile : spec.ratio_desktop);
        const got = m.boxW / m.boxH;
        // 높이가 글 길이에 따라 바뀌는 칸(예약 배경, 다른 상품 카드 등)은 비율 대신 해상도만 본다
        const fixedRatio = !["booking.background", "detail.activity", "detail.rules", "detail.more"].includes(spec.id);
        if (fixedRatio && Math.abs(got / want - 1) > 0.06) slotIssues.push(`${spec.page} ${spec.name} (${spec.id}) @${m.route}: 화면 비율 ${got.toFixed(2)} ≠ 규격 ${want.toFixed(2)}`);
        if (!m.alt || !m.alt.trim()) slotIssues.push(`${spec.page} ${spec.name} (${spec.id}) @${m.route}: 대체 문구(alt) 없음`);
        if (m.natW > 0 && scale(m) < 1) slotIssues.push(`${spec.page} ${spec.name} (${spec.id}) @${m.route}: 원본 ${m.natW}×${m.natH} 이 표시 ${m.boxW}×${m.boxH} 보다 작음`);
    }

    // 리뉴얼 후에는 규격표의 모든 칸이 어딘가에 표시돼 있어야 한다 (상세·예약 페이지 라우트가 생긴 뒤)
    const found = new Set(all.map((m) => m.slot).filter(Boolean));
    const missingSlots = env.expectRenewal ? slots.filter((s) => !found.has(s.id)).map((s) => `${s.id} (${s.page} ${s.name})`) : [];

    // ── 보고서 ──
    const dir = path.join(process.cwd(), "qa", "reports", "images");
    fs.mkdirSync(dir, { recursive: true });
    const esc = (s: string) => s.replace(/\|/g, "\\|");
    const lines = [
        `# 사진 규격 검사 — ${info.project.name}`,
        "",
        `사진 ${all.length}장 · 깨짐 ${broken.length} · 흐림(1배 미만) ${blurry.length} · 2배 미만 ${soft.length} · 찌그러짐 ${stretched.length} · 칸 규격 위반 ${slotIssues.length} · 표시된 칸 ${found.size}/${slots.length}`,
        "",
        "| 판정 | 페이지 | 칸 | 표시(CSS px) | 원본(px) | 배수 | 파일 |",
        "|---|---|---|---|---|---|---|",
        ...all.map((m) => {
            const v = m.broken ? "깨짐" : blurry.includes(m) ? "흐림" : stretched.includes(m) ? "찌그러짐" : soft.includes(m) ? "2배 미만" : "OK";
            return `| ${v} | ${m.route} | ${m.slot ?? "—"} | ${m.boxW}×${m.boxH} | ${m.natW}×${m.natH} | ${m.natW ? scale(m).toFixed(1) + "×" : "—"} | ${esc(fileOf(m.src))} |`;
        }),
        ...(slotIssues.length ? ["", "## 칸 규격 위반", ...slotIssues.map((s) => `- ${s}`)] : []),
        ...(missingSlots.length ? ["", "## 화면에서 찾지 못한 칸", ...missingSlots.map((s) => `- ${s}`)] : []),
    ];
    fs.writeFileSync(path.join(dir, `${info.project.name}.md`), lines.join("\n"));
    if (soft.length) info.annotations.push({ type: "warning", description: `2배 미만 사진 ${soft.length}장 — qa/reports/images/${info.project.name}.md` });

    const fmt = (xs: Measured[]) => xs.map((m) => `  - ${m.route} ${fileOf(m.src)} 표시 ${m.boxW}×${m.boxH} / 원본 ${m.natW}×${m.natH}`).join("\n");
    expect.soft(broken, `깨진 사진:\n${fmt(broken)}`).toEqual([]);
    expect.soft(blurry, `표시 크기보다 작은 원본(흐림):\n${fmt(blurry)}`).toEqual([]);
    expect.soft(stretched, `비율이 찌그러진 사진:\n${fmt(stretched)}`).toEqual([]);
    expect.soft(slotIssues, "사진 칸 규격 위반").toEqual([]);
    expect(missingSlots, "규격표에 있는데 화면에 없는 칸 (data-image-slot 표시 누락 또는 페이지 없음)").toEqual([]);
});
