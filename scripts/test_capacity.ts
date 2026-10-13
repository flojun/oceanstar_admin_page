/** node scripts/test_capacity.ts — 이메일 크론 정원초과 판단 */
import assert from 'node:assert';
import { checkCapacity, paxNumber } from '../src/lib/capacity.ts';
import type { TourSetting } from '../src/lib/tourUtils.ts';

const settings = [
    { tour_id: 'morning1', name: '1부 거북이 스노클링', max_capacity: 45, vessel_name: '오션스타' },
    { tour_id: 'morning2', name: '2부 거북이 스노클링', max_capacity: 45, vessel_name: '오션스타' },
    { tour_id: 'sunset', name: '선셋 거북이 스노클링', max_capacity: 38, vessel_name: '오션스타' },
] as TourSetting[];

assert.equal(paxNumber('3명'), 3);
assert.equal(paxNumber(''), 0);

const day = [
    { option: '1부', pax: '40명' },
    { option: '1부 거북이 스노클링', pax: '3명' },   // 이름 그대로 저장된 행도 같은 1부
    { option: '2부', pax: '44명' },                // 다른 부는 세지 않는다
    { option: null, pax: '5명' },                  // 옵션 없는 행도 세지 않는다
];

// 1부: 43 + 2 = 45 → 딱 정원, 초과 아님
assert.deepEqual(checkCapacity('1부', '2명', day, settings), { group: '1부 거북이 스노클링', limit: 45, current: 43, total: 45, over: false });
// 1부: 43 + 3 = 46 → 초과
assert.equal(checkCapacity('1부', '3명', day, settings)?.over, true);
// 2부: 44 + 1 = 45 → 아님, 44 + 2 → 초과
assert.equal(checkCapacity('2부', '1명', day, settings)?.over, false);
assert.equal(checkCapacity('2부', '2명', day, settings)?.over, true);
// 선셋은 정원 38
assert.equal(checkCapacity('3부', '39명', [], settings)?.over, true);
// 옵션이 없으면 판단하지 않는다
assert.equal(checkCapacity('', '50명', day, settings), null);

console.log('capacity tests passed');
