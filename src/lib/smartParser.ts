import { SOURCE_MAPPING } from "@/types/reservation";

/**
 * Parses and formats date string to YYYY-MM-DD (2026 fixed year)
 * Input examples: "1/30", "1.30", "01/30"
 */
export const formatDate = (input: string): string => {
    if (!input) return "";
    const match = input.match(/^(\d{1,2})[/. ](\d{1,2})$/);
    if (match) {
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        return `2026-${month}-${day}`;
    }
    return input;
};

/**
 * Applies smart transformations to reservation fields.
 * - Date parsing
 * - Source mapping (m -> MyRealTrip)
 * - Pax/Option units (1 -> 1명, 1 -> 1부)
 */
// Use any to allow flexible property access without strict type definition locally
export const smartParseRow = (row: any): any => {
    const newRow = { ...row };

    // 1. Date Parsing
    if (typeof newRow.receipt_date === 'string') {
        newRow.receipt_date = formatDate(newRow.receipt_date) as any;
    }
    if (typeof newRow.tour_date === 'string') {
        newRow.tour_date = formatDate(newRow.tour_date) as any;
    }

    // 2. Source Mapping - Abbreviated for mobile readability
    if (newRow.source && typeof newRow.source === 'string') {
        const input = newRow.source.trim();
        const lower = input.toLowerCase();

        // Priority Mappings (Korean Keyboard Mismatches) - Now abbreviated
        if (lower === 'm' || input === 'ㅡ') newRow.source = 'M';
        else if (lower === 'z' || input === 'ㅋ') newRow.source = 'Z';
        else if (lower === 't' || input === 'ㅅ') newRow.source = 'T';
        else if (lower === 'w' || input === 'ㅈ') newRow.source = 'W';
        else if (lower === 'k' || input === 'ㅏ') newRow.source = 'KTB';
        else if (lower === 'v' || input === 'ㅍ') newRow.source = 'Viator';
        // Fallback to existing map or keep original if not found
        else if (SOURCE_MAPPING[lower]) {
            // Convert full names to abbreviations
            const fullName = SOURCE_MAPPING[lower];
            if (fullName === 'MyRealTrip') newRow.source = 'M';
            else if (fullName === 'ZoomZoom') newRow.source = 'Z';
            else if (fullName === 'Triple') newRow.source = 'T';
            else if (fullName === 'Waug') newRow.source = 'W';
            else if (fullName === 'KTB') newRow.source = 'KTB';
            else newRow.source = fullName;
        }
    }

    // 2.5 Pickup Location Uppercase
    if (newRow.pickup_location && typeof newRow.pickup_location === 'string') {
        newRow.pickup_location = newRow.pickup_location.toUpperCase();
    }

    // 3. Pax Suffix (Check if it's just a number)
    if (newRow.pax && typeof newRow.pax === 'string' && /^\d+$/.test(newRow.pax)) {
        newRow.pax = `${newRow.pax}명` as any;
    }

    // 4. Option Suffix (Check if it's just a number)
    if (newRow.option && typeof newRow.option === 'string' && /^\d+$/.test(newRow.option)) {
        newRow.option = `${newRow.option}부` as any;
    }

    return newRow;
};
