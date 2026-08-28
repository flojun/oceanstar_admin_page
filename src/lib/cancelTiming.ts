import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';

/**
 * 취소 요청 시점 표시용. 하와이(UTC-10, 서머타임 없음) 기준.
 *
 * 예약 후 24시간 이내에 들어온 취소 요청은 사정에 따라 환불해줘야 할 수
 * 있다. 규정을 강제하지는 않고, 관리자가 판단할 수 있게 보여주기만 한다.
 */
export const HAWAII_TZ = 'Pacific/Honolulu';

export function formatHawaii(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return formatInTimeZone(d, HAWAII_TZ, 'M/d(EEE) HH:mm', { locale: ko });
}

export interface CancelTiming {
    bookedAt: string | null;      // 예약 시각 (하와이)
    requestedAt: string | null;   // 취소 요청 시각 (하와이)
    hoursAfterBooking: number | null;
    withinGracePeriod: boolean;   // 예약 후 24시간 이내
    label: string;                // 화면에 그대로 쓸 한 줄
}

export function cancelTiming(
    createdAt: string | null | undefined,
    cancelRequestedAt: string | null | undefined,
): CancelTiming {
    const bookedAt = formatHawaii(createdAt);
    const requestedAt = formatHawaii(cancelRequestedAt);

    if (!requestedAt || !createdAt) {
        return { bookedAt, requestedAt, hoursAfterBooking: null, withinGracePeriod: false, label: '취소요청 기록 없음' };
    }

    const hours = (new Date(cancelRequestedAt!).getTime() - new Date(createdAt).getTime()) / 3_600_000;
    const rounded = Math.max(0, Math.round(hours));
    const elapsed = rounded < 48 ? `예약 ${rounded}시간 후` : `예약 ${Math.round(rounded / 24)}일 후`;

    return {
        bookedAt,
        requestedAt,
        hoursAfterBooking: rounded,
        withinGracePeriod: hours <= 24,
        label: `취소요청 ${requestedAt} 하와이 · ${elapsed}`,
    };
}
