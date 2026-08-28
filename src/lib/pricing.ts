/**
 * 예약 가격 계산. 화면 표시와 실제 청구가 같은 값이 되도록 여기 하나만 쓴다.
 *
 * 이 파일은 "사람이 보는 금액"만 다룬다. Stripe 에 보낼 최소 단위 정수 변환은
 * money.ts 의 toMinor() 가 한다. 여기서 * 100 을 하지 말 것.
 */

export type Currency = "USD" | "KRW";

/** 가격 계산에 필요한 tour_settings 컬럼만. */
export interface PricingSetting {
    tour_id: string;
    is_flat_rate?: boolean | null;
    adult_price_usd?: number | null;
    child_price_usd?: number | null;
    adult_price_krw?: number | null;
    child_price_krw?: number | null;
}

export interface PaxCounts {
    adultCount: number;
    childCount: number;
}

/** 환율 API 를 부르지 않는 이유는 resolveExchangeRate 주석 참고. */
const FALLBACK_EXCHANGE_RATE = 1350;

/** 프라이빗 차터 계단 요금 (USD 기준). */
const PRIVATE_TIERS: [maxPax: number, usd: number][] = [
    [10, 1200],
    [20, 1800],
    [30, 2400],
    [Infinity, 3000],
];

/** 콤보 상품 1인 요금 (USD 기준). comboOption '3' = 패러+제트. */
const COMBO_USD = { both: 310, single: 210 };

/**
 * 결제 수수료율. 손님에게 얹어서 받는다.
 *
 * USD 는 기존 운영값(2.95% + $0.30)을 그대로 유지한다.
 *
 * TODO(요율확정): KRW 값은 Stripe 대시보드에서 한국 결제수단(kr_card /
 * kakao_pay / naver_pay / samsung_pay) 실제 요율을 확인해 넣을 것. 지금 값은
 * USD 요율을 원화로 옮겨놓은 임시값이라 실제 수수료와 다를 수 있다.
 */
const FEE_RATES: Record<Currency, { percent: number; fixed: number }> = {
    USD: { percent: 0.0295, fixed: 0.3 },
    KRW: { percent: 0.0295, fixed: 400 },
};

/** Stripe 가 받는 최소 결제액. */
export const MIN_AMOUNT: Record<Currency, number> = { USD: 0.5, KRW: 100 };

/**
 * 원/달러 환율.
 *
 * 환율 API 를 실시간으로 부르지 않는다. 사이트에 표시된 원화 가격은
 * tour_settings 의 KRW 컬럼(주 1회 cron 이 USD 에서 환산해 채움)에서 오므로,
 * 결제 때 다른 환율을 쓰면 표시가와 청구액이 어긋난다. 그래서 같은 컬럼에서
 * 비율을 역산해 쓴다.
 */
export function resolveExchangeRate(setting: PricingSetting | null | undefined): number {
    const usd = setting?.adult_price_usd;
    const krw = setting?.adult_price_krw;
    if (!usd || !krw) return FALLBACK_EXCHANGE_RATE;
    return krw / usd;
}

function privateUsd(totalPax: number): number {
    return PRIVATE_TIERS.find(([maxPax]) => totalPax <= maxPax)![1];
}

/**
 * 수수료를 뺀 상품가.
 *
 * 콤보와 프라이빗은 USD 계단표가 기준이고 원화는 환율로 환산한다.
 * 일반 상품은 tour_settings 의 통화별 컬럼을 그대로 쓴다.
 */
export function basePrice(
    setting: PricingSetting,
    currency: Currency,
    { adultCount, childCount }: PaxCounts,
    comboOption?: string,
): number {
    const totalPax = adultCount + childCount;
    const isUsd = currency === "USD";
    const rate = isUsd ? 1 : resolveExchangeRate(setting);

    if (setting.tour_id === "combo_marine") {
        const perPersonUsd = comboOption === "3" ? COMBO_USD.both : COMBO_USD.single;
        return Math.floor(totalPax * perPersonUsd * rate);
    }

    if (setting.is_flat_rate && setting.tour_id === "private") {
        return Math.floor(privateUsd(totalPax) * rate);
    }

    if (setting.is_flat_rate) {
        return (isUsd ? setting.adult_price_usd : setting.adult_price_krw) || 0;
    }

    const adult = (isUsd ? setting.adult_price_usd : setting.adult_price_krw) || 0;
    const child = (isUsd ? setting.child_price_usd : setting.child_price_krw) || 0;
    return adultCount * adult + childCount * child;
}

/**
 * 상품가에 결제 수수료를 얹은 총액. 손님이 실제로 내는 금액.
 *
 * 공식: total = (base + 고정수수료) / (1 - 요율)
 * 이렇게 해야 Stripe 가 total 에서 수수료를 떼고도 base 가 남는다.
 */
export function grossUp(base: number, currency: Currency): number {
    const { percent, fixed } = FEE_RATES[currency];
    const total = (base + fixed) / (1 - percent);
    // 원화는 소수점이 없다. 반올림이 아니라 올림이라야 수수료가 모자라지 않는다.
    return currency === "KRW" ? Math.ceil(total) : Math.round(total * 100) / 100;
}

/** 총액에서 상품가를 뺀 수수료. Stripe line item 을 둘로 나눌 때 쓴다. */
export function feeAmount(base: number, currency: Currency): number {
    const total = grossUp(base, currency);
    return currency === "KRW"
        ? total - base
        : Math.round((total - base) * 100) / 100;
}
