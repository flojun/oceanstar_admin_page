export const PICKUP_LOCATIONS = [
    "프린스",
    "아이홉",
    "카라이",
    "HIE",
    "HM",
    "녹색천막",
    "WR",
    "HP",
    "HGI",
    "르네상스",
    "알라모아나"
] as const;

export type PickupLocation = typeof PICKUP_LOCATIONS[number];

export const PICKUP_MAPPINGS: Record<string, string> = {
    'HP': '하얏트 플레이스',
    '녹색천막': '녹색천막(하얏트 리젠시 뒷편)',
    'WR': '와이키키 리조트',
    'HGI': '힐튼 가든 인',
    'HIE': '홀리데이 인 익스프레스',
    'HM': 'H&M',
    '아이홉': 'IHOP',
    '카라이': '카라이 호텔',
    '프린스': '프린스 호텔',
    '르네상스': '르네상스 호텔',
    '알라모아나': '알라모아나 호텔'
};

export function getPickupDisplayName(name: string): string {
    return PICKUP_MAPPINGS[name] || name;
}

