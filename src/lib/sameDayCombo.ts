/**
 * 스노클링과 같은 날 하는 콤보 (다이아몬드 헤드 하이킹 · 카카아코 파머스 마켓).
 *
 * 날짜·픽업은 한 번만 받고, 자리는 그날 스노클링 배(session)로 본다.
 * 결제되면 두 행이 생긴다: 스노클링 배 행(option '1부'/'2부', 픽업 = label) + 콤보 행(option = label, 호텔 픽업).
 * 손님에게 나가는 바우처·알림톡에는 name 과 호텔 픽업을 보이고, 픽업 시간은 별도 안내다.
 * 결제 수수료는 표시가에 포함한다 (pricing.ts FEE_INCLUDED_TOURS).
 */
export type SameDayCombo = {
    /** Stripe metadata.combo_option */
    comboOption: string;
    /** 자리를 나눠 쓰는 스노클링 배 */
    session: 'morning1' | 'morning2';
    /** 콤보 행의 option 이자 스노클링 행의 픽업 장소 */
    label: string;
    /** 바우처·알림톡 상품명 */
    name: string;
};

export const SAME_DAY_COMBOS: Record<string, SameDayCombo> = {
    combo_diamond: { comboOption: 'diamond', session: 'morning1', label: '다이아몬드', name: '거북이+다이아몬드 헤드 콤보' },
    combo_market: { comboOption: 'market', session: 'morning2', label: '카카아코', name: '거북이+카카아코 파머스 마켓 콤보' },
};

export const sameDayByOption = (comboOption?: string | null) =>
    Object.values(SAME_DAY_COMBOS).find((c) => c.comboOption === comboOption);
