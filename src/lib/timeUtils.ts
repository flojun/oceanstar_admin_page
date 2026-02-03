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
