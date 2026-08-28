/**
 * Stripe 금액 변환. 앱 전체에서 유일하게 통화 배율을 아는 곳이다.
 *
 * 이 파일 밖에서 금액에 * 100 을 직접 쓰지 말 것. KRW는 소수점이 없는
 * 통화라 배율이 1이고, 100을 곱하면 100배 환불 사고가 난다.
 */

// Stripe zero-decimal 통화 중 이 서비스가 다루는 것만.
const ZERO_DECIMAL = new Set(['krw', 'jpy']);

export function minorUnitFactor(currency: string): number {
    return ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100;
}

/** 사람이 보는 금액("180.50", "180000") -> Stripe 최소 단위 정수 */
export function toMinor(amount: number, currency: string): number {
    const minor = Math.round(amount * minorUnitFactor(currency));
    if (!Number.isFinite(minor) || !Number.isSafeInteger(minor) || minor < 0) {
        throw new Error(`잘못된 금액: ${amount} ${currency}`);
    }
    return minor;
}

/** Stripe 최소 단위 정수 -> 사람이 보는 금액 */
export function fromMinor(minor: number, currency: string): number {
    return minor / minorUnitFactor(currency);
}
