/**
 * 정원 계산. 대시보드 입력 화면의 초과 경고와 같은 규칙이다:
 * 같은 날 · 같은 투어 그룹 · 같은 배의 '취소' 아닌 예약 인원을 더해 max_capacity 와 비교한다.
 * DB 조회 없이 돌아가는 순수 계산이라 cron 과 테스트에서 같이 쓴다.
 */
import { resolveOptionToTourSetting, type TourSetting } from './tourUtils.ts';

/** 이메일 크론이 정원을 넘는 신규 예약에 붙이는 상태. */
export const OVER_CAPACITY_STATUS = '정원초과';

export type CapacityCheck = { group: string; limit: number; current: number; total: number; over: boolean };

/** "3명" → 3. 못 읽으면 0. (DB 의 pax 는 전부 "N명" 모양이다) */
export function paxNumber(pax: string | number | null | undefined): number {
    if (typeof pax === 'number') return pax;
    return parseInt((pax || '').replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * 새 예약(option, pax)을 그날 이미 있는 예약(sameDay)에 더했을 때 정원을 넘는지.
 * 옵션이 투어 설정과 안 맞으면(빈 옵션·기타) 판단하지 않고 null.
 */
export function checkCapacity(
    option: string,
    pax: string | number,
    sameDay: { option: string | null; pax: string | null }[],
    settings: TourSetting[],
): CapacityCheck | null {
    const resolved = resolveOptionToTourSetting(option || '', settings);
    if (!resolved.tourSetting) return null;

    let current = 0;
    for (const r of sameDay) {
        const other = resolveOptionToTourSetting(r.option || '', settings);
        if (other.group === resolved.group && other.vessel === resolved.vessel) current += paxNumber(r.pax);
    }
    const total = current + paxNumber(pax);
    return { group: resolved.group, limit: resolved.capacity, current, total, over: total > resolved.capacity };
}
