export const PICKUP_LOCATIONS = [
    "직접",
    "HM",
    "소화전",
    "WR",
    "IHOP",
    "HP",
    "프린스",
    "카라이",
    "일리카이",
    "HGI",
    "QK",
    "모나크",
    "마루",
    "코트야드",
    "HV(할레)",
    "HIE",
    "리츠칼튼",
    "르네상스",
    "알모",
    "카할라"
] as const;

export type PickupLocation = typeof PICKUP_LOCATIONS[number];
