import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'Pacific/Honolulu';

/**
 * Returns today's date string in Hawaii (YYYY-MM-DD)
 */
export function getHawaiiDateStr(): string {
    const now = new Date();
    const hawaiiTime = toZonedTime(now, TIMEZONE);
    return format(hawaiiTime, "yyyy-MM-dd");
}

/**
 * Returns tomorrow's date string in Hawaii (YYYY-MM-DD)
 */
export function getHawaiiTomorrowStr(): string {
    const now = new Date();
    const hawaiiTime = toZonedTime(now, TIMEZONE);
    const tomorrow = new Date(hawaiiTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, "yyyy-MM-dd");
}

/**
 * Formats a YYYY-MM-DD date string to MM-DD-YYYY for display
 */
export function formatDateDisplay(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    try {
        // Simple string manipulation to avoid timezone issues with Date objects
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${month}-${day}-${year}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

/**
 * Returns the Korean day of the week (e.g., "(월)") from a YYYY-MM-DD string
 */
export function getKoreanDay(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const days = ["(일)", "(월)", "(화)", "(수)", "(목)", "(금)", "(토)"];
        // Create date object (split to avoid timezone offset issues)
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return days[date.getDay()];
    } catch (e) {
        return "";
    }
}

/**
 * Returns the short Korean day of the week (e.g., "월") from a YYYY-MM-DD string
 */
export function getKoreanDayShort(dateStr: string): string {
    if (!dateStr) return "";
    try {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        // Create date object (split to avoid timezone offset issues)
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return days[date.getDay()];
    } catch (e) {
        return "";
    }
}
