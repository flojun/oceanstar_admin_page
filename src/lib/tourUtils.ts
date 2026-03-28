/**
 * 오션스타 동적 투어 시스템 - 공통 유틸리티
 * 
 * 모든 관리자/고객/API 화면에서 사용하는 단일 매칭 함수.
 * 과거 예약 데이터('1부','2부','3부')와 새로운 동적 시스템 간의 하위 호환성을 보장.
 */

// ============================================================
// Types
// ============================================================

export interface TourSetting {
    tour_id: string;
    name: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    adult_price_usd?: number;
    child_price_usd?: number;
    adult_price_krw?: number;
    child_price_krw?: number;
    max_capacity: number;
    blocked_days?: number[];
    is_active?: boolean;
    is_flat_rate?: boolean;
    vessel_name?: string;
    display_order?: number;
    is_combined?: boolean;
}

export interface ResolvedOption {
    tourSetting: TourSetting | null;
    group: string;        // Display group name (e.g. '1부', '프라이빗 차터', '기타')
    vessel: string;       // Vessel name
    capacity: number;     // Max capacity for overbooking checks
    isFlatRate: boolean;  // Whether this is a flat-rate (private charter) option
}

// ============================================================
// Legacy Option Map
// ============================================================

/**
 * Maps legacy option labels stored in reservations.option
 * to their corresponding tour_id in tour_settings.
 * This ensures backward compatibility with existing reservation data.
 */
const LEGACY_OPTION_MAP: Record<string, string> = {
    '1부': 'morning1',
    '2부': 'morning2',
    '3부': 'sunset',
    '선셋': 'sunset',
    '거북이 1부': 'morning1',
    '거북이 2부': 'morning2',
    '거북이 3부': 'sunset',
    '1부 거북이 스노클링': 'morning1',
    '2부 거북이 스노클링': 'morning2',
    '선셋 거북이 스노클링': 'sunset',
};

// ============================================================
// Core Matching Function
// ============================================================

/**
 * Resolves a reservation's option label to its corresponding TourSetting.
 * Uses a 4-step fallback system:
 * 
 * 1. Exact name match against tour_settings[].name
 * 2. Legacy map lookup (e.g. '1부' → 'morning1')
 * 3. Partial string inclusion (e.g. '1부 거북이' contains '1부')
 * 4. Default fallback → '기타' group
 */
export function resolveOptionToTourSetting(
    optionLabel: string,
    tourSettings: TourSetting[]
): ResolvedOption {
    const DEFAULT_RESULT: ResolvedOption = {
        tourSetting: null,
        group: '기타',
        vessel: '오션스타',
        capacity: 45,
        isFlatRate: false,
    };

    if (!optionLabel || !tourSettings || tourSettings.length === 0) {
        return DEFAULT_RESULT;
    }

    const trimmedLabel = optionLabel.trim();
    const lowerLabel = trimmedLabel.toLowerCase();

    // Step 1: Exact name match
    const exactMatch = tourSettings.find(
        ts => ts.name === trimmedLabel || ts.tour_id === trimmedLabel
    );
    if (exactMatch) {
        return buildResult(exactMatch);
    }

    // Step 2: Legacy map lookup
    const legacyTourId = LEGACY_OPTION_MAP[trimmedLabel];
    if (legacyTourId) {
        const legacyMatch = tourSettings.find(ts => ts.tour_id === legacyTourId);
        if (legacyMatch) {
            return buildResult(legacyMatch);
        }
    }

    // Step 3: Partial inclusion match
    // Check if the option label CONTAINS any tour_settings name, or vice versa
    const partialMatch = tourSettings.find(ts => {
        const tsNameLower = ts.name.toLowerCase();
        return lowerLabel.includes(tsNameLower) || tsNameLower.includes(lowerLabel);
    });
    if (partialMatch) {
        return buildResult(partialMatch);
    }

    // Step 4: Default fallback
    return DEFAULT_RESULT;
}

function buildResult(ts: TourSetting): ResolvedOption {
    return {
        tourSetting: ts,
        group: ts.name,
        vessel: ts.vessel_name || '오션스타',
        capacity: ts.max_capacity || 45,
        isFlatRate: ts.is_flat_rate || false,
    };
}

// ============================================================
// Helper: Get option group key (simplified version for grouping)
// ============================================================

/**
 * Returns a grouping key for a reservation option label.
 * Used by calendar, list views, and filter tabs.
 * Falls back gracefully for legacy data.
 */
export function getOptionGroupKey(
    optionLabel: string,
    tourSettings: TourSetting[]
): string {
    if (!optionLabel) return '기타';

    const resolved = resolveOptionToTourSetting(optionLabel, tourSettings);
    return resolved.group;
}

// ============================================================
// Helper: Get capacity limit for an option
// ============================================================

export function getCapacityForOption(
    optionLabel: string,
    tourSettings: TourSetting[]
): number {
    const resolved = resolveOptionToTourSetting(optionLabel, tourSettings);
    return resolved.capacity;
}

// ============================================================
// Helper: Get vessel for an option
// ============================================================

export function getVesselForOption(
    optionLabel: string,
    tourSettings: TourSetting[]
): string {
    const resolved = resolveOptionToTourSetting(optionLabel, tourSettings);
    return resolved.vessel;
}

// ============================================================
// Helper: Get dynamic display order from tour settings
// ============================================================

/**
 * Returns the ordered list of tour option names for display
 * (tabs, calendar bars, etc.), excluding non-tour special groups.
 */
export function getDisplayOrder(tourSettings: TourSetting[]): string[] {
    const sorted = [...tourSettings]
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const names = sorted.map(ts => ts.name);

    // Append standard non-tour groups that may exist in legacy data
    return [...names, '패러 및 제트', '패러', '제트', '기타'];
}

// ============================================================
// Helper: Get dynamic filter tabs
// ============================================================

/**
 * Returns tabs for the filter bar (includes '전체' as first tab).
 */
export function getFilterTabs(tourSettings: TourSetting[]): string[] {
    return ['전체', ...getDisplayOrder(tourSettings)];
}

// ============================================================
// Helper: Traffic light color for calendar
// ============================================================

export function getTrafficLightStatus(
    group: string,
    count: number,
    tourSettings: TourSetting[]
): { color: string; percent: number } {
    const resolved = resolveOptionToTourSetting(group, tourSettings);
    const max = resolved.capacity;

    // Default color for non-matched groups
    let color = 'from-pink-400 to-pink-600 border-pink-300';
    let percent = 100;

    if (resolved.tourSetting) {
        if (count > max) {
            color = 'from-red-500 to-red-700 border-red-400';     // 초과
        } else if (count >= max - 2) {
            color = 'from-blue-500 to-blue-700 border-blue-400';   // 마감 임박
        } else if (count >= 10) {
            color = 'from-emerald-400 to-emerald-600 border-emerald-300'; // 10+
        } else {
            color = 'from-yellow-400 to-yellow-600 border-yellow-300';    // 1~9
        }
        percent = Math.min(100, max > 0 ? (count / max) * 100 : 0);
    }

    return { color, percent };
}

// ============================================================
// Helper: Vessel badge color
// ============================================================

export function getVesselBadgeColor(vesselName: string): string {
    switch (vesselName) {
        case '오션스타': return 'bg-blue-100 text-blue-700';
        default: return 'bg-purple-100 text-purple-700';
    }
}

// ============================================================
// Helper: Dynamic option color for calendar mobile labels
// ============================================================

export function getShortLabel(name: string): string {
    if (name.length <= 3) return name + ':';
    return name.substring(0, 3) + ':';
}
