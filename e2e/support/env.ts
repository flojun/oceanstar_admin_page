/**
 * 회귀 검사 환경 변수. 값은 .env.qa.local 이나 CI 시크릿으로 넣는다 (커밋 금지).
 */
const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3000";

export const env = {
    baseURL,
    /** 운영 도메인이면 true — 이때는 어떤 쓰기도 허용하지 않는다 */
    isProduction: /(^|\.)oceanstarhi\.com/.test(new URL(baseURL).hostname),
    /** 스테이징/프리뷰에서만 1: 차단했던 쓰기 요청(POST/PATCH/DELETE)을 실제로 보낸다 */
    allowMutations: process.env.QA_ALLOW_MUTATIONS === "1",
    /** 리뉴얼 이후 기대 동작(301, /booking 페이지 등)을 검사 */
    expectRenewal: process.env.QA_EXPECT_RENEWAL === "1",
    /** 어드민 로그인 화면의 "아이디" 칸은 이메일 전체를 받는다 */
    admin: { email: process.env.QA_ADMIN_EMAIL ?? "", password: process.env.QA_ADMIN_PASSWORD ?? "" },
    agency: { id: process.env.QA_AGENCY_ID ?? "", password: process.env.QA_AGENCY_PASSWORD ?? "" },
    /** 조회 전용 테스트 예약 (내 예약 관리 흐름) — 운영에서 쓰려면 실제 존재하는 테스트 예약이어야 함 */
    booking: { orderId: process.env.QA_BOOKING_ORDER_ID ?? "", email: process.env.QA_BOOKING_EMAIL ?? "" },
    cronSecret: process.env.QA_CRON_SECRET ?? "",
    /** 버튼 전수 클릭 시 페이지당 최대 클릭 수 / 모달 안쪽까지 들어갈 깊이 */
    sweepLimit: Number(process.env.QA_SWEEP_LIMIT ?? 120),
    sweepDepth: Number(process.env.QA_SWEEP_DEPTH ?? 2),
    /** 특정 버튼만 다시 검사: QA_SWEEP_ONLY="예약하기|리뷰" */
    sweepOnly: process.env.QA_SWEEP_ONLY ? new RegExp(process.env.QA_SWEEP_ONLY) : undefined,
};

if (env.isProduction && env.allowMutations) {
    throw new Error("QA_ALLOW_MUTATIONS=1 은 운영 도메인에서 쓸 수 없습니다. 프리뷰/스테이징 URL 을 쓰세요.");
}
