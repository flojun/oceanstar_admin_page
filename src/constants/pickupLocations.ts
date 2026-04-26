export const PICKUP_LOCATIONS = [
    "프린스",
    "IHOP",
    "카라이",
    "HIE",
    "HM",
    "녹색천막",
    "소화전",
    "WR",
    "HP",
    "HGI",
    "르네상스",
    "알라모아나",
    "직접"
] as const;

export type PickupLocation = typeof PICKUP_LOCATIONS[number];

export const PICKUP_MAPPINGS: Record<string, string> = {
    'HP': 'Hyatt Place',
    '녹색천막': 'A Green Tent (located behind the Hyatt Regency Hotel)',
    '소화전': '소화전',
    'WR': 'Waikiki Resort',
    'HGI': 'Hilton Garden Inn',
    'HIE': 'Holiday Inn Express',
    'HM': 'H&M',
    'IHOP': 'IHOP',
    '카라이': "Ka La'i Waikiki Hotel",
    '프린스': 'Prince Hotel',
    '르네상스': 'Renaissance Hotel',
    '알라모아나': 'Ala Moana Hotel',
    '직접': '개별 이동 (항구 직접 도착)'
};

export const PICKUP_MAPPINGS_EN: Record<string, string> = {
    'HP': 'Hyatt Place',
    '녹색천막': 'A Green Tent (located behind the Hyatt Regency Hotel)',
    '소화전': 'Sohwajeon (Fire Hydrant)',
    'WR': 'Waikiki Resort',
    'HGI': 'Hilton Garden Inn',
    'HIE': 'Holiday Inn Express',
    'HM': 'H&M',
    'IHOP': 'IHOP',
    '카라이': "Ka La'i Waikiki Hotel",
    '프린스': 'Prince Hotel',
    '르네상스': 'Renaissance Hotel',
    '알라모아나': 'Ala Moana Hotel',
    '직접': 'Self Arrival'
};

export function getPickupDisplayName(name: string): string {
    return PICKUP_MAPPINGS[name] || name;
}

export function getPickupDisplayNameByLang(name: string, lang: 'ko' | 'en'): string {
    if (lang === 'en') {
        return PICKUP_MAPPINGS_EN[name] || PICKUP_MAPPINGS[name] || name;
    }
    return PICKUP_MAPPINGS[name] || name;
}
