import { expect, test } from "@playwright/test";
import { gotoReady } from "../support/customer";
import { installGuard } from "../support/guard";

/**
 * 스크롤 연출 가드 (site.css · detail.css · reviews/faq/food/manage.css 의 animation-timeline)
 *  1) 세로 타임라인이 페이지가 아닌 상자(overflow:hidden/auto)에 붙어 멈춘 애니메이션이 없다
 *  2) 화면에 보이는 예약·문의 버튼과 그 조상은 늘 opacity 1
 *  3) 맨 위(scroll 0)에서 히어로 사진·h1 과 첫 화면 카드(.buy 안내 줄 · FAQ 빠른 안내 · 후기 탭 · 맛집 인사 · 예약 조회 카드)는 연출이 없을 때와 같은 자리·같은 opacity
 *  4) 틀(.os main .dp 히어로 section · .nav .pin .sect .buy .dock · 후기 쓰기 창을 품은 .rv-h #site)에는 스크롤 연출을 걸지 않는다
 */
const ROUTES = [
    "/kr", "/kr/tours/turtle", "/kr/tours/sunset", "/kr/tours/combo", "/kr/tours/surf", "/kr/tours/private",
    "/kr/reviews", "/kr/faq", "/kr/restaurants", "/kr/manage-booking",
];

for (const route of ROUTES) {
    test(`스크롤 연출: ${route}`, async ({ page }, info) => {
        test.skip(info.project.name !== "public-desktop", "폭은 이 테스트가 직접 바꾼다");
        await installGuard(page);
        // 1279 = 비교표가 가로 스크롤 상자로 바뀌는 마지막 폭. 한 폭에서 틀려도 나머지 폭까지 다 보고 모아서 알린다
        const all: string[] = [];
        for (const width of [375, 768, 1279, 1440]) {
            await page.setViewportSize({ width, height: 800 });
            await gotoReady(page, route);
            const bad = await page.evaluate(async () => {
                const out: string[] = [];
                const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
                const tag = (el?: Element | null) => (el ? [el.tagName.toLowerCase(), ...el.classList].join(".") : "?");
                const max = document.documentElement.scrollHeight - innerHeight;
                for (const f of [0, 0.25, 0.5, 0.75, 1]) {
                    scrollTo(0, f * max);
                    await frame();
                    for (const a of document.getAnimations()) {
                        // 이름표(--tours --hero …)를 못 찾으면 타임라인이 null 이라 0 에 멈춘다
                        if (a instanceof CSSAnimation && a.timeline === null)
                            out.push(`이름표 없음 ${tag((a.effect as KeyframeEffect | null)?.target)} ${a.animationName}`);
                        // view() 는 가장 가까운 스크롤 상자에 붙는다 — 페이지가 아니면 진행도가 멈춘다
                        const tl = a.timeline as unknown as { source?: Element | null; axis?: string } | null;
                        if (tl?.source && tl.axis === "block" && tl.source !== document.scrollingElement)
                            out.push(`멈춘 타임라인 ${tag((a.effect as KeyframeEffect | null)?.target)} → ${tag(tl.source)}`);
                        // CSSTransition(.pin 이 내려오는 전환)은 스크롤 연출이 아니라 CSSAnimation 만 본다
                        const target = (a.effect as KeyframeEffect | null)?.target;
                        if (a instanceof CSSAnimation && target?.matches(".os, main, .dp, section.hero, header.nav, .pin, .sect, .buy, .dock, .rv-h, section#site"))
                            out.push(`틀에 걸린 연출 ${tag(target)} ${a.animationName}`);
                    }
                    for (const el of document.querySelectorAll<HTMLElement>(".os :is(.book, .book-pill, .ct):not(:disabled)")) {
                        const r = el.getBoundingClientRect();
                        if (!r.height || r.bottom < 0 || r.top > innerHeight) continue;
                        for (let n: HTMLElement | null = el; n; n = n.parentElement)
                            if (parseFloat(getComputedStyle(n).opacity) < 0.999) {
                                out.push(`흐린 버튼 ${tag(el)} (조상 ${tag(n)})`);
                                break;
                            }
                    }
                }
                scrollTo(0, 0);
                await frame();
                // 연출을 끈 자리와 비교 (LCP 사진·h1 과 첫 화면 카드가 첫 화면에서 밀리거나 흐려지면 안 된다)
                const firsts = [...document.querySelectorAll(
                    ".os .hero .hero-img, .os .hero h1, .os .dp .buy :is(.facts > div, .pure), .os .dp.faq :is(.quick, .chips), " +
                    ".os .dp.reviews :is(.tabs, .rv-h > .sh), .os .dp.food .hello :is(.hi, .perks li), .os .dp.manage :is(.look-w, .det-w) > .card",
                )].filter((el) => el.getClientRects().length);
                const before = firsts.map((el) => [el.getBoundingClientRect().top, getComputedStyle(el).opacity] as const);
                document.getAnimations().forEach((a) => a.cancel());
                firsts.forEach((el, i) => {
                    if (Math.abs(el.getBoundingClientRect().top - before[i][0]) > 0.5 || getComputedStyle(el).opacity !== before[i][1])
                        out.push(`첫 화면이 움직임 ${tag(el)}`);
                });
                return [...new Set(out)];
            });
            all.push(...bad.map((b) => `@${width}px ${b}`));
        }
        expect(all, route).toEqual([]);
    });
}
