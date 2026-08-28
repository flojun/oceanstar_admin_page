/**
 * 돈이 걸린 두 순수 함수의 경계 검사.
 *   node scripts/test_money_and_capture.mjs
 *
 * 테스트 프레임워크가 없는 프로젝트라 node:assert 로만 돌린다.
 * TS 파일을 직접 못 읽으므로 로직을 옮겨오지 않고 tsx 로 임포트한다.
 */
import assert from 'node:assert/strict';
import { toMinor } from '../src/lib/money.ts';
import { captureDueAt, hawaiiDateStr } from '../src/lib/captureSchedule.ts';
import { percentAmount, remainingOf, toInputValue } from '../src/lib/refundAmounts.ts';
import { basePrice, grossUp, feeAmount, resolveExchangeRate } from '../src/lib/pricing.ts';

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`  ok  ${name}`); };

console.log('\ntoMinor - 여기가 틀리면 100배 사고');
check('USD 는 센트로', () => assert.equal(toMinor(180.50, 'usd'), 18050));
check('KRW 는 배율 1', () => assert.equal(toMinor(180000, 'krw'), 180000));
check('대문자 통화도 처리', () => assert.equal(toMinor(50, 'USD'), 5000));
check('부동소수점 반올림', () => assert.equal(toMinor(0.1 + 0.2, 'usd'), 30));
check('0 은 허용', () => assert.equal(toMinor(0, 'usd'), 0));
check('음수는 거부', () => assert.throws(() => toMinor(-1, 'usd')));
check('NaN 은 거부', () => assert.throws(() => toMinor(NaN, 'usd')));

console.log('\n캡처 시각 - 투어 전날 하와이 20:00, 만료 전');
// 하와이 20:00 = 다음날 UTC 06:00
const hst20 = (d) => `${d}T06:00:00.000Z`;
const auth = new Date('2026-09-01T00:00:00Z');
const now = new Date('2026-09-01T12:00:00Z');

check('투어가 3개월 뒤 -> 승인+6일 - 12h (만료 마감)', () => {
    const due = captureDueAt({ tourDate: '2026-12-01', authorizedAt: auth, now });
    assert.equal(due.toISOString(), '2026-09-06T12:00:00.000Z');
});
check('투어가 3일 뒤 -> 투어 전날 하와이 20:00', () => {
    const due = captureDueAt({ tourDate: '2026-09-04', authorizedAt: auth, now });
    assert.equal(due.toISOString(), hst20('2026-09-04'));  // 9/3 20:00 HST
});
check('capture_before 가 있으면 그걸 쓴다', () => {
    const due = captureDueAt({
        tourDate: '2026-12-01', authorizedAt: auth,
        captureBefore: new Date('2026-09-03T00:00:00Z'), now,
    });
    assert.equal(due.toISOString(), '2026-09-02T12:00:00.000Z'); // 만료 12h 전
});
check('투어가 내일 -> 오늘 하와이 20:00', () => {
    // now = 9/1 12:00 UTC = 9/1 02:00 하와이. 투어 9/2 -> 전날(9/1) 20:00 HST 는 아직 미래.
    const due = captureDueAt({ tourDate: '2026-09-02', authorizedAt: auth, now });
    assert.equal(due.toISOString(), hst20('2026-09-02'));
});
check('투어가 오늘 -> 오늘 하와이 20:00 (전날은 이미 지남)', () => {
    const due = captureDueAt({ tourDate: '2026-09-01', authorizedAt: auth, now });
    assert.equal(due.toISOString(), hst20('2026-09-02')); // 9/1 20:00 HST
});
check('투어가 이미 지남 -> 오늘 하와이 20:00', () => {
    const due = captureDueAt({ tourDate: '2026-08-20', authorizedAt: auth, now });
    assert.equal(due.toISOString(), hst20('2026-09-02'));
});
check('만료가 코앞이면 오늘 저녁을 안 기다린다', () => {
    const due = captureDueAt({
        tourDate: '2026-08-20', authorizedAt: auth,
        captureBefore: new Date('2026-09-01T18:00:00Z'), now,
    });
    assert.equal(due.toISOString(), '2026-09-01T06:00:00.000Z');
});

console.log('\n환불 비율 - 나머지는 고객에게 유리하게(올림)');
const usd = (total, refunded = 0) => ({ total_price: total, refunded_amount: refunded, currency: 'USD' });
const krw = (total, refunded = 0) => ({ total_price: total, refunded_amount: refunded, currency: 'KRW' });

check('100% 는 잔액 그대로 (올림으로 초과하지 않음)', () =>
    assert.equal(percentAmount(usd(215.30), 100), 215.30));
check('50% 나누어떨어짐', () =>
    assert.equal(percentAmount(usd(180), 50), 90));
check('USD 나머지는 센트 올림 (고객 유리)', () =>
    assert.equal(percentAmount(usd(100.01), 30), 30.01));   // 30.003 -> 30.01
check('KRW 는 원 단위 올림', () =>
    assert.equal(percentAmount(krw(180000), 30), 54000));
check('KRW 나머지 올림', () =>
    assert.equal(percentAmount(krw(100001), 30), 30001));    // 30000.3 -> 30001
check('이미 환불된 금액은 잔액에서 뺀다', () =>
    assert.equal(percentAmount(usd(200, 50), 100), 150));
check('전액 환불된 건은 잔액 0', () =>
    assert.equal(remainingOf(usd(200, 200)), 0));
check('KRW 입력칸은 소수점 없음', () =>
    assert.equal(toInputValue(180000, 'KRW'), '180000'));
check('USD 입력칸은 2자리', () =>
    assert.equal(toInputValue(90, 'USD'), '90.00'));

console.log('\n가격 계산 - 표시가와 청구액이 같아야 한다');
// 환율 1350 이 나오도록 맞춘 설정 (135000 / 100)
const snorkel = {
    tour_id: 'morning1', is_flat_rate: false,
    adult_price_usd: 100, child_price_usd: 80,
    adult_price_krw: 135000, child_price_krw: 108000,
};
const combo = { ...snorkel, tour_id: 'combo_marine' };
const priv = { ...snorkel, tour_id: 'private', is_flat_rate: true };

check('환율은 KRW/USD 역산', () =>
    assert.equal(resolveExchangeRate(snorkel), 1350));
check('환율 컬럼이 비면 fallback 1350', () =>
    assert.equal(resolveExchangeRate({ tour_id: 'x' }), 1350));

check('일반 상품 USD = 성인*100 + 아동*80', () =>
    assert.equal(basePrice(snorkel, 'USD', { adultCount: 2, childCount: 1 }), 280));
check('일반 상품 KRW 은 KRW 컬럼을 그대로', () =>
    assert.equal(basePrice(snorkel, 'KRW', { adultCount: 2, childCount: 1 }), 378000));

check('콤보 USD 는 1인 210', () =>
    assert.equal(basePrice(combo, 'USD', { adultCount: 2, childCount: 0 }), 420));
check('콤보 옵션3 USD 는 1인 310', () =>
    assert.equal(basePrice(combo, 'USD', { adultCount: 2, childCount: 0 }, '3'), 620));
check('콤보 KRW = 콤보 USD x 환율 (프론트 표시와 일치)', () =>
    assert.equal(basePrice(combo, 'KRW', { adultCount: 2, childCount: 0 }), 420 * 1350));
check('콤보는 아동도 성인과 같은 요금', () =>
    assert.equal(basePrice(combo, 'USD', { adultCount: 1, childCount: 1 }), 420));

check('프라이빗 10명 이하는 1200', () =>
    assert.equal(basePrice(priv, 'USD', { adultCount: 10, childCount: 0 }), 1200));
check('프라이빗 11명은 1800', () =>
    assert.equal(basePrice(priv, 'USD', { adultCount: 11, childCount: 0 }), 1800));
check('프라이빗 31명 이상은 3000', () =>
    assert.equal(basePrice(priv, 'USD', { adultCount: 31, childCount: 0 }), 3000));
check('프라이빗 KRW 환산', () =>
    assert.equal(basePrice(priv, 'KRW', { adultCount: 5, childCount: 0 }), 1200 * 1350));

console.log('\n수수료 - USD 는 기존 공식 그대로, KRW 는 원 단위');
check('USD 회귀: (200+0.30)/(1-0.0295)', () =>
    assert.equal(grossUp(200, 'USD'), Math.round(((200 + 0.3) / (1 - 0.0295)) * 100) / 100));
check('USD 는 소수점 2자리를 넘지 않는다', () => {
    const v = grossUp(215.37, 'USD');
    assert.equal(v, Math.round(v * 100) / 100);
});
check('KRW 는 정수', () =>
    assert.equal(grossUp(180000, 'KRW') % 1, 0));
check('KRW 수수료는 모자라지 않게 올림', () =>
    assert.ok(grossUp(180000, 'KRW') >= (180000 + 400) / (1 - 0.0295)));
check('수수료는 항상 상품가보다 크다', () =>
    assert.ok(grossUp(100, 'USD') > 100 && grossUp(100000, 'KRW') > 100000));
check('상품가 + 수수료 = 총액 (USD)', () =>
    assert.equal(Math.round((200 + feeAmount(200, 'USD')) * 100) / 100, grossUp(200, 'USD')));
check('상품가 + 수수료 = 총액 (KRW)', () =>
    assert.equal(180000 + feeAmount(180000, 'KRW'), grossUp(180000, 'KRW')));

console.log('\n통화 변환 - 원화 100배 사고 방지');
check('KRW 총액을 Stripe 단위로 바꿔도 그대로', () =>
    assert.equal(toMinor(grossUp(180000, 'KRW'), 'krw'), grossUp(180000, 'KRW')));
check('USD 총액은 센트로', () =>
    assert.equal(toMinor(grossUp(200, 'USD'), 'usd'), Math.round(grossUp(200, 'USD') * 100)));
check('KRW 최소 결제액 100원이 100 으로 전달', () =>
    assert.equal(toMinor(100, 'krw'), 100));

console.log('\n하와이 날짜 변환');
check('UTC 05:00 은 아직 하와이 전날', () =>
    assert.equal(hawaiiDateStr(new Date('2026-09-02T05:00:00Z')), '2026-09-01'));
check('UTC 10:00 은 하와이 당일', () =>
    assert.equal(hawaiiDateStr(new Date('2026-09-02T10:00:00Z')), '2026-09-02'));

console.log(`\n${passed}개 통과\n`);
