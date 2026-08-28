/**
 * 수동 캡처 시각 계산.
 *
 * 규칙: 투어 전날 하와이 20:00 에 캡처한다. 그 시각이 이미 지났으면
 * (당일/전날 예약) 오늘 하와이 20:00. 단 승인 만료 전이어야 한다.
 *
 * 만료 시각은 추측하지 않는다. Stripe charge 의
 * payment_method_details.card.capture_before 가 정확한 값을 준다. 카드
 * 브랜드/거래 유형에 따라 7일일 수도 4일 18시간일 수도 있어서 "6일"로
 * 못 박으면 늦는 경우가 생긴다. 그 값이 없는 결제수단만 승인+6일로 본다.
 */

const HAWAII_UTC_OFFSET_HOURS = 10; // UTC-10, 서머타임 없음
const CAPTURE_HOUR_HST = 20;        // 하와이 저녁 8시
const EXPIRY_MARGIN_MS = 12 * 60 * 60 * 1000;
const FALLBACK_HOLD_DAYS = 6;       // capture_before 가 없는 결제수단용

/** 하와이 기준 'YYYY-MM-DD' 날짜의 20:00 을 UTC Date 로. */
function hawaiiEveningUtc(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, CAPTURE_HOUR_HST + HAWAII_UTC_OFFSET_HOURS, 0, 0, 0));
}

/** UTC 시각을 하와이 기준 'YYYY-MM-DD' 로. */
export function hawaiiDateStr(at: Date): string {
    const shifted = new Date(at.getTime() - HAWAII_UTC_OFFSET_HOURS * 3600_000);
    return shifted.toISOString().slice(0, 10);
}

function addDaysToDateStr(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + days));
    return t.toISOString().slice(0, 10);
}

export interface CaptureDueInput {
    tourDate: string;          // 'YYYY-MM-DD'
    authorizedAt: Date;        // 승인 시각(예약행 created_at)
    captureBefore?: Date | null; // Stripe 가 알려준 승인 만료 시각
    now: Date;
}

/** 이 결제를 캡처해야 하는 시각(UTC). */
export function captureDueAt({ tourDate, authorizedAt, captureBefore, now }: CaptureDueInput): Date {
    const expiry = captureBefore
        ? captureBefore.getTime()
        : authorizedAt.getTime() + FALLBACK_HOLD_DAYS * 86_400_000;
    const deadline = expiry - EXPIRY_MARGIN_MS;

    const dayBeforeTour = hawaiiEveningUtc(addDaysToDateStr(tourDate, -1)).getTime();

    let due = Math.min(dayBeforeTour, deadline);

    // 이미 지난 시각이면(당일/전날 예약, 또는 과거 투어) 오늘 하와이 20:00.
    if (due <= now.getTime()) {
        due = hawaiiEveningUtc(hawaiiDateStr(now)).getTime();
    }

    // 만료가 코앞이면 오늘 저녁까지 못 기다린다. 마감이 우선.
    return new Date(Math.min(due, deadline));
}

/** 지금 캡처해야 하는가. */
export function isCaptureDue(input: CaptureDueInput): boolean {
    return input.now.getTime() >= captureDueAt(input).getTime();
}
