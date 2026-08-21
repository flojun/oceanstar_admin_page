import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { supabaseServer } from './supabaseServer';

const TIMEZONE = 'Pacific/Honolulu';

/**
 * Returns the dynamic receipt date string in Hawaii (YYYY-MM-DD).
 * Default rule: If time >= 19:00, it's tomorrow.
 * Exception rule: If time < 19:00, but there's already a reservation created today
 * with receipt_date == tomorrow, then it returns tomorrow.
 */
export async function getDynamicReceiptDateStr(): Promise<string> {
    const now = new Date();
    const hawaiiTime = toZonedTime(now, TIMEZONE);
    
    const todayStr = format(hawaiiTime, "yyyy-MM-dd");
    
    const tomorrow = new Date(hawaiiTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

    if (hawaiiTime.getHours() >= 19) {
        return tomorrowStr;
    }

    // Calculate start of today in Hawaii time, expressed as UTC ISO string
    // Hawaii is UTC-10, so 00:00 in Hawaii is 10:00 UTC.
    const startOfTodayUTC = new Date(Date.UTC(
        hawaiiTime.getFullYear(), 
        hawaiiTime.getMonth(), 
        hawaiiTime.getDate(), 
        10, 0, 0
    ));

    const { data, error } = await supabaseServer
        .from('reservations')
        .select('id')
        .gte('created_at', startOfTodayUTC.toISOString())
        .eq('receipt_date', tomorrowStr)
        .limit(1);

    if (data && data.length > 0) {
        // Admin already started tomorrow's list early!
        return tomorrowStr;
    }

    return todayStr;
}
