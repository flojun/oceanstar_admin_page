import { expect, test } from "@playwright/test";
import { env } from "../support/env";

/**
 * API 계약 스모크. 전부 읽기 또는 "없는 데이터로 보내 거절되는지" 확인하는 음성 테스트라
 * 운영 URL 에서도 아무것도 쓰지 않는다.
 *
 * 리뉴얼 PRD §10: settings/pickup/availability/reviews/google-reviews/stripe/cancel/reschedule 은 "변경 없음".
 * 이 파일이 그 약속의 검증이다.
 */
const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();
const json = { "content-type": "application/json" };

test.describe("공개 조회 API", () => {
    test("GET /api/settings — 투어 설정과 차단일", async ({ request }) => {
        const res = await request.get("/api/settings");
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.blockedDates)).toBe(true);
        expect(body.tourSettings.length).toBeGreaterThan(0);
        for (const t of body.tourSettings) for (const k of ["tour_id", "name", "max_capacity", "adult_price_usd", "adult_price_krw"]) expect(t, `tour_settings.${k}`).toHaveProperty(k);
    });

    test("GET /api/pickup — 픽업 장소와 1/2/3부 시간", async ({ request }) => {
        const res = await request.get("/api/pickup");
        expect(res.status()).toBe(200);
        const list = await res.json();
        expect(list.length).toBeGreaterThan(0);
        for (const p of list) {
            expect(p.name).toBeTruthy();
            expect(String(p.time_3 ?? "")).toMatch(/^(\d\d:\d\d(:\d\d)?)?$/);
        }
        // DB 장애 시 하드코딩 목록(id '1'~'12')으로 200 을 돌려주므로, 그 상태인지 따로 확인
        expect(list.every((p: { id: string }) => /^\d{1,2}$/.test(String(p.id))), "DB 대신 코드 내 기본 목록이 나옴 (DB 연결 확인)").toBe(false);
    });

    test("GET /api/availability — 정상/잘못된 요청", async ({ request }) => {
        const ok = await request.get(`/api/availability?month=${nextMonth}&option=morning1`);
        expect(ok.status()).toBe(200);
        const body = await ok.json();
        expect(body.success).toBe(true);
        expect(body.maxCapacity).toBeGreaterThan(0);
        expect((await request.get("/api/availability")).status()).toBe(400);
        expect((await request.get(`/api/availability?month=${nextMonth}&option=__nope__`)).status()).toBe(400);
    });

    test("GET /api/reviews, /api/google-reviews", async ({ request }) => {
        for (const path of ["/api/reviews", "/api/google-reviews"]) {
            const res = await request.get(path);
            expect(res.status(), path).toBe(200);
            const body = await res.json();
            expect(body.success, path).toBe(true);
            expect(Array.isArray(body.reviews), path).toBe(true);
        }
    });

    test("GET /api/exchange-rate — 환율이 정상 범위", async ({ request }) => {
        const res = await request.get("/api/exchange-rate");
        expect(res.status()).toBe(200);
        const { rate } = await res.json();
        expect(rate).toBeGreaterThan(900);
        expect(rate).toBeLessThan(3000);
    });
});

test.describe("고객 쓰기 API — 거절 경로 (아무것도 쓰지 않음)", () => {
    test("예약 조회: 빈 요청 400, 없는 예약 404", async ({ request }) => {
        expect((await request.post("/api/verify-booking", { headers: json, data: {} })).status()).toBe(400);
        expect((await request.post("/api/verify-booking", { headers: json, data: { order_id: "ZZZZZZ", booker_email: "nobody@example.com" } })).status()).toBe(404);
    });

    test("예약 상세: 파라미터 없음 400, 없는 예약 404", async ({ request }) => {
        expect((await request.get("/api/reservation-detail")).status()).toBe(400);
        expect((await request.get("/api/reservation-detail?order_id=ZZZZZZ")).status()).toBe(404);
    });

    test("취소·일정변경: 없는 예약은 404", async ({ request }) => {
        expect((await request.post("/api/cancel", { headers: json, data: {} })).status()).toBe(400);
        expect((await request.post("/api/cancel", { headers: json, data: { order_id: "ZZZZZZ", booker_name: "nobody" } })).status()).toBe(404);
        expect((await request.post("/api/reschedule", { headers: json, data: {} })).status()).toBe(400);
        expect((await request.post("/api/reschedule", { headers: json, data: { order_id: "ZZZZZZ", booker_email: "x@example.com", new_date: "2030-01-01", new_pickup: "HM" } })).status()).toBe(404);
    });

    test("리뷰 등록: 빈 요청 400, 없는 예약 404", async ({ request }) => {
        expect((await request.post("/api/reviews", { multipart: {} })).status()).toBe(400);
        expect((await request.post("/api/reviews", { multipart: { order_id: "ZZZZZZ", author_name: "qa", content: "qa", rating: "5" } })).status()).toBe(404);
    });

    test("Stripe: 잘못된 통화는 세션을 만들지 않고 400", async ({ request }) => {
        const res = await request.post("/api/stripe/checkout", { headers: json, data: { selectedTour: "morning1", currency: "EUR", adultCount: 1, childCount: 0 } });
        expect(res.status()).toBe(400);
        expect((await request.post("/api/stripe/verify-session", { headers: json, data: {} })).status()).toBe(400);
    });

    test("Stripe 웹훅: 서명 없으면 400 (500 이면 STRIPE_WEBHOOK_SECRET 누락)", async ({ request }) => {
        const res = await request.post("/api/stripe/webhook", { data: "{}" });
        expect(res.status(), "500 = 배포 환경변수 누락").toBe(400);
    });
});

test.describe("권한이 필요한 API — 로그인 없이 막히는가", () => {
    for (const path of ["refund", "approve-reschedule", "pickup", "invoice-prices"]) {
        test(`POST /api/admin/${path} → 401`, async ({ request }) => {
            expect((await request.post(`/api/admin/${path}`, { headers: json, data: {} })).status()).toBe(401);
        });
    }
    test("GET /api/agency/reservations → 401", async ({ request }) => {
        expect((await request.get("/api/agency/reservations")).status()).toBe(401);
    });
    test("크론: 시크릿 없이 호출하면 401", async ({ request }) => {
        // CRON_SECRET 이 배포 환경에 없으면 이 요청이 실제로 크론을 실행한다.
        // 그래서 부작용이 가장 작은 환율 크론 대신, 시크릿 존재를 먼저 확인할 수 있을 때만 돌린다.
        test.skip(!env.cronSecret, "QA_CRON_SECRET 을 넣으면 (= 배포에 CRON_SECRET 이 있다는 확인) 실행");
        expect((await request.get("/api/cron/check-myrealtrip-emails")).status()).toBe(401);
        expect((await request.get("/api/cron/check-myrealtrip-emails", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
    });
    test("알려진 결함: GET /api/admin/invoice-prices 는 로그인 없이 열린다", async ({ request }) => {
        test.info().annotations.push({ type: "known-defect", description: "여행사 단가표가 공개됨 — docs/qa/regression-test-plan.md §9 참고" });
        test.fail(); // 고쳐지면 이 테스트가 "예상 밖 통과"로 알려준다
        expect((await request.get("/api/admin/invoice-prices")).status()).toBe(401);
    });
});
