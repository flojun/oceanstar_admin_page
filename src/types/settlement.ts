// Settlement system type definitions

// ---- Platform Config ----

export type PlatformKey = 'myRealTrip' | 'zoomZoom' | 'triple' | 'waug';

export interface PlatformConfig {
    key: PlatformKey;
    label: string;
    sourceCode: string;   // DB source column value
    color: string;
    enabled: boolean;     // parser implemented?
}

export const PLATFORMS: Record<PlatformKey, PlatformConfig> = {
    myRealTrip: { key: 'myRealTrip', label: '마이리얼트립', sourceCode: 'M', color: 'blue', enabled: true },
    zoomZoom: { key: 'zoomZoom', label: '줌줌투어', sourceCode: 'Z', color: 'green', enabled: false },
    triple: { key: 'triple', label: '트리플', sourceCode: 'T', color: 'purple', enabled: false },
    waug: { key: 'waug', label: '와그', sourceCode: 'W', color: 'orange', enabled: false },
};

export const PLATFORM_KEYS: PlatformKey[] = ['myRealTrip', 'zoomZoom', 'triple', 'waug'];

// ---- Excel Parsed Row ----

export interface SettlementRow {
    reservationId: string;
    productName: string;
    tourDate: string;        // YYYY-MM-DD
    pax: number;
    adultCount: number;
    childCount: number;
    platformAmount: number;  // Amount from platform Excel (KRW)
    customerName: string;
    option?: string;        // Extracted option (e.g. "09:00 (1부)") - new
    status: string;           // "예약확정", "취소" etc.
    receiptDate?: string;     // Extracted from Reservation ID if available (YYYY-MM-DD)
    rawData: Record<string, unknown>;
}

// ---- DB Virtual Merge ----

export interface MergedReservation {
    groupKey: string;            // "name|receipt_date"
    name: string;
    receiptDate: string;
    tourDate: string;
    allTourDates?: string[]; // All tour dates in this group (sorted)
    mergedOption: string;        // "1부 + 패러"
    originalOptions: string[];   // ["1부", "패러"]
    totalPax: number;
    adultCount: number;
    childCount: number;
    reservationIds: string[];    // all DB ids in this group
    source: string;
    status: string;
    contact: string;
    note: string;
    pickupLocation: string;
    settlementStatus?: 'completed' | 'excluded' | null;
}

// ---- Product Price ----

export interface ProductPrice {
    id: string;
    product_name: string;
    match_keywords: string;   // comma-separated
    adult_price: number;
    child_price: number;
    tier_group: string;       // "Tier 1", "Tier 2", "Tier 3"
    is_active: boolean;
    created_at?: string;
}

// ---- Match Result ----

export type MatchStatus = 'normal' | 'warning' | 'error' | 'partial_refund' | 'cancelled' | 'completed' | 'excluded';

// ---- Excel Grouping ----
export interface ExcelGroup {
    groupId: string;
    customerName: string;
    tourDate: string;
    receiptDate?: string; // Added receiptDate
    option?: string;      // Added option (for simple display)
    totalAmount: number;
    totalPax: number;
    adultCount: number;
    childCount: number;
    rows: SettlementRow[];
    isPartialRefund: boolean;
    isFullCancellation: boolean;
}

export interface MatchResult {
    status: MatchStatus;
    statusLabel: string;          // "정상" / "확인필요" / "오류" / "부분환불" / "취소"
    classifiedProductName: string; // Classifier가 판별한 상품명
    excelGroup: ExcelGroup | null;
    dbGroup: MergedReservation | null;
    matchedProduct: ProductPrice | null;
    expectedAmount: number;
    actualAmount: number;
    amountDiff: number;
    diffPercent: number;
    notes: string[];
}

// ---- Summary ----

export interface SettlementSummary {
    totalExcelRows: number;
    totalDbGroups: number;
    normal: number;
    warning: number;
    error: number;
    partialRefund: number;
    cancelled: number;
    completed: number;
    excluded: number;
    totalExpected: number;
    totalActual: number;
    totalDiff: number;
}
// ---- Classifier Result ----
export interface ClassifierResult {
    productName: string;
    matchedProduct: ProductPrice | null;
    isAnomaly: boolean;
    notes: string[];
}
