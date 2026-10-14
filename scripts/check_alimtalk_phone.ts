// npx tsx scripts/check_alimtalk_phone.ts — 연락처 칸 → 솔라피 번호 변환 확인
import assert from 'node:assert/strict';
import { toSolapiPhone } from '../src/lib/alimtalk';

const kr = { country: '82', to: '01012345678' };
const us = { country: '1', to: '8081234567' };
assert.deepEqual(toSolapiPhone('010-1234-5678'), kr);
assert.deepEqual(toSolapiPhone('+82 10 1234 5678'), kr);
assert.deepEqual(toSolapiPhone('+82 010-1234-5678'), kr);
assert.deepEqual(toSolapiPhone('+1 808-123-4567'), us);
assert.deepEqual(toSolapiPhone('(808) 123-4567'), us);
assert.deepEqual(toSolapiPhone('18081234567'), us);
assert.equal(toSolapiPhone('kakao_id123'), null);
assert.equal(toSolapiPhone('+81 90 1234 5678'), null);
console.log('ok');
