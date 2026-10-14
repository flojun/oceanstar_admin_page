/**
 * 메일 형식 점검(src/lib/emailFormatAudit.ts) 자체검사.  실행: node scripts/test_email_audit.ts
 *   - 실제로 있었던 오답(GYG 픽업에 상품명, 여기어때 3부)을 잡는지
 *   - 정상 예약은 통과시키는지 (매일 헛알림이 울리면 아무도 안 본다)
 */
import assert from 'node:assert';
import type { OtaBooking } from '../src/lib/otaEmailParser.ts';
import { BOOKING_LABELS, checkOtaBooking, checkMrtReservation, looksLikeMissedBookingSubject, missingLabels } from '../src/lib/emailFormatAudit.ts';

const now = new Date('2026-10-13T16:00:00Z');
const base: OtaBooking = {
    kind: 'new', platform: 'gyg', source: 'G', orderId: 'GYG83W6MKA28', name: 'Margaret Anne Connolly',
    tourDate: '2026-12-16', option: '1부', pax: '2명', adultCount: 2, childCount: 0,
    pickupLocation: 'Starbucks Coffee Company, 410 Atkinson Dr, Honolulu, HI 96814, USA',
    contact: '+61412009788', bookerEmail: '', note: '',
};

assert.deepEqual(checkOtaBooking(base, now), [], '정상 예약을 문제로 봤다');

// 2026-10 GYG: 상품명이 픽업으로 읽힌 경우
const gygBug = checkOtaBooking({ ...base, pickupLocation: '[4HR w/PickUp] Waikiki Turtle Canyon Snorkel 6-in-1 Activity' }, now);
assert.ok(gygBug.some((p) => p.includes('픽업 자리에 다른 값')), `상품명 픽업을 못 잡음: ${gygBug}`);

assert.ok(checkOtaBooking({ ...base, orderId: '827433' }, now).some((p) => p.includes('예약번호 형식')));
assert.ok(checkOtaBooking({ ...base, tourDate: '2026-02-30' }, now).some((p) => p.includes('투어일')));
assert.ok(checkOtaBooking({ ...base, tourDate: '2031-01-01' }, now).some((p) => p.includes('투어일')));
assert.ok(checkOtaBooking({ ...base, pax: '0명' }, now).some((p) => p.includes('인원 이상')));
assert.ok(checkOtaBooking({ ...base, pax: '3명' }, now).some((p) => p.includes('합계 불일치')));
assert.ok(checkOtaBooking({ ...base, option: '선셋' }, now).some((p) => p.includes('부 이상')));
assert.ok(checkOtaBooking({ ...base, name: 'Waikiki Turtle Canyon Snorkel' }, now).some((p) => p.includes('이름 자리')));
// 취소 메일은 예약번호만 본다
assert.deepEqual(checkOtaBooking({ ...base, kind: 'cancel', tourDate: '', pax: '', name: '' }, now), []);
// 메일에 이름이 없는 플랫폼의 자리표시 이름은 정상
assert.deepEqual(checkOtaBooking({ ...base, platform: 'triple', orderId: '827433', name: '(트리플 확인필요)', pickupLocation: '' }, now), []);

assert.deepEqual(checkMrtReservation({ type: 'pending', reservation: {
    orderNumber: 'EXP-20261012-00003522', productName: '', optionName: '성인, 거북이 스노클링+해양 액티비티',
    tourDate: '2027-08-06', travelerName: '김지원' } }, now), []);
assert.ok(checkMrtReservation({ type: 'confirmed', reservation: {
    orderNumber: 'EXP-2026', productName: '', optionName: '', tourDate: '2026-10-10', travelerName: '' } }, now).length >= 3);

// 칸 이름은 줄 머리에 있어야 한다 — 제목 안의 "Free Pickup" 으로는 통과하지 않는다
assert.deepEqual(missingLabels('<p>Waikiki: Turtle Canyon Snorkel, 6 Activities &amp; Free Pickup</p>', ['Pickup']), ['Pickup']);
assert.deepEqual(missingLabels('<p>Pickup</p><span>H&amp;M</span>', ['Pickup']), []);
assert.deepEqual(missingLabels('・상품: x<br/>・옵션: 1부<br/>', ['상품', '옵션', '이용일']), ['이용일']);

for (const s of ['[Klook] 클룩 예약내역 확정 - …', 'Booking - S257755 - GYG83W6MKA28', '[여기어때] 예약이 확정되었어요.', 'Reservation confirmed #123']) {
    assert.ok(looksLikeMissedBookingSubject(s), `예약 제목을 놓침: ${s}`);
}
for (const s of ['필수 조치: 예약확정 요청 안내 (예약번호: SVE103618)', '[NOL 투어 파트너센터] 로그인 2차 인증번호 안내',
    '[줌줌투어] 예약번호 : 610178의 새로운 여행 후기가 도착했습니다.', 'Conversation with Gargi N about Viator booking BR-1453085517']) {
    assert.ok(!looksLikeMissedBookingSubject(s), `예약 메일이 아닌데 걸림: ${s}`);
}

// WAUG — 실제 신규 요청 메일의 칸은 전부 줄 머리에 있다
const waugHtml = 'Order ID : 9181379<br />Product Option :<br />… Adult (만 8세 이상)*2 07:30-11:30<br />Visit Date : 2026-11-28<br />Visit Time : 07:30-11:30<br />Full legal name as per passport(여권상 영문명) : CHO SEONG HOON<br />Messenger ID(메신저 ID) : dcc70<br />';
assert.ok(BOOKING_LABELS.waug.subject.test('[WAUG] New Booking Request (Order ID : 9181379)'));
assert.deepEqual(missingLabels(waugHtml, BOOKING_LABELS.waug.labels), []);
assert.deepEqual(checkOtaBooking({ ...base, platform: 'waug', orderId: '9181379', name: 'CHO SEONG HOON', pickupLocation: '리츠칼튼' }, now), []);

console.log('OK — 메일 형식 점검 규칙');
