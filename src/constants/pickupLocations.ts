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
