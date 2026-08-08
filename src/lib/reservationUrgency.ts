import { getHawaiiDateStr, getHawaiiTomorrowStr } from './timeUtils';

/**
 * 투어 날짜가 오늘 또는 내일(하와이 시간 기준)인지 판단
 * → true이면 "긴급 예약"으로 Slack 알림 발송 대상
 */
export function isUrgentTourDate(tourDate: string | null | undefined): boolean {
    if (!tourDate) return false;
    const today = getHawaiiDateStr();
    const tomorrow = getHawaiiTomorrowStr();
    return tourDate === today || tourDate === tomorrow;
}
