# OTA(클룩·GetYourGuide·Viator·여기어때) 예약 메일 자동 등록 — 구현 계획서

작성일: 2026-09-08 (여기어때 추가 반영)

## 0. 목표

hioceanstar@gmail.com 으로 들어오는 Klook / GetYourGuide / Viator / 여기어때 메일을 5분마다 자동 파싱:

- **신규 예약 메일** → `reservations` INSERT, 상태 **`안내필요`**
  운영자가 나중에 손님에게 직접 안내를 보낸 뒤 상태를 `예약확정`으로 변경.
- **취소 메일** → 기존 예약을 찾아 상태 **`취소요청`** 으로 UPDATE (`취소`로 바로 바꾸지 않음)
  → 기존 **취소요청 화면**(`/dashboard/alerts` · `/dashboard/refunds`)에서 한눈에 모아 보고 처리.

## 1. 현황 (조사 결과)

| 항목 | 현재 상태 |
|---|---|
| 메일 수집 | `src/app/api/cron/check-myrealtrip-emails/route.ts` 가 이미 IMAP(imapflow)+mailparser로 5분마다 동작 중 |
| 파서 | `src/lib/myrealTripEmailParser.ts` — 라벨/값 추출 방식 |
| IMAP 계정 | `IMAP_EMAIL=oceanstar1942@gmail.com` (**OTA 메일함과 다름**) |
| source 값 (DB 실측) | Klook=`클록`(62건), GetYourGuide=`G`(233건), Viator=`Viator`(61건), 여기어때=`여기어때`(1건) |
| status 값 (DB 실측) | `예약확정`(5352) / `취소`(204) / `예약대기`(2) — **`안내필요` 없음** |
| 취소요청 화면 | `CancellationRequestsView`(alerts 탭) + `RefundView`(refunds) 둘 다 `status='취소요청'` 조회 → **새로 만들 화면 없음** |
| 비-Stripe 취소 처리 | `CancellationRequestsView` 에 이미 "Stripe 결제가 아닌 예약" 분기 존재 → 수기 환불 메모 남기고 `취소` 로 마감. OTA 건도 그대로 탐 |
| option 값 (DB 실측) | `1부`/`2부`/`3부`/`패러`/`프라이빗` 5종만 사용 |
| 상태 필터 관행 | 거의 모든 화면이 `.neq('status','취소')` → 새 상태를 넣어도 정원계산·차량배정·리스트에 자동 포함됨 (**낮은 리스크**) |

**결론: 기존 MRT cron과 동일한 패턴을 그대로 복제하면 됨. 새 인프라 불필요.**

## 2. 선결 과제 2가지 (코드보다 먼저)

### (1) 메일함 접근
OTA 메일은 `hioceanstar@gmail.com` 인데 현재 IMAP 자격증명은 `oceanstar1942@gmail.com`.

- **A안 (권장, 코드 0줄)**: hioceanstar Gmail에서 klook/getyourguide/viator 메일을
  oceanstar1942 로 **자동 전달** 필터 설정. Gmail 전달은 원본 `From` 을 유지하므로
  `from:` 기준 IMAP 검색이 그대로 동작.
- **B안**: `IMAP_EMAIL_OTA` / `IMAP_PW_OTA` 환경변수 추가 (앱 비밀번호 발급 필요).

→ 코드는 `process.env.IMAP_EMAIL_OTA ?? process.env.IMAP_EMAIL` 로 **한 줄** 처리해서
   A안·B안 어느 쪽을 골라도 동작하게 함.

### (2) status 컬럼 제약 확인 — ✅ 해결됨
`안내필요` 로 실제 INSERT → 성공 → 즉시 DELETE 로 확인 완료.
`reservations.status` 에 CHECK 제약이 없어 **마이그레이션 불필요**.

## 3. 파일 변경 목록 (신규 2 · 수정 4)

### 신규
0. `src/lib/nearestPickup.ts` — 호텔 주소 → 지오코딩 → 가장 가까운 픽업 장소 (§4-1)
1. `src/lib/otaEmailParser.ts` — 4개 플랫폼 파서 + 공통 결과 타입 + **신규/취소 메일 구분**
2. `src/app/api/cron/check-ota-emails/route.ts` — IMAP 조회 → 신규 INSERT / 취소 UPDATE

### 수정
3. `vercel.json` — cron 1줄 추가 (`2-59/5 * * * *`, MRT cron과 시각 어긋나게)
4. `src/components/editors/StatusEditor.tsx` — `안내필요` 선택지 추가 (보라)
5. `src/app/(ko)/(admin)/dashboard/all/page.tsx:1605` + `src/components/reservations/NewReservationsView.tsx:90` — `안내필요` 색상
6. `src/components/dashboard/NotificationBell.tsx:15` — `ALERT_STATUSES` 에 `안내필요` 추가 → 종 알림에 뜸
   (`취소요청` 은 이미 들어 있어 취소 건은 자동으로 알림/뱃지에 잡힘)

### 검증용
7. `scripts/test_ota_parser.ts` — assert 자체검사 (`node scripts/test_ota_parser.ts`)
8. `scripts/check_ota_inbox.ts` — **읽기전용(EXAMINE)** 으로 실제 메일함을 훑어 파싱 결과를 눈으로 확인
   (`node scripts/check_ota_inbox.ts`, 읽음 처리 안 함)

## 4. 파서 상세 (스크린샷 기준 필드 매핑)

공통 출력 타입:

```ts
type OtaEmailKind = 'new' | 'cancel';

interface OtaBooking {
  kind: OtaEmailKind;
  platform: 'klook' | 'gyg' | 'viator' | 'yeogi';
  source: '클록' | 'G' | 'Viator' | '여기어때';
  orderId: string;
  name: string;
  tourDate: string;      // YYYY-MM-DD
  option: string;        // 1부 | 2부 | 3부
  pax: string;           // "2명"
  adultCount: number;
  childCount: number;
  pickupLocation: string;
  contact: string;
  bookerEmail: string;
  note: string;
}
// kind='cancel' 이면 orderId 만 필수. 나머지는 비어 있어도 됨.
```

### Klook (`from: klook`)
| 메일 라벨 | → 컬럼 |
|---|---|
| `예약 확인 ID` (BRH011102) | order_id |
| `요청 날짜` (2026-09-18) | tour_date |
| `영문 이름` + `영문 성` (nahe kang) | name — `대표 예약자명`이 `()` 처럼 비어 오는 케이스 있어 영문 성/이름 우선 |
| `여행자` (`2 x 1부(07:30-11:30) 성인`) | pax `2명`, option `1부`, adult_count 2 |
| `숙박하시는 호텔 주소…` (Hyatt Regency Waikiki…) | pickup_location |
| `전화번호` (없으면 `대표 예약자 핸드폰 번호`) | contact |
| `대표 예약자 이메일 주소` | booker_email |
| `카카오톡` + 패키지명 | note |

### GetYourGuide (`from: getyourguide`)
| 메일 라벨 | → 컬럼 |
|---|---|
| `Reference number` (GYGLMRQN2XFX) | order_id |
| `Date` (September 25, 2026 11:00 AM) | tour_date + 시간 → option |
| `Number of participants` (`4 x Adults`) | pax `4명`, adult_count 4 |
| `Main customer` (Kyohka Yanagisawa) | name |
| `Phone` (+818022082909) | contact |
| 고객 이메일 (`…@reply.getyourguide.com`) | booker_email |
| `Pickup` (Hilton Garden Inn Waikiki Beach) | pickup_location |
| `Tour language` + `Price` | note (**일본어/중국어 가이드 여부는 안내 시 중요 → note 필수**) |

### Viator (`from: viator`)
| 메일 라벨 | → 컬럼 |
|---|---|
| `Booking Reference` (BR-1445409731) | order_id |
| `Travel Date` (Tue, Sep 08, 2026) | tour_date |
| `Tour Grade Code` (`TG1~15:30`) | 시간 → option (`3부`) |
| `Travelers` (`2 Adults`) | pax, adult_count |
| `Lead Traveler Name` (Ashley Sanchez) | name |
| `Hotel Pickup` (The Ritz-Carlton Residences…) | pickup_location |
| `Phone` (+1 7736335553) | contact |
| `Net Rate` (USD 210.00) + `Tour Language` | note |

### 여기어때 (`from: yeogi` / `noreply@yeogi.com`)

제목: `[여기어때] 예약이 확정되었어요. 예약 내용을 꼭 확인해주세요.`
본문(짧은 불릿 형식, HTML이 아니라 거의 평문):

```
• 상품: [통합후기 15,000개·하와이필수코스·무료픽업]거북이스노클링+5종해양+라면+인생샷+크루즈
• 옵션: 1부, 2부 거북이 스노클링 / 거북이 스노클링+선셋&와인 크루즈 07:30
• 추가 옵션: -
• 총 인원: 2명 (성인x2)
• 이용일: 2026.10.03(토)

예약 확인하기: https://tna.goodchoice.kr/reservation/detail/260909100034E9GT1
```

| 메일 항목 | → 컬럼 | 비고 |
|---|---|---|
| 예약확인 URL 끝 토큰 (`260909100034E9GT1`) | order_id | **별도 예약번호 필드가 없음** → URL `/reservation/detail/([A-Z0-9]+)` 에서 추출 |
| `이용일: 2026.10.03(토)` | tour_date | `YYYY.MM.DD` → `YYYY-MM-DD` 변환, 요일 괄호 제거 |
| `옵션:` 끝의 시각 `07:30` | option → `1부` | ✅ 운영자 확인: **맨 뒤 시각으로 판단**. 앞부분("1부, 2부 … / … 크루즈")은 옵션 그룹명 전체라 무시 |
| `총 인원: 2명 (성인x2)` | pax `2명`, adult_count 2 | `아동x1` 이 있으면 child_count 로 |
| `상품:` + 옵션 원문 + 예약확인 URL | note | 운영자가 링크 눌러 상세 확인해야 하므로 **URL 은 note 에 반드시 저장** |
| — | name | ⚠️ **메일에 고객명이 없음** → `(여기어때 확인필요)` 로 넣음 |
| — | contact / booker_email / pickup_location | ⚠️ **없음** → 빈 값 |

> 여기어때는 4개 플랫폼 중 **정보가 가장 부족**함. 이름·연락처·픽업이 전부 없어서
> 자동 등록의 목적이 "예약 존재 + 날짜 + 인원 + 정원 반영" 까지임.
> 나머지는 운영자가 `안내필요` 처리하면서 예약확인 링크로 채움. (§7 리스크 참고)

### 시간 → option 매핑

⚠️ **플랫폼이 싣는 시각은 출항 시각이 아니라 픽업 시각인 경우가 많다.**

| | 1부 | 2부 | 3부 |
|---|---|---|---|
| `tour_settings` 출항 | 08:00 | 11:00 | 15:00 |
| 픽업 시각 (클룩·Viator) | 07:30 | **10:30** | 15:30 |

```
경계를 10시 / 14시 에 둔다 → 출항 시각이 와도 픽업 시각이 와도 같은 부로 떨어진다
  h < 10  → 1부   (07:30 · 08:00)
  h < 14  → 2부   (10:30 · 11:00)
  그 외    → 3부   (14:30 · 15:00 · 15:30)
시각을 못 찾으면 option = '' (운영자가 직접 채움)
```

Viator 는 `Tour Grade Code` 가 `TG1~10:30` 이기도 하고 시각 없이 `TG1` 이기도 해서
`Tour Grade Code` / `Tour Grade` / `Tour Option` 셋을 이어 붙인 뒤 시각을 찾는다.
셋 다 시각이 없는 예약도 실제로 존재한다(최근 60일 97통 중 36통).

### 신규 / 취소 메일 구분 — **실제 취소 메일 샘플로 확정됨**

| 플랫폼 | 취소 메일 제목 (실측) | 판정 기준 |
|---|---|---|
| Klook | `[Klook] 클룩 확정된 예약 취소 - […] - 2026-09-18 - 「Klook Canceled」` | 제목에 `Klook Canceled` **또는** `예약 취소` |
| Viator | `Cancelled Booking: Tue, Sep 08, 2026` | 제목에 `Cancelled Booking` **또는** 본문에 `Booking Canceled` |
| GetYourGuide | `GYG32L3Y4WYM was cancelled` | 제목에 `was cancelled` |
| 여기어때 | ⚠️ **샘플 없음 → 이번 범위 제외** | 취소 처리 안 함 (§9) |

- 위 조건에 걸리면 `kind='cancel'`, 아니면 `kind='new'`.
- 판정은 **제목 우선**. 본문 키워드는 Viator 만 보조로 사용 (`cancellation policy` 같은 오탐 회피).
- **여기어때는 신규(확정) 메일만 처리.** 취소 메일 샘플이 없어 이번 범위에서 뺌.
  대신 여기어때 메일은 **제목에 `확정` 이 있을 때만 신규로 INSERT** 하고,
  그 외 제목은 전부 **파싱 실패 처리(= `\Seen` 안 붙임 → 안읽음으로 남음)**.
  → 나중에 취소 메일이 오면 받은편지함에 안읽음으로 남아 바로 눈에 띔.
    그 1건을 캡처해서 룰 추가하면 끝. 잘못된 자동 처리 위험 0.

### 취소 메일 본문 구조 (신규 메일과 다른 점)

**Klook** — 본문 레이아웃이 신규 메일과 **완전히 동일**. 리드 문장만 다름
(`논의한 바와 같이 다음 클룩 주문이 취소되었습니다.`).
→ **본문 필드로는 신규/취소를 구분할 수 없음. 반드시 제목으로 판정.**
`예약 확인 ID: BRH011102` 그대로 있음 → 매칭 OK.

**Viator** — 신규 메일보다 필드가 **적음**
```
Booking Reference: #BR-1445149027     ← 신규와 달리 '#' 접두사가 붙음 → 정규식 /BR-\d+/ 로 추출
Canceled
Tour Option: Waikiki Turtle Canyon Snorkeling Adventure 10:30   ← 신규는 'Tour Grade'
Travel Date: Tue, Sep 08, 2026
Travelers: 2 Adults
Lead Traveler Name: Jillian Lane
(Hotel Pickup · Phone · Net Rate 없음)
```
→ 파서는 `Tour Grade` / `Tour Option` 둘 다 보고, 없으면 본문에서 `\d{1,2}:\d{2}` 를 찾음.

**GetYourGuide** — 신규 메일과 완전히 다른 짧은 포맷
```
GYG32L3Y4WYM was cancelled            ← 예약번호. 정규식 /GYG[A-Z0-9]{6,}/
Customer: Kevin Conerty
Tour: [Free Pick-Up] Waikiki Turtle Canyon Snorkel 6-in-1 Activity
Date: September 7, 2026, 8:00 AM
Price paid: 95.00 USD
Cancellation date: September 7, 2026, 8:00 AM
Cancellation reason: Bad weather conditions   ← ★ note 에 반드시 기록
```
→ **취소 사유가 오는 유일한 플랫폼.** `Bad weather conditions` 처럼 우리 쪽 결항이 원인인 경우도
   있으므로 사유를 note 에 남겨야 나중에 원인 파악이 됨.

### GYG "Booking detail change" (픽업·인원·날짜 변경)

기존 예약이 바뀐 메일이다. **신규가 아니다.** 본문 구조:

```
Booking reference
GYGKBF5Z68G9
Date
September 15, 2026 at 11:00 AM
Pickup location New                ← 바뀐 항목 라벨에 'New' 배지가 붙는다
The Buffet At Hyatt, 2424 Kalākaua Ave, Honolulu, HI 96815, USA   ← 새 값
(coordinates: 21.2763612, -157.8250235)
Open in Google MapsCustomer hasn't specified a pickup location…   ← 옛 값(취소선)
Number of participants
2
Language
Japanese
```

- **새 값이 먼저, 취소선 친 옛 값이 그 다음**에 온다 → 라벨 다음 첫 줄만 본다.
- 인원 변경일 때는 `Number of participants New` / `5`(새) / `6`(옛) 형태가 된다.
- 고객명·연락처가 없다 → **매칭되는 예약이 없으면 아무것도 만들지 않는다.**
- **투어일·옵션·인원·픽업 네 가지를 모두 비교**한다. 날짜만 바뀌는 변경도 실제로 온다.
- 인원은 총원만 오고 성인/아동 구분이 없다 → `pax` 만 갱신하고 `adult_count`/`child_count` 는 손대지 않는다.
- 좌표까지 주지만 주소 문자열로 지오코딩해도 같은 결과라 좌표는 쓰지 않는다.

### 취소 메일에서 필요한 필드는 사실상 예약번호 하나

세 플랫폼 모두 취소 메일에 예약번호를 그대로 실어 보냄:

| 플랫폼 | 정규식 | 예시 |
|---|---|---|
| Klook | `예약 확인 ID` 라벨 추출 | `BRH011102` |
| Viator | `/BR-\d+/` | `BR-1445149027` |
| GetYourGuide | `/GYG[A-Z0-9]{6,}/` | `GYG32L3Y4WYM` |
| 여기어때 | `/reservation\/detail\/([A-Z0-9]+)/` | `260909100034E9GT1` |

보조 매칭용으로 이름·투어일도 같이 뽑아 둠 (Klook=영문 성/이름, Viator=`Lead Traveler Name`,
GYG=`Customer`).

## 4-1. 픽업 장소 자동 매칭

OTA 메일은 픽업 장소가 아니라 **손님이 묵는 호텔 이름/주소**를 준다.
그대로 넣으면 기사님이 못 쓰므로 `pickup_locations` 중 가장 가까운 곳으로 바꾼다.

```
호텔 문자열
  → 이미 우리 픽업 장소명이면(프린스/HGI/리츠칼튼…) 그대로 사용
  → 아니면 Google Geocoding 으로 좌표 변환 (지역 없으면 ", Honolulu, HI" 를 붙임)
  → 기존 findClosestPickup() (src/lib/utils.ts) 으로 최근접 계산
  → 2km 초과면 픽업 권역 밖으로 보고 **원문 그대로 둠** (코올리나 등)
  → 치환한 경우 원문 주소를 note 에 `주소: …` 로 남김
```

실측 검증 (실제 pickup_locations 좌표 + 실제 Geocoding):

| 메일에 온 문자열 | 매칭 결과 | 거리 |
|---|---|---|
| Hyatt Regency Waikiki Beach Resort And Spa | 녹색천막 | 59m |
| Hilton Garden Inn Waikiki Beach, 2330 Kuhio Ave. | HGI | 39m |
| The Ritz-Carlton Residences, 383 Kalaimoku Street | 리츠칼튼 | 50m |
| Sheraton Waikiki | HM | 184m |
| Four Seasons Resort Oahu at Ko Olina | (원문 유지) | 28.6km → 권역 밖 |

- 기존 `findClosestPickup()` 을 그대로 재사용 — 손님 예약 페이지가 쓰는 것과 같은 계산.
- API 키는 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 를 서버에서 그대로 사용(동작 확인 완료).
- 여기어때는 주소 자체가 없어서 이 단계가 돌지 않는다.

## 4-2. 실제 메일함으로 확인한 것 (2026-09-08, 최근 30일)

제목 종류를 전수 조사한 결과:

| 플랫폼 | 제목 패턴 | 건수 | 처리 |
|---|---|---|---|
| Klook | `[Klook] 클룩 예약내역 확정 - …` | 26 | 신규 |
| Klook | `[Klook] 클룩 확정된 예약 취소 - … 「Klook Canceled」` | 2 | 취소 |
| Klook | **`[Klook] 클룩 부분 취소 - … - VFT631317`** | — | 부분취소 ← 제목에 `예약` 이 없다 |
| Klook | `[Klook] 클룩 예약 요청 - …` | 1 | 신규 취급(확정 메일이 뒤따라 오면 중복 스킵) |
| Klook | `Cost modification validated` / 영문 고객문의 | 7 | 제목 필터에서 제외 |
| GYG | `Booking - S… - GYG…` | 98 | 신규 |
| GYG | `Urgent: New booking received - S… - GYG…` | 50 | 신규 |
| GYG | `GYG… was cancelled` | 12 | 취소 |
| GYG | **`A booking has been canceled - S… - GYG…`** | 6 | 취소 ← 이 형태를 처음에 놓쳤었음 |
| GYG | **`Booking detail change: - S… - GYG…`** | 6 | **변경** ← 신규로 오인해 가짜 예약을 만들던 형태 |
| GYG | `You have a message about a booking` 등 | 13 | 파싱 실패 → 안읽음 유지 |
| Viator | `New Booking for …(#BR-…)` / `Cancelled Booking: …` | 30 | 신규/취소 |
| Viator | 마케팅·정산·케이스 메일 | 24 | 제목 필터에서 제외 |
| 여기어때 | `[여기어때] 예약이 확정되었어요…` | 1 | 신규 |
| 여기어때 | 이메일 인증·상품 심사·계약서 등 | 13 | 제목 필터에서 제외 |

### 제목 필터 (`OTA_SUBJECT`)

마케팅·문의 메일까지 다 긁어오면 파싱 실패만 쌓이므로 **IMAP 검색 단계에서** 걸러낸다.

```
klook  : ['예약', '취소']         32/36 통만 통과  ← '부분 취소' 제목에 '예약' 이 없어 '취소' 를 추가
gyg    : ['Booking', 'cancelled'] 199/234
viator : ['Booking']              30/54
yeogi  : ['예약']                 1/14
```

> ⚠️ Gmail 의 IMAP SUBJECT 검색은 **단어 단위**다. `GYG` 로 검색하면 `GYG7VKNBZW4M` 이 안 잡힌다.
> 그래서 GYG 만 검색어를 두 개로 나눴다. 한글 검색어는 정상 동작 확인.

### 실제 메일에서 발견해 고친 것

| 증상 | 원인 | 수정 |
|---|---|---|
| 클룩 예약번호 fallback 미작동 | 실제 ID 가 `BRH…` 가 아니라 `TAH479224` (영문3+숫자6) | 정규식 교체 |
| GYG 고객명이 `Goldie Shao customer-…@….comPhone: +86…Language: English` | 이름·이메일·전화·언어가 **한 줄로 붙어서** 옴 | `Phone:` 로 자르고 이메일 위치에서 이름 분리 |
| GYG 픽업에 `Open in Google Maps` 가 붙음 | 링크 텍스트 | 접미사 제거 |
| Viator 연락처에 `(Alternate Phone)AU…Send the customer a message.` | 안내문구 포함 | `phoneOf()` 로 번호만 추출 |
| **Viator 픽업이 `Special Requirements: No` 로 들어감** | `Hotel Pickup: My hotel is not yet booked:` 처럼 값이 `:` 로 끝나자 다음 줄을 값으로 오인 | 라벨 바로 뒤 콜론 유무로 구분 |
| **GYG 변경 메일이 가짜 예약으로 INSERT 됨** | 제목에 `Booking` 이 있어 필터를 통과하고, 취소 키워드가 없어 `new` 로 판정. 게다가 `Main customer` 가 없어 `Customer` 폴백이 취소선 문장 "Customer hasn't specified a pickup location…" 을 **이름**으로, `Pickup location New` 를 픽업으로, `Number of participants: 2`(x 형식 아님)를 **0명**으로 읽음 | `detail change` 를 별도 kind 로 분리 + `Customer` 폴백을 라벨 형태로 한정 + 총원만 오는 인원 처리 |
| **클룩 부분취소를 신규 예약으로 오인** | 제목에 `예약`·`Klook Canceled` 가 없음 → `new` 판정 → 중복 INSERT 위험. IMAP 제목 필터에도 안 걸림 | `부분 취소` 를 먼저 판정 + 제목 필터에 `취소` 추가 |
| 부분취소 인원을 '취소된 수량' 으로 잘못 읽음 | 부분취소 메일엔 `여행자` 가 없고 `취소된 수량`/`남은 수량` 이 옴 | **남은 수량** 기준으로 인원·옵션 계산 |
| 이름이 `조용진 조용진` | 손님이 영문 성/이름에 같은 값을 적음 | 같으면 한 번만 |
| **10:30 픽업 예약이 전부 1부로 입력됨** | 경계를 출항 시각(11시)에 둬서 `10:30` 이 1부로 떨어짐. Viator 는 07:30/10:30/15:30, 클룩은 `2부(10:30-14:30)` 로 **픽업 시각**을 싣는다 | 경계를 10시/14시로 이동 |
| 픽업 미정인데 억지로 픽업지 추천 | 구글이 `My hotel is not yet booked:` 에도 호놀룰루 중심좌표를 OK 로 반환 | 결과 `types` 가 `locality,political` 뿐이면 **주소 아님**으로 판정 |

### 픽업 매칭 실측 (실제 메일에 온 문자열 그대로)

| 메일 원문 | 결과 |
|---|---|
| `Waikiki resort hotel` | WR (54m) |
| `와이키키 말리아(2211 Kūhiō Ave. …)` | HM (236m) |
| `와이키키 반얀` | HP (73m) |
| `Hyatt Regency Waikiki Beach Resort And Spa` | 녹색천막 (59m) |
| `403 Kalaimoku St, …` | 리츠칼튼 (12m) |
| `Prince Waikiki, 100 Holomoana St, …` | 프린스 (3m) |
| `Ka La'i Waikiki Beach, LXR …` | 카라이 (52m) |
| `Hyatt Place Waikiki Beach, 175 Paoakalani Ave` | HP (26m) |
| `My hotel is not yet booked:` | 원문 유지 (주소 아님) |

## 5. Cron 동작 규칙 (MRT cron과 동일)

1. `CRON_SECRET` 인증
2. IMAP INBOX 에서 `UNSEEN` + `from: klook|getyourguide|viator|yeogi` + 최근 2일 검색
   (imapflow 의 `from` 은 값 1개만 받으므로 **플랫폼별로 4회 검색**)
3. 파싱 실패 → **`\Seen` 처리하지 않음** (다음 실행에서 재시도, 데이터 유실 방지)
4. `order_id` 중복 체크 → 이미 있으면 스킵 + `\Seen`
5. **신규 메일** → INSERT: `status='안내필요'`, `source=플랫폼코드`,
   `receipt_date=getDynamicReceiptDateStr()`, `is_admin_checked=false`
6. **취소 메일** → 기존 예약 검색 후 UPDATE:
   ```
   status = '취소요청'
   cancel_requested_at = now()          ← RefundView 가 이 컬럼으로 정렬함
   is_admin_checked = false             ← 알림에 다시 뜨게
   note = 기존note + ' [OTA 취소메일 수신: 2026-09-08 / 클록 / 사유: Bad weather conditions]'
   ```
   - 매칭 키 1순위: `order_id`
   - 매칭 키 2순위(수기 입력분 대비): `source` + `name` + `tour_date`
   - 이미 `취소` 인 건은 건드리지 않음 (되살아나면 안 됨)
   - 사유는 GYG 만 옴. 나머지는 사유 없이 기록
   - **못 찾으면**: INSERT 하지 않고 Discord 알림 `⚠️ 취소메일인데 매칭 예약 없음` 발송 후 `\Seen`
7. **부분 취소 메일** → 기존 예약의 **인원만** 줄인다:
   ```
   pax / adult_count / child_count = 남은 수량
   status = '안내필요'                 ← 취소요청으로 보내지 않는다 (아래 이유)
   is_admin_checked = false
   note = 기존note + ' [클록 부분취소 수신: … / 취소 1 x 1부 / 2명 → 1명]'
   ```
   - **취소요청으로 보내면 안 되는 이유**: 취소요청 화면의 처리 버튼은 상태를 `취소` 로 마감한다.
     부분 취소는 남은 손님이 있어서 그렇게 닫히면 **남은 손님까지 사라진다.**
   - 남은 수량이 0이면 사실상 전체 취소 → 그때만 `취소요청` 으로 넘긴다.
   - 매칭 실패 시 INSERT 하지 않고 Discord 알림 (전체 취소와 동일)
8. **Discord 알림 (§5-1 참고)**
9. 성공 시 `\Seen`

### 5-1. Discord 알림 규칙

**변경·부분취소·취소는 투어일과 무관하게 무조건 알린다.** 놓치면 손님이 엉뚱한 날·시간에 기다린다.

| 상황 | 알림 | 제목 |
|---|---|---|
| **날짜·옵션·인원·픽업 변경 반영** | **항상** | `🔄 [예약변경] 날짜·인원·픽업이 바뀌었습니다` |
| **부분취소 반영** | **항상** | `✂️ [부분취소] 인원이 줄었습니다` |
| **취소요청 전환** | **항상** | `❌ [취소요청] OTA 취소 접수` |
| 변경/취소인데 매칭 예약 없음 | 항상 | `⚠️ [예약변경\|부분취소\|취소] 매칭되는 예약을 못 찾음` |
| 신규 예약 — 당일/전날 투어 | 발송 | `🚨 [안내필요] OTA 긴급 예약!` |
| 신규 예약 — 그 외 | 발송 안 함 (기존 MRT 와 동일) | — |
| 실제로 바뀐 값이 없는 변경 메일 | 발송 안 함 | 상태도 건드리지 않는다 |

알림에는 **무엇이 어떻게 바뀌었는지**가 `📝 변경내용` 필드로 같이 간다:

```
🔄 [예약변경] 날짜·인원·픽업이 바뀌었습니다
  👤 고객명   いと れ        📅 투어일  2026-09-15
  🎯 옵션     2부            📋 출처    G
  👥 인원     2명            🔖 예약번호 GYGKBF5Z68G9
  📍 픽업장소 녹색천막
  📝 변경내용 투어일 2026-09-15 → 2026-09-16 / 픽업 HGI → 녹색천막
```

`sendDiscordUrgentAlert()` 에 `detail` 파라미터를 하나 추가했다(기존 MRT cron 은 안 넘기므로 영향 없음).

**알림이 실패하면?** DB 는 이미 갱신됐고 상태가 `안내필요`/`취소요청` 이라
대시보드 종 알림(`NotificationBell`)에 그대로 남는다. 즉 알림 경로가 둘이라 한쪽이 죽어도 안 놓친다.
로그에는 `⚠️ Discord 알림 실패` 로 크게 남긴다.

## 6. 운영 흐름

**신규 예약**
```
OTA 예약 메일 도착
  → (5분 내) 자동 INSERT, 상태 [안내필요]
  → 대시보드 종 알림 + 목록에서 보라색으로 표시
  → 운영자가 손님에게 안내 발송
  → 상태를 [예약확정] 으로 직접 변경  ← 수동
```

**부분 취소** (클룩에서 확인됨)
```
2명 예약 중 1명만 취소되는 메일 도착
  → 기존 예약의 인원을 [남은 수량] 으로 수정 (2명 → 1명)
  → 상태 [안내필요] + 메모에 "취소 1 x 1부 / 2명 → 1명" 기록 + Discord 알림
  → 운영자가 확인하고 [예약확정] 으로 되돌림  ← 수동
```

**취소**
```
OTA 취소 메일 도착
  → (5분 내) 기존 예약을 찾아 상태 [취소요청] 으로 변경 + 메모에 수신일시 기록
  → /dashboard/alerts 의 "취소 요청" 탭 (또는 /dashboard/refunds) 에 모여서 보임
  → 운영자가 클릭 → 기존 수기환불 모달 (환불액은 비워도 됨, 실제 환불은 플랫폼이 처리)
  → 상태 [취소] 로 마감  ← 수동
```

- 안내 발송 여부를 담는 별도 컬럼/플래그는 만들지 않음 (상태값 하나로 충분).
- **`취소` 로 바로 바꾸지 않는 이유**: 운영자가 취소 사실을 눈으로 확인하고
  차량 배정·정원·정산에서 빼는 판단을 직접 하게 하기 위함. 자동 `취소` 는 조용히 사라져서 놓치기 쉬움.

## 7. 리스크 & 대응

| 리스크 | 대응 |
|---|---|
| 메일 HTML 구조 변경으로 파싱 실패 | 실패 시 `\Seen` 안 붙이고 로그만 → 메일은 안읽음으로 남아 수동 처리 가능 |
| 이름/픽업 누락 | 필수 3필드(order_id·tour_date·name)만 강제, 나머지는 빈값 허용 |
| 정원 초과 미감지 | `안내필요`도 `neq('취소')` 필터에 걸리므로 자동으로 정원 계산에 포함됨 |
| 이미 수기 입력한 건과 중복 | `order_id` 유니크 체크. 단 기존 수기 건은 order_id가 비어 있어 중복 발생 가능 → 최초 1~2주는 눈으로 확인 |
| **취소요청 건이 정원을 계속 차지** | `취소요청` 은 `neq('취소')` 필터에 걸리므로 운영자가 `취소` 로 마감하기 전까지 정원·차량에 남아 있음. 기존 손님 취소요청과 동일한 동작이라 그대로 둠. 대신 **모든 취소를 Discord 로 즉시 알림**(§5-1) |
| 취소 메일이 예약 메일보다 먼저/단독으로 옴 | 매칭 실패 → Discord 알림으로 수동 처리 유도 |
| 취소 메일 오탐 (본문에 "cancellation policy" 등) | 판정을 **제목 기준**으로 좁힘 + 취소 UPDATE 는 order_id 매칭 성공 시에만 실행 |
| Klook 신규/취소 본문이 동일 | 제목(`Klook Canceled` / `예약 취소`)으로만 판정. 제목 못 읽으면 파싱 실패 처리 |
| GYG 취소 사유가 "Bad weather" (우리 쪽 결항) | 사유를 note 에 그대로 기록해 원인 추적 가능하게 함 |
| **여기어때에 고객명·연락처가 없음** | `name='(여기어때 확인필요)'` 로 넣고 note 에 예약확인 URL 저장. `안내필요` 상태라 어차피 운영자가 손대는 건이므로 그때 채움 |
| 여기어때 옵션 문자열이 옵션 그룹명 전체 | **맨 뒤 시각(`07:30`)만** 신뢰해서 1부/2부/3부 판정 (운영자 확인 완료). 시각 없으면 option 공란 |
| 여기어때 취소 메일 포맷 미확인 | 이번 범위 제외. 제목에 `확정` 없는 여기어때 메일은 전부 안읽음으로 남겨 수동 대응 |
| Klook 시간대 | Klook `요청 날짜`는 현지(하와이) 기준 그대로 사용 |

## 8. 작업 현황

| # | 작업 | 상태 |
|---|---|---|
| 1 | status CHECK 제약 확인 | ✅ 제약 없음 확인 (마이그레이션 불필요) |
| 2 | `IMAP_EMAIL_OTA` / `IMAP_PW_OTA` (hioceanstar 직접 수신) | ✅ 로컬·Vercel(Production) 등록 완료, IMAP 접속 확인 |
| 3 | `otaEmailParser.ts` + `scripts/test_ota_parser.ts` | ✅ 9건 통과 |
| 4 | `nearestPickup.ts` (픽업 자동 매칭) | ✅ 실주소 5건 실측 검증 |
| 5 | `check-ota-emails/route.ts` | ✅ 작성 완료 |
| 6 | UI `안내필요` 4곳 | ✅ StatusEditor · all · NewReservationsView · NotificationBell |
| 7 | `vercel.json` cron 등록 | ✅ `2-59/5 * * * *` (MRT 와 시각 어긋나게) |
| 8 | 실제 메일함 파싱 검증 (읽기전용) | ✅ 4개 플랫폼 20건 전부 정상 (§4-2) |
| 9 | `CRON_SECRET` 등록 | ⬜ **Vercel 에 없음. 추가 권장** |
| 10 | 배포 후 첫 cron 실행 확인 | ⬜ |

실제 메일함 검증은 `node scripts/check_ota_inbox.ts` 로 언제든 다시 돌릴 수 있다.
읽기전용(EXAMINE)으로 열기 때문에 **읽음 처리되지 않는다.**

## 9. 이번 계획에서 뺀 것 (필요해지면 추가)

- 자동 안내 메일/카톡 발송 — 요구사항이 "내가 직접 보낸다" 이므로 제외
- **여기어때 취소 메일 처리** — 샘플 확보 후 별도 추가. 그전까지는 안읽음으로 남겨 수동 대응
- **클룩·Viator·여기어때의 변경 메일** — GYG 만 확인됨. 나머지는 샘플 확보 후 추가
- 정산(settlement) 파서 연동 — 별도 엑셀 업로드 경로가 이미 있음


---

# 부록 · 마이리얼트립 취소 메일 처리 (2026-09-14 추가)

기존 `check-myrealtrip-emails` cron 은 `확정대기`/`확정완료` 만 봤다.
취소 메일은 아예 읽지 않아 **최근 30일 256통이 안읽음으로 쌓여 있었다**
(`[예약취소]` 171통 + `예약 취소 요청 접수` 85통). 취소가 DB 에 자동 반영되지 않았다.

## 메일 두 종류

| 제목 | 의미 | 예약번호 |
|---|---|---|
| `[예약취소] 2026-09-24 / … 상품 예약이 취소되었습니다.` | 취소 확정 | **있음** (`EXP-…`) |
| `예약 취소 요청 접수 - …` | 손님이 취소 요청한 단계 | **없음** |

→ 취소요청 접수 메일은 예약번호가 없어서 **`source=M` + 이름 + 여행일** 로 찾는다.

## 처리 규칙

```
1순위 예약번호 → 2순위 이름+여행일
후보가 정확히 1건일 때만 UPDATE (0건이나 2건 이상이면 손대지 않고 Discord 알림만)
  status = '취소요청'          ← '취소' 로 바로 닫지 않는다
  cancel_requested_at = now()
  is_admin_checked = false
  note += '[마이리얼트립 취소요청 접수 수신: …]'
이미 '취소'/'취소요청' 인 건은 건너뛴다 (한 예약에 메일이 2~3통 와도 알림은 한 번만)
→ **투어일과 무관하게 항상 Discord 알림**
UPDATE 실패 시 \Seen 을 붙이지 않아 다음 실행에서 재시도
```

## 적용 범위

과거 밀린 취소는 운영자가 이미 수동 처리했으므로, cron 의 검색 창이 **최근 2일**
그대로다. 즉 **앞으로 오는 취소부터** 자동 처리된다.

## 남은 구조적 약점

두 cron 모두 `seen: false` 로만 검색한다. **사람이 Gmail 에서 먼저 열어보면 영원히 건너뛴다.**
최근 10일 기준 이 메일함에 `여행문의` 메일만 278통이 와서 사람이 자주 들어간다.
`seen: false` 를 빼고 `order_id` 중복 체크에만 기대면 없앨 수 있는 위험이다. (미적용)
