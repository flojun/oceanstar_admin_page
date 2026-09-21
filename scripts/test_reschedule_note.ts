/**
 * 날짜변경 표식 자가 점검. 실행: node scripts/test_reschedule_note.ts
 * 방향이 반대인 두 표식을 화면이 같은 모양("from ➜ to")으로 읽는지 본다.
 */
import assert from 'node:assert/strict';
import { withAppliedDateMarker, stripRescheduleMarkers, readRescheduleChange } from '../src/lib/rescheduleNote.ts';

// --- OTA: 이미 반영됨. 행은 새 날짜(11-20), 표식에 옛 날짜(11-10) ---
const note = withAppliedDateMarker('[GYG 예약변경 수신]', '2026-11-10', '힐튼');
const ota = readRescheduleChange(note, '2026-11-20', '알라모아나');
assert.deepEqual(ota, {
    fromDate: '2026-11-10', fromPickup: '힐튼',
    toDate: '2026-11-20', toPickup: '알라모아나', applied: true,
});

// --- 손님 요청: 아직 안 옮김. 행은 옛 날짜(11-10), 표식에 희망 날짜(11-20) ---
// /api/reschedule 이 붙이는 문자열 그대로.
const req = '메모\n\n[변경요청] <NewDate:2026-11-20> <NewPickup:알라모아나>';
const guest = readRescheduleChange(req, '2026-11-10', '힐튼');
assert.deepEqual(guest, {
    fromDate: '2026-11-10', fromPickup: '힐튼',
    toDate: '2026-11-20', toPickup: '알라모아나', applied: false,
});

// 승인하면 표식만 사라지고 메모는 남는다 (두 모양 다)
assert.equal(stripRescheduleMarkers(note), '[GYG 예약변경 수신]');
assert.equal(stripRescheduleMarkers(req), '메모');

// 두 번 바뀌면 표식은 하나만 남고 **직전** 날짜를 가리킨다.
// (11-10 → 11-20 → 12-01 이면 화면엔 11-20 ➜ 12-01. 전체 이력은 note 의 수신 기록에 남는다)
const twice = withAppliedDateMarker(note, '2026-11-20', '알라모아나');
assert.equal((twice.match(/\[변경반영\]/g) || []).length, 1);
assert.equal(readRescheduleChange(twice, '2026-12-01', '알라모아나').fromDate, '2026-11-20');

// 표식이 없으면 빈 값 (화면이 터지지 않게)
assert.equal(readRescheduleChange(null, '2026-11-10', '힐튼').toDate, '');

console.log('ok');
