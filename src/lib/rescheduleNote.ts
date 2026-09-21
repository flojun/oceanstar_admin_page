/**
 * 예약 note 에 붙이는 날짜변경 표식. 두 가지가 있고 **방향이 반대**다.
 *
 *  [변경요청] <NewDate:…> <NewPickup:…>   손님이 낸 요청. 아직 안 옮겼다. 행은 **옛 날짜**.
 *                                          (`src/app/api/reschedule/route.ts` 가 붙인다)
 *  [변경반영] <OldDate:…> <OldPickup:…>   OTA 가 이미 바꿨다. 행은 **새 날짜**, 옛 날짜를 여기 적어 둔다.
 *                                          (`src/app/api/cron/check-ota-emails/route.ts` 가 붙인다)
 *
 * 두 경우 모두 상태는 '변경요청' 이고 변경요청 화면
 * (`src/components/reservations/RescheduleRequestsView.tsx`)이 한 목록으로 보여준다.
 * 승인(`src/app/api/admin/approve-reschedule/route.ts`)은 표식을 지우고 '예약확정' 으로 닫는다.
 */
const REQUESTED = /\[변경요청\] <NewDate:(.*?)> <NewPickup:(.*?)>/;
const APPLIED = /\[변경반영\] <OldDate:(.*?)> <OldPickup:(.*?)>/;

/** 표식이 쌓이면 옛 것이 먼저 걸려 지난 날짜를 보여준다. 항상 지우고 새로 붙인다. */
export function stripRescheduleMarkers(note: string | null): string {
    return (note || '')
        .replace(new RegExp(REQUESTED.source, 'g'), '')
        .replace(new RegExp(APPLIED.source, 'g'), '')
        .trim();
}

/** OTA 가 이미 바꾼 경우. 행의 tour_date 는 새 날짜로 올리고, 여기엔 **바뀌기 전** 값을 남긴다. */
export function withAppliedDateMarker(note: string | null, oldDate: string, oldPickup: string): string {
    return `${stripRescheduleMarkers(note)}\n\n[변경반영] <OldDate:${oldDate}> <OldPickup:${oldPickup}>`.trim();
}

/**
 * 변경요청 화면이 쓸 "무엇에서 무엇으로" 한 쌍.
 * 어느 표식이냐에 따라 행의 tour_date 가 출발점이기도 하고 도착점이기도 하다.
 */
export type RescheduleChange = {
    fromDate: string;
    fromPickup: string;
    toDate: string;
    toPickup: string;
    applied: boolean;    // true = 이미 반영됨(OTA), false = 승인해야 옮겨짐(손님 요청)
};

export function readRescheduleChange(
    note: string | null,
    currentDate: string | null,
    currentPickup: string | null,
): RescheduleChange {
    const applied = (note || '').match(APPLIED);
    if (applied) {
        // 행은 이미 새 날짜다. 옛 값은 표식에서 꺼낸다.
        return {
            fromDate: applied[1].trim(),
            fromPickup: applied[2].trim(),
            toDate: currentDate || '',
            toPickup: currentPickup || '',
            applied: true,
        };
    }

    const requested = (note || '').match(REQUESTED);
    return {
        fromDate: currentDate || '',
        fromPickup: currentPickup || '',
        toDate: requested ? requested[1].trim() : '',
        toPickup: requested ? requested[2].trim() : '',
        applied: false,
    };
}
