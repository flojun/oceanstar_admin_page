import { Reservation } from "@/types/reservation";

/**
 * 환불 금액 계산/표시. 환불 UI 세 곳이 같은 규칙을 쓰도록 여기 모은다.
 *
 * 통화 배율(센트 변환)은 여기서 다루지 않는다. 그건 money.ts 의 toMinor 가
 * 서버에서만 한다. 여기는 사람이 보는 금액 단위로만 계산한다.
 */

export const isUsd = (currency?: string | null) => currency === "USD";
export const symbolFor = (currency?: string | null) => (isUsd(currency) ? "$" : "₩");

/** 아직 환불하지 않은 잔액. */
export function remainingOf(r: Reservation): number {
    return Math.max(0, Number(r.total_price ?? 0) - Number(r.refunded_amount ?? 0));
}

/** 입력칸에 넣을 문자열. KRW 는 소수점을 쓰지 않는다. */
export function toInputValue(v: number, currency?: string | null): string {
    return isUsd(currency) ? v.toFixed(2) : String(Math.round(v));
}

/**
 * 잔액의 몇 %.
 *
 * 나머지가 생기면 고객에게 유리한 쪽(올림)으로 준다. 1원/1센트 차이로
 * 분쟁을 만들 이유가 없다. 100% 는 잔액 그대로여야 하므로 잔액에서 자른다.
 */
export function percentAmount(r: Reservation, percent: number): number {
    const remaining = remainingOf(r);
    if (percent >= 100) return remaining;
    const raw = (remaining * percent) / 100;
    const rounded = isUsd(r.currency) ? Math.ceil(raw * 100) / 100 : Math.ceil(raw);
    return Math.min(remaining, rounded);
}

/**
 * 모달을 열 때 채워둘 기본값.
 *
 * 규정 계산값(expected_refund)이 있으면 그걸 쓴다. 기상 악화나 선박 고장처럼
 * 규정과 무관하게 전액을 줘야 하는 경우는 관리자가 퍼센트 버튼이나 직접
 * 입력으로 올린다.
 */
export function defaultAmount(r: Reservation): number {
    const remaining = remainingOf(r);
    const expected = r.expected_refund == null ? null : Number(r.expected_refund);
    return expected != null && expected > 0 && expected <= remaining ? expected : remaining;
}

/**
 * 환불 사유 선택지. 나중에 사유별 통계를 보려면 문구가 일정해야 하므로
 * 자유 입력이 아니라 목록에서 고르게 한다. 목록에 없으면 "직접입력".
 */
export const REFUND_REASONS = [
    "고객 요청으로 인한 취소",
    "모객부족으로 인한 취소",
    "기상 악화로 인한 취소",
    "모객부족으로 선셋에서 이동으로 부분환불",
] as const;

export const DEFAULT_REFUND_REASON = REFUND_REASONS[0];

/** 지금 값이 목록에 있는지. 없으면 직접입력으로 본다. */
export function isPresetReason(value: string): boolean {
    return (REFUND_REASONS as readonly string[]).includes(value);
}
