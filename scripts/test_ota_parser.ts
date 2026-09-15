/**
 * OTA 메일 파서 자체검사.  실행: node scripts/test_ota_parser.ts
 *
 * ⚠️ 아래 HTML 은 실제 .eml 이 아니라 **스크린샷을 보고 재현한 것**이다.
 *    실제 메일이 처음 들어오면 파싱 결과를 한 번 눈으로 확인할 것.
 *    (파싱 실패 시 메일을 읽음 처리하지 않으므로 데이터가 망가지지는 않는다)
 */
import assert from 'node:assert';
import { parseOtaEmail } from '../src/lib/otaEmailParser.ts';

const row = (label: string, value: string) => `<tr><td>${label}:</td><td>${value}</td></tr>`;

// ---------------------------------------------------------------- Klook
const KLOOK_BODY = `
<h3>[한국어 가이드] 하와이 거북이 스노클링 | 후기 7000개·재방문 1위·5종 해양액티비티</h3>
<div>패키지: 거북이 스노클링 + 해양 액티비티</div>
<table>
${row('예약 확인 ID', 'SFA720708')}
${row('요청 날짜', '2026-09-18')}
${row('요청 시간', 'NA')}
${row('대표 예약자명', '()')}
${row('여권상 국가', '')}
${row('대표 예약자 이메일 주소', 'ppoyann2@gmail.com')}
${row('대표 예약자 핸드폰 번호', '82-01097772462')}
${row('여행자', '2 x 1부(07:30-11:30) 성인')}
${row('상품 URL', '<a href="https://www.klook.com/ko/activity/218737">218737</a>')}
<tr><td>세부 내용</td></tr>
${row('출발 장소', '호텔 근처 픽업 장소')}
<tr><td>숙박하시는 호텔 주소를 적어주세요. 예약 확정 후 호텔에 따른 지정 픽업 장소를 카카오톡으로 안내 드립니다.:</td>
    <td>Hyatt Regency Waikiki Beach Resort And Spa</td></tr>
${row('영문 성', 'kang')}
${row('영문 이름', 'nahe')}
${row('전화번호', '+82-01086175716')}
${row('카카오톡', 'smllep')}
</table>`;

const klookNew = parseOtaEmail(
    `<p>클룩에서 예약을 확정한 뒤 바우처를 발급했습니다.</p>${KLOOK_BODY}`,
    '[Klook] 클룩 예약내역 확정 - [한국어 가이드] 하와이 거북이 스노클링｜후기 7000개·재방문 1위·5종 해양액티비티 - 2026-09-18',
    'Klook.com <noreply@klook.com>',
);
assert.ok(klookNew, 'klook new 파싱 실패');
assert.equal(klookNew.kind, 'new');
assert.equal(klookNew.source, '클록');
assert.equal(klookNew.orderId, 'SFA720708');
assert.equal(klookNew.name, 'nahe kang');
assert.equal(klookNew.tourDate, '2026-09-18');
assert.equal(klookNew.option, '1부');
assert.equal(klookNew.pax, '2명');
assert.equal(klookNew.adultCount, 2);
assert.equal(klookNew.pickupLocation, 'Hyatt Regency Waikiki Beach Resort And Spa');
assert.equal(klookNew.contact, '+82-01086175716');
assert.equal(klookNew.bookerEmail, 'ppoyann2@gmail.com');

// 취소 메일은 본문이 신규와 완전히 동일하다. 제목으로만 갈린다.
const klookCancel = parseOtaEmail(
    `<p>논의한 바와 같이 다음 클룩 주문이 취소되었습니다.</p>${KLOOK_BODY}`,
    '[Klook] 클룩 확정된 예약 취소 - [한국어 가이드] 하와이 거북이 스노클링｜후기 7000개 - 2026-09-18 - 「Klook Canceled」',
    'Klook.com <noreply@klook.com>',
);
assert.ok(klookCancel, 'klook cancel 파싱 실패');
assert.equal(klookCancel.kind, 'cancel');
assert.equal(klookCancel.orderId, 'SFA720708');

// 부분 취소: '여행자' 대신 '취소된 수량' / '남은 수량' 이 오고, 제목에 '예약' 이 없다.
const klookPartial = parseOtaEmail(
    `<p>아래 예약이 부분 취소되었습니다.</p>
     <div>패키지: 거북이 스노클링 + 해양 액티비티</div>
     <table>
     ${row('예약 확인 ID', 'VFT631317')}
     ${row('취소된 수량', '1 x 1부(07:30-11:30) 성인')}
     ${row('요청 날짜', '2026-09-12')}
     ${row('요청 시간', 'NA')}
     ${row('대표 예약자명', '()')}
     ${row('여권상 국가', '')}
     ${row('남은 수량', '1 x 1부(07:30-11:30) 성인')}
     ${row('출발 장소', '호텔 근처 픽업 장소')}
     <tr><td>숙박하시는 호텔 주소를 적어주세요. 예약 확정 후 호텔에 따른 지정 픽업 장소를 카카오톡으로 안내 드립니다.:</td>
         <td>와이키키</td></tr>
     ${row('영문 성', '조용진')}
     ${row('영문 이름', '조용진')}
     ${row('전화번호', '+82-01063438385')}
     </table>`,
    '[Klook] 클룩 부분 취소 - 한국어 가이드 - 하와이 거북이 스노클링｜후기 15000개 - 2026-09-12 - - VFT631317',
    'Klook.com <noreply@klook.com>',
);
assert.ok(klookPartial, 'klook 부분취소 파싱 실패');
assert.equal(klookPartial.kind, 'partial_cancel');   // 신규로 오인하면 중복 예약이 생긴다
assert.equal(klookPartial.orderId, 'VFT631317');
assert.equal(klookPartial.tourDate, '2026-09-12');
assert.equal(klookPartial.pax, '1명');               // 취소된 1명이 아니라 **남은** 1명
assert.equal(klookPartial.adultCount, 1);
assert.equal(klookPartial.option, '1부');
assert.equal(klookPartial.name, '조용진');           // 성/이름이 같으면 한 번만
assert.ok(klookPartial.note.includes('취소수량: 1 x 1부(07:30-11:30) 성인'), '취소수량이 note 에 없다');

// ---------------------------------------------------------------- GetYourGuide
const gygNew = parseOtaEmail(
    `<div>
      <h2>[Free Pick-Up]Waikiki Turtle Canyon Snorkel 6-in-1 Activity</h2>
      <p>Reference number</p><p>GYGLMRQN2XFX</p>
      <p>Date</p><p>September 25, 2026 11:00 AM</p>
      <p>Number of participants</p><p>4 x Adults (Age 8 - 99)</p>
      <p>Main customer</p>
      <p>Kyohka Yanagisawa customer-fm6nb7dfd2y7dk7t@reply.getyourguide.comPhone: +818022082909Language: Japanese</p>
      <p>Tour language</p><p>Japanese (Live tour guide)</p>
      <p>Pickup</p><p>Hilton Garden Inn Waikiki Beach, 2330 Kuhio Ave., Honolulu, HI 96815, USA Open in Google Maps</p>
      <p>Price</p><p>$ 418.00</p>
    </div>`,
    'Booking - S257755 - GYGLMRQN2XFX',
    'GetYourGuide <do-not-reply@notification.getyourguide.com>',
);
assert.ok(gygNew, 'gyg new 파싱 실패');
assert.equal(gygNew.kind, 'new');
assert.equal(gygNew.source, 'G');
assert.equal(gygNew.orderId, 'GYGLMRQN2XFX');
assert.equal(gygNew.name, 'Kyohka Yanagisawa');
assert.equal(gygNew.tourDate, '2026-09-25');
assert.equal(gygNew.option, '2부');            // 11:00 AM
assert.equal(gygNew.pax, '4명');
assert.equal(gygNew.adultCount, 4);
assert.ok(gygNew.pickupLocation.startsWith('Hilton Garden Inn'));
assert.ok(!/Open in Google Maps/.test(gygNew.pickupLocation), '"Open in Google Maps" 가 안 떨어졌다');
assert.equal(gygNew.contact, '+818022082909');
assert.equal(gygNew.bookerEmail, 'customer-fm6nb7dfd2y7dk7t@reply.getyourguide.com');
assert.ok(gygNew.note.includes('Japanese'), '언어가 note 에 없다');

const gygCancel = parseOtaEmail(
    `<div>
      <h2>GYG32L3Y4WYM was cancelled</h2>
      <p>Customer: Kevin Conerty</p>
      <p>Tour: [Free Pick-Up] Waikiki Turtle Canyon Snorkel 6-in-1 Activity</p>
      <p>Date: September 7, 2026, 8:00 AM</p>
      <p>Price paid: 95.00 USD</p>
      <p>Cancellation date: September 7, 2026, 8:00 AM</p>
      <p>Cancellation reason: Bad weather conditions</p>
    </div>`,
    'GYG32L3Y4WYM was cancelled',
    'GetYourGuide <do-not-reply@notification.getyourguide.com>',
);
assert.ok(gygCancel, 'gyg cancel 파싱 실패');
assert.equal(gygCancel.kind, 'cancel');
assert.equal(gygCancel.orderId, 'GYG32L3Y4WYM');
assert.equal(gygCancel.tourDate, '2026-09-07');
assert.equal(gygCancel.name, 'Kevin Conerty');
assert.ok(gygCancel.note.includes('Bad weather conditions'), '취소사유가 note 에 없다');

// GYG 취소 제목은 두 가지다: "<REF> was cancelled" 와 "A booking has been canceled - S… - <REF>"
const gygCancel2 = parseOtaEmail(
    '<p>Reference number</p><p>GYG48YHQ5ZB5</p><p>Customer: Pedro Cano castro</p><p>Date: September 7, 2026, 11:00 AM</p>',
    'A booking has been canceled - S257755 - GYG48YHQ5ZB5',
    'GetYourGuide <do-not-reply@notification.getyourguide.com>',
);
assert.ok(gygCancel2, 'gyg cancel(2) 파싱 실패');
assert.equal(gygCancel2.kind, 'cancel');
assert.equal(gygCancel2.orderId, 'GYG48YHQ5ZB5');

// "Booking detail change" = 기존 예약의 픽업/인원 변경. 신규로 오인하면 가짜 예약이 생긴다.
// 바뀐 라벨에 'New' 배지가 붙고 **새 값이 먼저, 취소선 친 옛 값이 그 다음**에 온다.
const gygUpdate = parseOtaEmail(
    `<div>
      <p>Hi Oceanview Activity LLC</p>
      <p>We would like to inform you that the following booking has changed.</p>
      <p>Booking reference</p><p>GYGKBF5Z68G9</p>
      <p>Date</p><p>September 15, 2026 at 11:00 AM</p>
      <p>Pickup location New</p>
      <p>The Buffet At Hyatt, 2424 Kalakaua Ave, Honolulu, HI 96815, USA</p>
      <p>(coordinates: 21.2763612, -157.8250235)</p>
      <p>Open in Google MapsCustomer hasn't specified a pickup location. We will remind them to specify a location.</p>
      <p>Number of participants</p><p>2</p>
      <p>Language</p><p>Japanese</p>
    </div>`,
    'Booking detail change: - S257755 - GYGKBF5Z68G9',
    'GetYourGuide <do-not-reply@notification.getyourguide.com>',
);
assert.ok(gygUpdate, 'gyg 변경 파싱 실패');
assert.equal(gygUpdate.kind, 'update');
assert.equal(gygUpdate.orderId, 'GYGKBF5Z68G9');
assert.equal(gygUpdate.tourDate, '2026-09-15');
assert.equal(gygUpdate.option, '2부');
assert.equal(gygUpdate.pax, '2명');                       // 예전엔 0명
assert.equal(gygUpdate.name, '');                          // 예전엔 "hasn't specified a pickup…"
assert.ok(gygUpdate.pickupLocation.startsWith('The Buffet At Hyatt'),
    `픽업이 잘못 잡혔다: ${gygUpdate.pickupLocation}`);     // 예전엔 "location New"
assert.ok(!/coordinates|Google Maps|hasn't specified/.test(gygUpdate.pickupLocation), '픽업에 군더더기가 남았다');

// 인원만 바뀐 변형: 라벨이 "Number of participants New" 이고 새 값(5) 다음에 옛 값(6)이 온다.
const gygUpdate2 = parseOtaEmail(
    `<div>
      <p>Booking reference</p><p>GYGRFQGY643A</p>
      <p>Date</p><p>September 16, 2026 at 11:00 AM</p>
      <p>Pickup location</p>
      <p>Hilton Garden Inn Waikiki Beach, 2330 Kuhio Ave., Honolulu, HI 96815, USA</p>
      <p>(coordinates: 21.2789, -157.8251052)</p>
      <p>Open in Google Maps</p>
      <p>Number of participants New</p><p>5</p><p>6</p>
      <p>Language</p><p>English</p>
    </div>`,
    'Booking detail change: - S257755 - GYGRFQGY643A',
    'GetYourGuide <do-not-reply@notification.getyourguide.com>',
);
assert.ok(gygUpdate2, 'gyg 변경(2) 파싱 실패');
assert.equal(gygUpdate2.pax, '5명');   // 새 값 5 (옛 값 6 이 아니라)
assert.ok(gygUpdate2.pickupLocation.startsWith('Hilton Garden Inn'));

// ---------------------------------------------------------------- Viator
const viatorNew = parseOtaEmail(
    `<div>
      <h1>Booking Confirmation</h1>
      <p>Booking Reference: BR-1445409731</p>
      <p>Tour Name: [Free Pick-Up] Sunset &amp; Wine Waikiki Turtle Canyon Snorkeling</p>
      <p>Travel Date: Tue, Sep 08, 2026</p>
      <p>Lead Traveler Name: Ashley Sanchez</p>
      <p>Traveler Names: Ashley Sanchez, Passenger Two</p>
      <p>Travelers: 2 Adults</p>
      <p>Product Code: 339097P1</p>
      <p>Tour Grade: [Free Pick-Up] Sunset &amp; Wine Waikiki Turtle Canyon Snorkeling 15:30</p>
      <p>Tour Grade Code: TG1~15:30</p>
      <p>Tour Language: English - Guide</p>
      <p>Net Rate: USD 210.00</p>
      <p>Hotel Pickup: The Ritz-Carlton Residences, Waikiki Beach, 383 Kalaimoku Street</p>
      <p>Special Requirements: No</p>
      <p>Phone: (Alternate Phone)US+1 7736335553 Send the customer a message.</p>
    </div>`,
    'New Booking for Tue, Sep 08, 2026 (#BR-1445409731)',
    'Viator <booking@t1.viator.com>',
);
assert.ok(viatorNew, 'viator new 파싱 실패');
assert.equal(viatorNew.kind, 'new');
assert.equal(viatorNew.source, 'Viator');
assert.equal(viatorNew.orderId, 'BR-1445409731');
assert.equal(viatorNew.name, 'Ashley Sanchez');
assert.equal(viatorNew.tourDate, '2026-09-08');
assert.equal(viatorNew.option, '3부');           // 15:30
assert.equal(viatorNew.pax, '2명');
assert.equal(viatorNew.adultCount, 2);
assert.ok(viatorNew.pickupLocation.startsWith('The Ritz-Carlton'));
assert.equal(viatorNew.contact, '+1 7736335553');   // "(Alternate Phone)US" 와 안내문구는 떼어낸다

// 호텔 미정이면 값이 콜론으로 끝난다. 다음 줄(Special Requirements)을 값으로 가져오면 안 된다.
const viatorNoHotel = parseOtaEmail(
    `<div>
      <p>Booking Reference: BR-1445482253</p>
      <p>Travel Date: Wed, Sep 30, 2026</p>
      <p>Lead Traveler Name: Lily Allen</p>
      <p>Travelers: 2 Adults</p>
      <p>Tour Grade Code: TG1~15:30</p>
      <p>Hotel Pickup: My hotel is not yet booked: ⁦⁩</p>
      <p>Special Requirements: No</p>
      <p>Phone: (Alternate Phone)AU+61 0478 174 157 Send the customer a message.</p>
    </div>`,
    'New Booking for Wed, Sep 30, 2026 (#BR-1445482253)',
    'Viator <booking@t1.viator.com>',
);
assert.ok(viatorNoHotel, 'viator 호텔미정 파싱 실패');
assert.ok(!/Special Requirements/.test(viatorNoHotel.pickupLocation),
    `픽업에 다음 줄이 새어 들어왔다: ${viatorNoHotel.pickupLocation}`);

const viatorCancel = parseOtaEmail(
    `<div>
      <h1>Booking Canceled</h1>
      <p>Booking Reference: #BR-1445149027</p>
      <p>Canceled</p>
      <p>[Free Pickup]Waikiki Turtle Canyon Snorkeling &amp; 6-in-1 Activities</p>
      <p>Tour Option: Waikiki Turtle Canyon Snorkeling Adventure 10:30</p>
      <p>Location: Honolulu, United States</p>
      <p>Travel Date: Tue, Sep 08, 2026</p>
      <p>Travelers: 2 Adults</p>
      <p>Lead Traveler Name: Jillian Lane</p>
    </div>`,
    'Cancelled Booking: Tue, Sep 08, 2026',
    'Viator <booking@t1.viator.com>',
);
assert.ok(viatorCancel, 'viator cancel 파싱 실패');
assert.equal(viatorCancel.kind, 'cancel');
assert.equal(viatorCancel.orderId, 'BR-1445149027');   // '#' 접두사가 붙어도 뽑혀야 한다
assert.equal(viatorCancel.tourDate, '2026-09-08');
assert.equal(viatorCancel.option, '2부');              // 10:30 = 2부 픽업 시각
assert.equal(viatorCancel.name, 'Jillian Lane');

// Viator 는 "Canceled Booking"(L 하나) 으로도 보낸다.
assert.equal(
    parseOtaEmail('<p>Booking Reference: BR-1447442765</p><p>Travel Date: Thu, Jan 28, 2027</p><p>Lead Traveler Name: Jazmine Passley-Jones</p>',
        'Canceled Booking: Thu, Jan 28, 2027', 'Viator <booking@t1.viator.com>')?.kind,
    'cancel',
);

// Viator 가 싣는 시각은 출항 시각이 아니라 **픽업 시각** 이다 (07:30 / 10:30 / 15:30).
const viatorGrade = (code: string) => parseOtaEmail(
    `<div>
      <p>Booking Reference: BR-1446705169</p>
      <p>Travel Date: Mon, Jan 04, 2027</p>
      <p>Lead Traveler Name: CHRISTOPHER TAPIA</p>
      <p>Travelers: 5 Adults</p>
      <p>Tour Grade: Waikiki Turtle Canyon Snorkeling Adventure${code ? ` ${code}` : ''}</p>
      <p>Tour Grade Code: TG1${code ? `~${code}` : ''}</p>
    </div>`,
    'New Booking for Mon, Jan 04, 2027 (#BR-1446705169)',
    'Viator <booking@t1.viator.com>',
);
assert.equal(viatorGrade('07:30')?.option, '1부');
assert.equal(viatorGrade('10:30')?.option, '2부');   // 예전엔 1부로 잘못 들어갔다
assert.equal(viatorGrade('15:30')?.option, '3부');
assert.equal(viatorGrade('')?.option, '');           // 시각이 아예 없는 예약도 있다

// ---------------------------------------------------------------- 여기어때
const yeogiNew = parseOtaEmail(
    `<div>
      <p>• 상품: [통합후기 15,000개·하와이필수코스·무료픽업]거북이스노클링+5종해양+라면+인생샷+크루즈</p>
      <p>• 옵션: 1부, 2부 거북이 스노클링 / 거북이 스노클링+선셋&amp;와인 크루즈 07:30</p>
      <p>• 추가 옵션: -</p>
      <p>• 총 인원: 2명 (성인x2)</p>
      <p>• 이용일: 2026.10.03(토)</p>
      <p>예약 확인하기: https://tna.goodchoice.kr/reservation/detail/260909100034E9GT1</p>
    </div>`,
    '[여기어때] 예약이 확정되었어요. 예약 내용을 꼭 확인해주세요.',
    '여기어때 <noreply@yeogi.com>',
);
assert.ok(yeogiNew, 'yeogi new 파싱 실패');
assert.equal(yeogiNew.kind, 'new');
assert.equal(yeogiNew.source, '여기어때');
assert.equal(yeogiNew.orderId, '260909100034E9GT1');
assert.equal(yeogiNew.tourDate, '2026-10-03');
// 옵션명 앞에 "1부, 2부" 가 둘 다 적혀 있어도 맨 뒤 시각(07:30)으로 판단해야 한다
assert.equal(yeogiNew.option, '1부');
assert.equal(yeogiNew.pax, '2명');
assert.equal(yeogiNew.adultCount, 2);
assert.ok(yeogiNew.note.includes('260909100034E9GT1'), '예약확인 URL 이 note 에 없다');

// 여기어때 취소 메일은 아직 포맷을 모른다 → 파싱하지 말고 안읽음으로 남겨야 한다
assert.equal(
    parseOtaEmail('<p>예약이 취소되었습니다</p>', '[여기어때] 예약이 취소되었어요.', '여기어때 <noreply@yeogi.com>'),
    null,
    '여기어때 취소 메일은 아직 null 이어야 한다',
);

console.log('OK — 17건 파싱 + 여기어때 취소 보류 확인');
