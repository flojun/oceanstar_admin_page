/**
 * 대시보드 Overview 차트·표와 PPT 리포트가 **같은 숫자**를 쓰도록 집계는 여기 한 곳에서만 한다.
 *
 * 이 파일은 의도적으로 다른 모듈을 import 하지 않는다 —
 * `node scripts/check_dashboard_stats.ts` 로 그대로 자체검사할 수 있어야 하기 때문.
 */

// ---------------------------------------------------------------------------
// 플랫폼 정규화
// ---------------------------------------------------------------------------

/**
 * reservations.source 는 사람이 손으로 넣은 값이라 표기가 흔들린다.
 * (팜/팜투어, 탐/타미스, G/g/GY, Viator/viator, 클록/클룩 …)
 * 통계에서는 이 표로 하나의 플랫폼으로 합친다.
 *
 * DB 는 건드리지 않고 읽을 때만 정규화한다 — 예약 입력창의 약어 자동완성
 * (SOURCE_MAPPING, src/types/reservation.ts) 이 원본 표기에 묶여 있기 때문.
 */
export type PlatformCategory = 'ota' | 'agency' | 'direct';
/** 'online' = OTA + 직접유입 (여행사를 뺀 나머지 — 자사 채널 비중을 보기 위한 묶음) */
export type CategoryFilter = PlatformCategory | 'all' | 'online';

export interface Platform {
    label: string;
    category: PlatformCategory;
}

export const CATEGORY_LABEL: Record<CategoryFilter, string> = {
    all: '전체',
    ota: 'OTA',
    agency: '여행사',
    direct: '직접유입',
    online: 'OTA+직접유입',
};

export function matchesCategory(platform: PlatformCategory, filter: CategoryFilter): boolean {
    if (filter === 'all') return true;
    if (filter === 'online') return platform === 'ota' || platform === 'direct';
    return platform === filter;
}

/** 통계에서 빼는 값 (테스트 데이터 · 오타로 들어간 쓰레기 · 제외 요청) */
const EXCLUDED = new Set(['', '`', '테스트', 'lola']);

/** key 는 source 원본값을 trim 후 소문자로 바꾼 것 */
const PLATFORM_BY_SOURCE: Record<string, Platform> = {
    // ---- OTA ----
    'm': { label: '마이리얼트립', category: 'ota' },
    'g': { label: 'GetYourGuide', category: 'ota' },
    'gy': { label: 'GetYourGuide', category: 'ota' },
    'z': { label: '줌줌투어', category: 'ota' },
    't': { label: '트리플', category: 'ota' },
    'w': { label: '와그', category: 'ota' },
    '클록': { label: '클룩', category: 'ota' },
    '클룩': { label: '클룩', category: 'ota' },
    'v': { label: 'Viator', category: 'ota' },
    'viator': { label: 'Viator', category: 'ota' },
    '여기어때': { label: '여기어때', category: 'ota' },

    // ---- 직접 유입 ----
    '웹': { label: '자사 웹사이트', category: 'direct' },
    '웹사이트': { label: '자사 웹사이트', category: 'direct' },
    '웹사이트(en)': { label: '자사 웹사이트', category: 'direct' },
    '개인': { label: '개인·지인', category: 'direct' },
    '인스타': { label: '인스타그램', category: 'direct' },

    // ---- 여행사 ----
    'ktb': { label: 'KTB', category: 'agency' },
    '타미스': { label: '타미스', category: 'agency' },
    '탐': { label: '타미스', category: 'agency' },
    '팜투어': { label: '팜투어', category: 'agency' },
    '팜': { label: '팜투어', category: 'agency' },
    '한국': { label: '한국', category: 'agency' },
    '헬로': { label: '헬로', category: 'agency' },
    '헬로우': { label: '헬로', category: 'agency' },
    '로얄': { label: '로얄', category: 'agency' },
    '투어넷': { label: '투어넷', category: 'agency' },
    '메가': { label: '메가', category: 'agency' },
    '하여디': { label: '하여디', category: 'agency' },
    'no.1': { label: 'No.1', category: 'agency' },
    '드림': { label: '드림투어', category: 'agency' },
    '드림투어': { label: '드림투어', category: 'agency' },
    '새누': { label: '새누', category: 'agency' },
    '보아즈': { label: '보아즈', category: 'agency' },
    '보아스': { label: '보아즈', category: 'agency' },
    '동아': { label: '동아', category: 'agency' },
    '허니문': { label: '허니문', category: 'agency' },
};

/** null 이면 통계에서 제외. 표에 없는 값은 원본 그대로 여행사로 통과시킨다. */
export function normalizeSource(source: string | null | undefined): Platform | null {
    const raw = String(source ?? '').trim();
    const key = raw.toLowerCase();

    if (EXCLUDED.has(key)) return null;
    if (PLATFORM_BY_SOURCE[key]) return PLATFORM_BY_SOURCE[key];
    // "개인 - 권태신", "개인 (지인추천)" 처럼 뒤에 메모가 붙은 경우
    if (key.startsWith('개인')) return PLATFORM_BY_SOURCE['개인'];

    return { label: raw, category: 'agency' };
}

// ---------------------------------------------------------------------------
// 월 범위
// ---------------------------------------------------------------------------

export type DateField = 'tour_date' | 'receipt_date';

export const DATE_FIELD_LABEL: Record<DateField, string> = {
    tour_date: '여행일',
    receipt_date: '접수일',
};

export interface MonthKey {
    year: number;
    month: number;
}

/** {2026,3} -> "2026-03" */
export const monthLabel = (m: MonthKey) => `${m.year}-${String(m.month).padStart(2, '0')}`;

/** [{2025,9}, {2025,10}, ...] — 최대 10년치 */
export function monthRange(start: MonthKey, end: MonthKey): MonthKey[] {
    const months: MonthKey[] = [];
    let y = start.year;
    let m = start.month;
    const endVal = end.year * 12 + end.month;
    while (y * 12 + m <= endVal && months.length < 120) {
        months.push({ year: y, month: m });
        if (++m > 12) { m = 1; y++; }
    }
    return months;
}

// ---------------------------------------------------------------------------
// 집계
// ---------------------------------------------------------------------------

/** "3명" -> 3 */
export function parsePax(paxStr: string | null | undefined): number {
    const num = parseInt(String(paxStr ?? '').replace(/[^0-9]/g, ''));
    return isNaN(num) ? 0 : num;
}

/** Reservation 중 집계에 실제로 쓰는 필드만 (import 를 만들지 않으려고 구조 타입으로 둔다) */
export interface StatsRow {
    source?: string | null;
    status?: string | null;
    pax?: string | null;
    tour_date?: string | null;
    receipt_date?: string | null;
}

export interface Stats {
    /** ["2025-09", "2025-10", ...] */
    months: string[];
    /** 인원 누적 내림차순 */
    platforms: string[];
    /** platform -> months 와 같은 길이의 배열 */
    pax: Record<string, number[]>;
    count: Record<string, number[]>;
    totalPax: number;
    totalCount: number;
}

/** 계열이 이보다 많아지면 나머지를 "기타" 로 합친다.
 *  8 = 검증된 categorical 팔레트의 슬롯 수. 9번째 색을 만들어 쓰지 않는다. */
const MAX_SERIES = 8;

/**
 * 비중이 작아도 "기타" 로 묻지 않고 반드시 개별 계열로 남기는 플랫폼.
 * 자사 유입은 숫자가 작을 때가 오히려 봐야 할 때다 (웹사이트 예약률 비교).
 */
const ALWAYS_SHOWN = ['자사 웹사이트', '인스타그램'];

/**
 * - status "취소" 제외
 * - normalizeSource 가 null 인 행(테스트/빈값/LOLA) 제외
 * - 기준일(dateField)이 비었거나 범위 밖인 행 제외
 */
export function aggregate(
    rows: StatsRow[],
    months: MonthKey[],
    opts: { dateField: DateField; category: CategoryFilter },
): Stats {
    const labels = months.map(monthLabel);
    const indexOf = new Map(labels.map((l, i) => [l, i]));

    const pax: Record<string, number[]> = {};
    const count: Record<string, number[]> = {};
    let totalPax = 0;
    let totalCount = 0;

    for (const r of rows) {
        if (r.status === '취소') continue;

        const platform = normalizeSource(r.source);
        if (!platform) continue;
        if (!matchesCategory(platform.category, opts.category)) continue;

        const bucket = String(r[opts.dateField] ?? '').slice(0, 7); // "2026-03-14" -> "2026-03"
        const i = indexOf.get(bucket);
        if (i === undefined) continue;

        if (!pax[platform.label]) {
            pax[platform.label] = new Array(labels.length).fill(0);
            count[platform.label] = new Array(labels.length).fill(0);
        }
        const p = parsePax(r.pax);
        pax[platform.label][i] += p;
        count[platform.label][i] += 1;
        totalPax += p;
        totalCount += 1;
    }

    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    let platforms = Object.keys(pax).sort((a, b) => sum(pax[b]) - sum(pax[a]));

    if (platforms.length > MAX_SERIES) {
        // 인원 상위부터 채우되 ALWAYS_SHOWN 은 자리를 먼저 확보한다
        const kept = new Set(platforms.filter(p => ALWAYS_SHOWN.includes(p)));
        for (const p of platforms) {
            if (kept.size >= MAX_SERIES - 1) break;
            kept.add(p);
        }
        const merged = platforms.filter(p => !kept.has(p));
        platforms = platforms.filter(p => kept.has(p));
        pax['기타'] = new Array(labels.length).fill(0);
        count['기타'] = new Array(labels.length).fill(0);
        for (const key of merged) {
            for (let i = 0; i < labels.length; i++) {
                pax['기타'][i] += pax[key][i];
                count['기타'][i] += count[key][i];
            }
            delete pax[key];
            delete count[key];
        }
        platforms.push('기타');
    }

    return { months: labels, platforms, pax, count, totalPax, totalCount };
}

/** recharts 추세용: [{ month: "2025-09", 마이리얼트립: 120, ... }, ...] */
export function toChartRows(stats: Stats, metric: 'pax' | 'count') {
    return stats.months.map((month, i) => {
        const row: Record<string, string | number> = { month };
        for (const p of stats.platforms) row[p] = stats[metric][p][i];
        return row;
    });
}

export interface PlatformCell {
    platform: string;
    pax: number;
    count: number;
}

/**
 * 한 달을 잘라 플랫폼끼리 나란히 비교하는 형태.
 * [{ platform: "마이리얼트립", pax: 612, count: 271 }, ...]
 * 순서는 stats.platforms 고정 — 달을 바꿔도 막대 위치와 색이 흔들리지 않는다.
 */
export function monthColumn(stats: Stats, monthIndex: number): PlatformCell[] {
    return stats.platforms.map(p => ({
        platform: p,
        pax: stats.pax[p][monthIndex] ?? 0,
        count: stats.count[p][monthIndex] ?? 0,
    }));
}

/**
 * 값이 큰 것부터. "기타" 는 묶음이라 항상 맨 뒤.
 * 색은 stats.platforms 슬롯에 묶여 있으므로 순서가 바뀌어도 플랫폼 색은 그대로다.
 */
export function sortByMetric(cells: PlatformCell[], metric: 'pax' | 'count'): PlatformCell[] {
    const etc = (c: PlatformCell) => (c.platform === '기타' ? 1 : 0);
    return [...cells].sort((a, b) => etc(a) - etc(b) || b[metric] - a[metric]);
}

/** 플랫폼별 기간 누적 */
export function totalsByPlatform(stats: Stats, metric: 'pax' | 'count'): Record<string, number> {
    const out: Record<string, number> = {};
    for (const p of stats.platforms) out[p] = stats[metric][p].reduce((a, b) => a + b, 0);
    return out;
}
