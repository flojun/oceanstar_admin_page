/**
 * 마이리얼트립 메일 파서 자체검사.  실행: node scripts/test_mrt_parser.ts
 * 취소 메일 두 종류(예약번호 있음 / 없음)를 특히 못박아 둔다.
 */
import assert from 'node:assert';
import { parseMyRealTripEmail, detectEmailType } from '../src/lib/myrealTripEmailParser.ts';

const row = (label: string, value: string) => `<tr><td>${label}</td><td>${value}</td></tr>`;

// ── [확정완료] : 기존 동작이 그대로인지
const confirmed = parseMyRealTripEmail(
    `<table>
     ${row('예약번호', 'EXP-20260802-00006122')}
     ${row('상품명', '[내돈내산]거북이스노클링/선셋크루즈')}
     ${row('옵션명', '아동, 거북이 스노클링+해양 액티비티')}
     ${row('여행일', '2026-08-05 ~ 2026-08-05')}
     ${row('여행자', '최원철')}
     </table>`,
    '[확정완료] 2026-08-05 / [내돈내산]거북이스노클링',
);
assert.ok(confirmed, '확정완료 파싱 실패');
assert.equal(confirmed.type, 'confirmed');
assert.equal(confirmed.reservation.orderNumber, 'EXP-20260802-00006122');
assert.equal(confirmed.reservation.travelerName, '최원철');
assert.equal(confirmed.reservation.tourDate, '2026-08-05');

// ── [예약취소] : 예약번호가 있다
const cancelled = parseMyRealTripEmail(
    `<div>하와이가자 파트너님,</div><div>예약이 취소되었습니다.</div>
     <table>
     ${row('예약번호', 'EXP-20260914-00013831')}
     ${row('상품명', '[후기15000개·루프탑배]거북이스노클링 (옵션:선셋)')}
     ${row('옵션명', '아동, 거북이 스노클링+해양 액티비티')}
     ${row('여행일', '2026-09-24 ~ 2026-09-24')}
     ${row('여행자', '박서정')}
     </table>`,
    '[예약취소] 2026-09-24 / [후기15000개·루프탑배]거북이스노클링 (옵션:선셋) 상품 예약이 취소되었습니다.',
);
assert.ok(cancelled, '예약취소 파싱 실패');
assert.equal(cancelled.type, 'cancelled');
assert.equal(cancelled.reservation.orderNumber, 'EXP-20260914-00013831');
assert.equal(cancelled.reservation.travelerName, '박서정');
assert.equal(cancelled.reservation.tourDate, '2026-09-24');

// ── 예약 취소 요청 접수 : **예약번호가 없다.** 이름+여행일로만 찾아야 한다.
const request = parseMyRealTripEmail(
    `<div>박서정 여행자님,</div><div>예약 취소 요청이 접수되었습니다.</div>
     <table>
     ${row('상품명', '[후기15000개·루프탑배]거북이스노클링 (옵션:선셋)')}
     ${row('여행일', '2026-09-24')}
     ${row('여행자', '박서정')}
     </table>`,
    '예약 취소 요청 접수 - [후기15000개·루프탑배]거북이스노클링 (옵션:선셋)',
);
assert.ok(request, '취소요청 파싱 실패 — 예약번호가 없다고 버리면 안 된다');
assert.equal(request.type, 'cancel_request');
assert.equal(request.reservation.orderNumber, '');
assert.equal(request.reservation.travelerName, '박서정');
assert.equal(request.reservation.tourDate, '2026-09-24');

// ── 제목 판정
assert.equal(detectEmailType('[확정대기] 2026-09-15 / 상품'), 'pending');
assert.equal(detectEmailType('[예약취소] 2026-09-24 / 상품 예약이 취소되었습니다.'), 'cancelled');
assert.equal(detectEmailType('예약 취소 요청 접수 - 상품'), 'cancel_request');
assert.equal(detectEmailType('여행문의에 대한 새로운 메세지가 있습니다.'), null);
assert.equal(detectEmailType('[판매시작] 상품 판매가 시작되었습니다.'), null);

console.log('OK — 확정완료 / 예약취소 / 취소요청 접수 + 제목 판정 5종');
