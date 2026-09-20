/**
 * 선셋 픽업 시각 표.
 *
 * 바깥 키(선셋 세트)는 "그 계절의 기준 픽업 시각"이다. 출항 시각이 아니다.
 * 대부분의 장소가 기준 시각에 픽업하고(녹색천막·HGI·WR), 항구에서 먼 카할라·HP 는
 * 조금 일찍, 항구에 가까운 알라모아나·프린스·직접(Harbor)은 조금 늦게 태운다.
 * 예) '300' 세트 = 기준 픽업 3:00, 출항 3:30, 항구 복귀 6:00, 드롭 완료 6:30.
 *
 * 값은 Storage 에 올라간 바우처 PDF 파일명에서 그대로 뽑았다. 그래서 화면과
 * 메일에서 이 표를 쓰면 고객이 받는 PDF 와 시각이 어긋날 수 없다.
 */
export type SunsetSet = '130' | '230' | '300' | '330';

export const SUNSET_PICKUP: Record<string, Record<SunsetSet, string>> = {
    Alamoana: { '130': '145', '230': '245', '300': '315', '330': '345' },
    GreenTent: { '130': '130', '230': '230', '300': '300', '330': '330' },
    HGI: { '130': '130', '230': '230', '300': '300', '330': '330' },
    HIE: { '130': '140', '230': '240', '300': '310', '330': '340' },
    HM: { '130': '135', '230': '235', '300': '305', '330': '335' },
    HP: { '130': '120', '230': '220', '300': '250', '330': '320' },
    Harbor: { '130': '150', '230': '250', '300': '320', '330': '350' },
    IHOP: { '130': '140', '230': '240', '300': '310', '330': '340' },
    KaLai: { '130': '140', '230': '240', '300': '310', '330': '340' },
    Kahala: { '130': '110', '230': '210', '300': '240', '330': '310' },
    Prince: { '130': '145', '230': '245', '300': '315', '330': '345' },
    Renaissance: { '130': '145', '230': '245', '300': '315', '330': '345' },
    Ritz: { '130': '140', '230': '240', '300': '310', '330': '340' },
    WR: { '130': '130', '230': '230', '300': '300', '330': '330' },
};

/**
 * tour_settings.sunset.start_time -> 선셋 세트.
 * sunset 의 start_time 은 기준 픽업 시각을 담는다("15:00" = '300' 세트).
 */
export const START_TIME_TO_SET: Record<string, SunsetSet> = {
    '13:30': '130',
    '14:30': '230',
    '15:00': '300',
    '15:30': '330',
};

/** DB 의 pickup_location 값 -> 바우처/픽업표 키. 한·영 공통이다. */
export const LOCATION_KEYS: Record<string, string> = {
    'HM': 'HM',
    'H&M': 'HM',
    '녹색천막': 'GreenTent',
    '소화전': 'GreenTent',
    '알라모아나': 'Alamoana',
    '알모': 'Alamoana',
    '직접': 'Harbor',
    'DIRECT': 'Harbor',
    '카라이': 'KaLai',
    '리츠칼튼': 'Ritz',
    '르네상스': 'Renaissance',
    '프린스': 'Prince',
    '카할라': 'Kahala',
    'IHOP': 'IHOP',
    '아이홉': 'IHOP',
    'HGI': 'HGI',
    'HIE': 'HIE',
    'HP': 'HP',
    'WR': 'WR',
};

/** 장소 이름("프린스", "HM (3:05)") -> 픽업표 키. 못 찾으면 null. */
export function locationKey(name: string): string | null {
    const clean = (name || '').replace(/\(.*?\)/g, '').trim();
    if (!clean) return null;
    if (LOCATION_KEYS[clean]) return LOCATION_KEYS[clean];
    const hit = Object.keys(LOCATION_KEYS).find(k => clean.startsWith(k));
    return hit ? LOCATION_KEYS[hit] : null;
}

/**
 * 바우처 표기("315", "110") -> 24시간 "HH:MM".
 * 표의 값은 모두 오후라서 12시 미만이면 12를 더한다.
 */
export function sunsetPickupTo24h(compact: string): string | null {
    if (!/^\d{3,4}$/.test(compact)) return null;
    const minute = Number(compact.slice(-2));
    let hour = Number(compact.slice(0, -2));
    if (minute > 59 || hour > 12) return null;
    if (hour < 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** tour_settings.sunset.start_time -> 세트. 표에 없는 시각이면 null. */
export function sunsetSetOf(startTime: string | null | undefined): SunsetSet | null {
    if (!startTime) return null;
    return START_TIME_TO_SET[String(startTime).slice(0, 5)] ?? null;
}

/** 장소 이름 + 선셋 세트 -> 그 장소의 선셋 픽업 시각("HH:MM"). 없으면 null. */
export function sunsetPickupTime(name: string, set: SunsetSet | null): string | null {
    if (!set) return null;
    const key = locationKey(name);
    const compact = key ? SUNSET_PICKUP[key]?.[set] : null;
    return compact ? sunsetPickupTo24h(compact) : null;
}
