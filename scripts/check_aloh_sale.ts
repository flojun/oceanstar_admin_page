// ALOH 특가 금액 검사: node --no-warnings scripts/check_aloh_sale.ts
import assert from 'node:assert/strict';
import { alohSaleSetting, basePrice, checkoutAmounts, ALOH_COMMISSION } from '../src/lib/pricing.ts';

const morning1 = { tour_id: 'morning1', adult_price_usd: 110, child_price_usd: 77, adult_price_krw: 150000, child_price_krw: 105000 };
const sale = alohSaleSetting(morning1);

// 성인은 $80 으로 내리고, 이미 더 싼 아동가($77)는 그대로
assert.equal(sale.adult_price_usd, 80);
assert.equal(sale.child_price_usd, 77);

// 1·2부는 수수료 포함가라 성인 2 + 아동 1 = $237 을 그대로 낸다
const base = basePrice(sale, 'USD', { adultCount: 2, childCount: 1 });
assert.equal(base, 237);
assert.equal(checkoutAmounts(sale, base, 'USD').total, 237);

// 선셋은 성인 $120, 아동은 이미 더 싼 $90 그대로. 콤보 같은 다른 상품은 손대지 않는다
const sunset = alohSaleSetting({ tour_id: 'sunset', adult_price_usd: 150, child_price_usd: 90 });
assert.equal(sunset.adult_price_usd, 120);
assert.equal(sunset.child_price_usd, 90);
assert.equal(alohSaleSetting({ tour_id: 'combo_marine', adult_price_usd: 210 }).adult_price_usd, 210);

// 수수료 10% + 5%
assert.deepEqual(ALOH_COMMISSION.map((c) => Math.round(237 * c.rate * 100) / 100), [23.7, 11.85]);

console.log('aloh sale ok');
