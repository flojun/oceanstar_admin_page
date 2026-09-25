# UI ↔ 기능 인벤토리 (자동 생성)

> `node scripts/qa/audit-ui.mjs` 가 소스 코드를 읽어 만든 표입니다. 손으로 고치지 마세요.
> 생성: 2026-09-25T02:38:56.738Z · 커밋 `84a88b5`

## 요약

| 항목 | 수 |
|---|---|
| 페이지 라우트 | 37 |
| API 라우트 | 23 |
| 인터랙티브 요소 | 537 |
| 정적 검사 error / warn / info | 0 / 2 / 59 |
| 번역 키 (ko/en) · 미사용 | 226/227 · 25 |

## 정적 검사 결과

| 등급 | 코드 | 위치 | 내용 |
|---|---|---|---|
| warn | dead-button | `src/components/booking/ManageBookingClient.tsx:393` | <button> "💬 일정 변경은 카카오톡 채널로 문의해주세요" 에 onClick 도 없고 폼 submit 도 아님 |
| warn | missing-locale-key | `src/components/landing/ReservationClientPage.tsx:887` | t("tour.features.pickup_service") 가 ko.ts 에 없음 → 해당 언어 화면에 키 문자열이 그대로 노출될 수 있음 |

<details><summary>info 59건 (접근성·선택자 관련)</summary>

| 코드 | 위치 | 내용 |
|---|---|---|
| no-accessible-name | `src/app/(en)/restaurants/page.tsx:263` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:311` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:313` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:446` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:99` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:111` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:122` | button [icon:Trash2] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:588` | button [icon:Trash2] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:593` | button [icon:Plus] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:624` | button [icon:Plus] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:653` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:655` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:144` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:175` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:647` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:808` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:933` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:720` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/layout.tsx:124` | button [icon:X+Menu] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(admin)/layout.tsx:164` | button [icon:PanelLeftOpen+PanelLeftClose] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:260` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:264` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:453` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/app/(ko)/kr/restaurants/page.tsx:263` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/dashboard/NotificationBell.tsx:315` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/dashboard/NotificationBell.tsx:474` | button (내용 없음) — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/dashboard/NotificationBell.tsx:497` | button (내용 없음) — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/dashboard/NotificationBell.tsx:525` | button (내용 없음) — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/GoogleReviews.tsx:98` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/GoogleReviews.tsx:106` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| non-semantic-click | `src/components/landing/PickupGuide.tsx:36` | <div> 에 onClick — 키보드로 누를 수 없음 ("Official Pickup Route / 오션스타 공식 픽업 노선도 Enter your hotel address when booking to…") |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:595` | <div> 에 onClick — 키보드로 누를 수 없음 ("OceanStar Logo") |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:998` | button (내용 없음) — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1185` | <div> 에 onClick — 키보드로 누를 수 없음 ("") |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:1191` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1208` | <div> 에 onClick — 키보드로 누를 수 없음 ("[icon:Check]") |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1270` | <div> 에 onClick — 키보드로 누를 수 없음 ("{opt.label}") |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1302` | <div> 에 onClick — 키보드로 누를 수 없음 ("{opt.label}") |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:1689` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1720` | <div> 에 onClick — 키보드로 누를 수 없음 ("") |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:1726` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:1767` | button [icon:Star] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:1816` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1848` | <div> 에 onClick — 키보드로 누를 수 없음 ("") |
| no-accessible-name | `src/components/landing/ReservationClientPage.tsx:1856` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1903` | <div> 에 onClick — 키보드로 누를 수 없음 ("Close Enlarged review photo") |
| non-semantic-click | `src/components/landing/ReservationClientPage.tsx:1912` | <img> 에 onClick — 키보드로 누를 수 없음 ("") |
| no-accessible-name | `src/components/payment/CurrencySelectModal.tsx:49` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/reservations/NewReservationsView.tsx:102` | button [icon:ArrowLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/reservations/ReservationListView.tsx:252` | button (내용 없음) — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/reservations/ReservationListView.tsx:503` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/reservations/ReservationModal.tsx:215` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/reservations/ReservationTable.tsx:201` | button [icon:Settings] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/reservations/ReservationToast.tsx:126` | button [icon:X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/ui/DatePicker.tsx:224` | button [icon:CalendarIcon] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/ui/DatePicker.tsx:237` | button [icon:ChevronLeft] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/ui/DatePicker.tsx:276` | button [icon:ChevronRight] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/vehicle/DriverManager.tsx:72` | button [icon:Plus] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |
| no-accessible-name | `src/components/website-settings/WebsiteImagesTable.tsx:97` | button [icon:Loader2+X] — aria-label/title 이 없어 스크린리더·E2E 선택자로 찾기 어려움 |

</details>

## 라우트

| 경로 | 화면 | 파일 |
|---|---|---|
| `/` | customer | `src/app/(en)/page.tsx` |
| `/agency-dashboard` | agency | `src/app/(ko)/(agency)/agency-dashboard/page.tsx` |
| `/agency-login` | agency | `src/app/(ko)/(agency)/agency-login/page.tsx` |
| `/booking/payment-cancel` | customer | `src/app/(en)/booking/payment-cancel/page.tsx` |
| `/booking/payment-success` | customer | `src/app/(en)/booking/payment-success/page.tsx` |
| `/booking/success` | customer | `src/app/(en)/booking/success/page.tsx` |
| `/checkin` | checkin | `src/app/(ko)/checkin/page.tsx` |
| `/dashboard/agencies` | admin | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx` |
| `/dashboard/alerts` | admin | `src/app/(ko)/(admin)/dashboard/alerts/page.tsx` |
| `/dashboard/all` | admin | `src/app/(ko)/(admin)/dashboard/all/page.tsx` |
| `/dashboard/bulk-add` | admin | `src/app/(ko)/(admin)/dashboard/bulk-add/page.tsx` |
| `/dashboard/crew` | admin | `src/app/(ko)/(admin)/dashboard/crew/page.tsx` |
| `/dashboard/crew/attendance` | admin | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx` |
| `/dashboard/home` | admin | `src/app/(ko)/(admin)/dashboard/home/page.tsx` |
| `/dashboard/invoice` | admin | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx` |
| `/dashboard/list` | admin | `src/app/(ko)/(admin)/dashboard/list/page.tsx` |
| `/dashboard/monthly` | admin | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx` |
| `/dashboard/overview` | admin | `src/app/(ko)/(admin)/dashboard/overview/page.tsx` |
| `/dashboard/reconfirm` | admin | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx` |
| `/dashboard/refunds` | admin | `src/app/(ko)/(admin)/dashboard/refunds/page.tsx` |
| `/dashboard/settlement` | admin | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx` |
| `/dashboard/stats` | admin | `src/app/(ko)/(admin)/dashboard/stats/page.tsx` |
| `/dashboard/today` | admin | `src/app/(ko)/(admin)/dashboard/today/page.tsx` |
| `/dashboard/vehicle` | admin | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx` |
| `/dashboard/website-settings` | admin | `src/app/(ko)/(admin)/dashboard/website-settings/page.tsx` |
| `/dashboard/website-settings/dates` | admin | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx` |
| `/dashboard/website-settings/images` | admin | `src/app/(ko)/(admin)/dashboard/website-settings/images/page.tsx` |
| `/dashboard/website-settings/pickup` | admin | `src/app/(ko)/(admin)/dashboard/website-settings/pickup/page.tsx` |
| `/kr` | customer | `src/app/(ko)/kr/page.tsx` |
| `/kr/booking/payment-cancel` | customer | `src/app/(ko)/kr/booking/payment-cancel/page.tsx` |
| `/kr/booking/payment-success` | customer | `src/app/(ko)/kr/booking/payment-success/page.tsx` |
| `/kr/booking/success` | customer | `src/app/(ko)/kr/booking/success/page.tsx` |
| `/kr/manage-booking` | customer | `src/app/(ko)/kr/manage-booking/page.tsx` |
| `/kr/restaurants` | customer | `src/app/(ko)/kr/restaurants/page.tsx` |
| `/login` | admin | `src/app/(ko)/login/page.tsx` |
| `/manage-booking` | customer | `src/app/(en)/manage-booking/page.tsx` |
| `/restaurants` | customer | `src/app/(en)/restaurants/page.tsx` |

| API | 메서드 | 인증 | 하는 일 |
|---|---|---|---|
| `/api/admin/approve-reschedule` | POST | — | **POST** db reservations.select, db tour_settings.select, db reservations.update |
| `/api/admin/invoice-prices` | GET, POST | — | **GET** db invoice_prices.select<br>**POST** db invoice_prices.select, db invoice_prices.delete, db invoice_prices.upsert |
| `/api/admin/pickup` | POST | — | **POST** db pickup_locations.upsert |
| `/api/admin/refund` | POST | — | **POST** db reservations.select, db reservations.update |
| `/api/agency/reservations` | GET | — | **GET** action getAgencySession, db agencies.select, db reservations.select |
| `/api/availability` | GET | — | **GET** db tour_settings.select, db reservations.select |
| `/api/cancel` | POST | — | **POST** db reservations.select, db reservations.update |
| `/api/cron/capture-pending` | GET | cron-secret | **GET** db reservations.select, db reservations.update, fetch POST <webhookUrl> |
| `/api/cron/check-myrealtrip-emails` | GET | cron-secret | **GET** db reservations.select, db reservations.update, fetch POST <webhookUrl>, db reservations.insert |
| `/api/cron/check-ota-emails` | GET | cron-secret | **GET** db pickup_locations.select, fetch GET https://maps.googleapis.com/maps/api/geocode/json, db reservations.select, db reservations.update, db reservations.insert, fetch POST <webhookUrl> |
| `/api/cron/update-exchange-rate` | GET | cron-secret | **GET** fetch GET https://open.er-api.com/v6/latest/USD, db tour_settings.select, db tour_settings.update |
| `/api/exchange-rate` | GET | — | **GET** fetch GET https://open.er-api.com/v6/latest/USD |
| `/api/google-reviews` | GET | — | **GET** db google_reviews.select |
| `/api/notifications/discord-urgent-reservation` | POST | — | **POST** fetch POST <webhookUrl>, db reservations.update |
| `/api/pickup` | GET | — | **GET** db pickup_locations.select, db tour_settings.select |
| `/api/reschedule` | POST | — | **POST** db reservations.select, db reservations.update |
| `/api/reservation-detail` | GET | — | **GET** db reservations.select, db pickup_locations.select |
| `/api/reviews` | GET, POST | — | **GET** db reviews.select<br>**POST** db reservations.select, db reviews.select, storage review-images.upload, storage review-images.getPublicUrl, fetch POST https://api-free.deepl.com/v2/translate, db reviews.insert |
| `/api/settings` | GET | — | **GET** db tour_settings.select, db blocked_dates.select |
| `/api/stripe/checkout` | POST | — | **POST** db tour_settings.select, db reservations.select |
| `/api/stripe/verify-session` | POST | — | **POST** db reservations.select, db reservations.update, db reservations.insert, db tour_settings.select |
| `/api/stripe/webhook` | POST | stripe-signature | **POST** db reservations.update, db reservations.select, fetch POST <webhookUrl>, db reservations.insert, db tour_settings.select |
| `/api/verify-booking` | POST | — | **POST** db reservations.select |

## 화면별 기능 지도 (어떤 기능을 어떤 버튼이 일으키는가)

### customer

| 기능(효과) | 버튼/링크 |
|---|---|
| `cookie` | EN / KR |
| `export` | QR 코드 다운로드 · 바우처 저장 |
| `external http://pf.kakao.com/:param` | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 |
| `external http://pf.kakao.com/_yxfcExj` | 카톡 바로가기! |
| `external https://www.google.com/maps/place/%EC%98%A4%EC%85%98%EC%8A%A4%ED%83%80/@21.2909527,-157.8596751,17.95z/data=!4m6!3m5!1s0x7c006e0714500001:0x42c44e799ee07eac!8m2!3d21.2913542!4d-157.8586971!16s%2Fg%2F11t2p_627w` | 구글 지도로 바로보기 |
| `external https://www.google.com/maps/search/` | 구글에서 전체 리뷰 보기 · 구글 지도 열기 |
| `external https://www.instagram.com/oceanstar_turtlesnorkelling` | 인스타그램 DM 문의하기 인스타그램 DM 문의 · Instagram |
| `external https://www.youtube.com/@oceanstarhi` | YouTube |
| `fetch GET /api/reviews` | {reviewError} 예약 번호 (영숫자 6자리) 예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다. 이름 (초성 또는 닉네임… · 등록 중... / 리뷰 등록하기 |
| `fetch GET https://api.qrserver.com/v1/create-qr-code/` | QR 코드 다운로드 |
| `fetch POST /api/cancel` | 최종 취소 확정 |
| `fetch POST /api/reschedule` | 변경 완료 |
| `fetch POST /api/reviews` | {reviewError} 예약 번호 (영숫자 6자리) 예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다. 이름 (초성 또는 닉네임… · 등록 중... / 리뷰 등록하기 |
| `fetch POST /api/stripe/checkout` | ₩ {t.krwTitle} {t.krwDesc} · {t.usdTitle} {t.usdDesc} |
| `fetch POST /api/verify-booking` | 예약 정보 보호를 위해 예약 번호와 이메일을 입력해 주세요. 예약 번호 (영숫자 6자리) 이메일 주소 (Email Address) 예약 조회하기 · 예약 조회하기 |
| `nav /` | Try Booking Again · Return to Home · Go Home · 메인으로 · 홈으로 돌아가기 · 홈으로 이동 · EN / KR |
| `nav /kr` | 다시 예약하기 · 홈페이지로 돌아가기 · 홈으로 · EN / KR |
| `nav /kr/manage-booking` | 내 예약 조회 · 내 예약 관리 |
| `nav /kr/restaurants` | Hawaiian Restaurants / 맛집 리스트 보기 |
| `nav /manage-booking` | Manage My Booking · 내 예약 관리 |
| `nav /restaurants` | Hawaiian Restaurants / 맛집 리스트 보기 |
| `nav <data.url>` | ₩ {t.krwTitle} {t.krwDesc} · {t.usdTitle} {t.usdDesc} |
| `open https://api.qrserver.com/v1/create-qr-code/` | QR 코드 다운로드 |

### admin

| 기능(효과) | 버튼/링크 |
|---|---|
| `action createAgency` | 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 · 저장 |
| `action deleteAgency` | 삭제 |
| `action getAgencies` | 삭제 · 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 · 저장 |
| `action updateAgency` | 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 · 저장 |
| `auth signInWithPassword` | 아이디 비밀번호 이 기기 기억하기 (24시간) 로그인 중... / 로그인 · 로그인 중... / 로그인 |
| `auth signOut` | 로그아웃 |
| `clipboard` | 주소 복사 · 복사하기 · 복사 텍스트로 복사 · 명단복사 · {res.contact} |
| `db agencies.delete` | 삭제 |
| `db agencies.insert` | 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 · 저장 |
| `db agencies.select` | 삭제 · 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 · 저장 |
| `db agencies.update` | 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 · 저장 |
| `db agency_notifications.update` | 알림 99+ |
| `db blocked_dates.delete` | 차단 해제 |
| `db blocked_dates.insert` | 해당 옵션 차단 |
| `db blocked_dates.select` | 상품 삭제 · 해당 옵션 차단 · 차단 해제 · 상품 추가 |
| `db captains.delete` | [icon:Trash2] |
| `db captains.insert` | 이름 · [icon:Plus] |
| `db captains.select` | [icon:ChevronLeft] · [icon:ChevronRight] · [icon:Trash2] · 이름 · [icon:Plus] · [icon:SortableCrewItem+Plus] · <SortableCrewItem> · - {c.name} 외 1 |
| `db crew_members.delete` | [icon:Trash2] · <SortableCrewItem> |
| `db crew_members.insert` | 이름 · [icon:Plus] |
| `db crew_members.select` | [icon:ChevronLeft] · [icon:ChevronRight] · [icon:Trash2] · 이름 · [icon:Plus] · [icon:SortableCrewItem+Plus] · <SortableCrewItem> · - {c.name} 외 1 |
| `db crew_members.upsert` | [icon:ChevronLeft] · [icon:ChevronRight] · [icon:SortableCrewItem+Plus] |
| `db crew_memos.select` | [icon:ChevronLeft] · [icon:ChevronRight] · [icon:Trash2] · 이름 · [icon:Plus] · [icon:SortableCrewItem+Plus] · <SortableCrewItem> · - {c.name} 외 1 |
| `db crew_memos.upsert` | 저장 |
| `db crew_schedules.delete` | {text} |
| `db crew_schedules.select` | [icon:ChevronLeft] · [icon:ChevronRight] · [icon:Trash2] · 이름 · [icon:Plus] · [icon:SortableCrewItem+Plus] · <SortableCrewItem> · - {c.name} 외 1 |
| `db crew_schedules.upsert` | {text} |
| `db daily_vehicle_status.select` | 기사 공유 기사님 명단 공유 · 전체 공유 전체 명단 공유 · 기사님 선택 {d.name} |
| `db daily_vehicle_status.upsert` | 기사님 선택 {d.name} |
| `db drivers.delete` | 삭제 |
| `db drivers.insert` | 기사님 성함 입력 · [icon:Plus] |
| `db drivers.select` | 기사님 성함 입력 · [icon:Plus] |
| `db product_prices.delete` | 삭제 |
| `db product_prices.insert` | ... / 추가 |
| `db product_prices.select` | 파일 처리 중... {uploadedFileName} 다시 업로드하려면 클릭하세요 {platform.label} 정산 엑셀 파일을 드래그하거나… · <input> · ... / 추가 |
| `db product_prices.update` | ON / OFF · 저장 |
| `db reservations.delete` | 예약확정 · 예약대기 · 취소처리 · 일괄삭제 · 예약확정 (상태변경) · 예약대기 (상태변경) · 취소 (상태변경) · 삭제 (DB 영구삭제) 외 2 |
| `db reservations.insert` | 저장... / 저장 · 저장 중... / 전체 저장 · 진행상태 예약확정 예약대기 취소 대기 예약경로 (자동변환) 예약자명 인원 (자동변환) 옵션 (자동변환) 픽업장소 (선택안함) 직접 입력... … · 저장 중... |
| `db reservations.select` | 저장... / 저장 · ▲ 위로 · ▼ 아래로 · 예약 조회 · <ReservationTable> · 파일 처리 중... {uploadedFileName} 다시 업로드하려면 클릭하세요 {platform.label} 정산 엑셀 파일을 드래그하거나… · <input> · 기사 공유 기사님 명단 공유 외 11 |
| `db reservations.update` | ▲ 위로 · ▼ 아래로 · 정산 제외 · 정산 확정 ( {selectedIds.size} ) · 결제 취소 (수수료 없음) · 처리 중... / 안내완료 · 전체 확인 · 확인 완료 외 3 |
| `db reservations.upsert` | 저장... / 저장 · [icon:UnassignedDropZone+VehicleDropZone] |
| `db shift_captains.delete` | - {c.name} |
| `db shift_captains.select` | [icon:ChevronLeft] · [icon:ChevronRight] · [icon:Trash2] · 이름 · [icon:Plus] · [icon:SortableCrewItem+Plus] · <SortableCrewItem> · - {c.name} 외 1 |
| `db shift_captains.upsert` | - {c.name} |
| `db tour_settings.delete` | 상품 삭제 |
| `db tour_settings.insert` | 상품 추가 |
| `db tour_settings.select` | 상품 삭제 · 해당 옵션 차단 · 차단 해제 · 상품 추가 |
| `db tour_settings.update` | 판매중지 판매중 |
| `db tour_settings.upsert` | 전체 설정 저장 |
| `export` | 이미지로 저장 · 저장 중... / 이미지 저장 · 엑셀 다운로드 (.xlsx) · PPT 생성 중 / PPT 다운로드 · 인보이스 (Excel) · {d.name} 기사님 · 저장 이미지 저장 · 전체 공유 전체 명단 공유 외 1 |
| `external http://pf.kakao.com/:param` | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 |
| `external https://www.instagram.com/oceanstar_turtlesnorkelling` | 인스타그램 DM 문의하기 인스타그램 DM 문의 |
| `fetch GET /api/admin/invoice-prices` | 단가 저장 |
| `fetch GET :param/versions.json?t=:param` | [icon:Loader2+X] · <input> · [icon:SortableThumbnail] · <SortableThumbnail> |
| `fetch GET <dataUrl>` | {d.name} 기사님 · 전체 공유 전체 명단 공유 |
| `fetch POST /api/admin/approve-reschedule` | 처리 중... |
| `fetch POST /api/admin/invoice-prices` | 단가 저장 |
| `fetch POST /api/admin/pickup` | 변경사항 저장 |
| `fetch POST /api/admin/refund` | 다시 시도 · 결제 취소 (수수료 없음) |
| `localStorage remember-device` | 아이디 비밀번호 이 기기 기억하기 (24시간) 로그인 중... / 로그인 · 로그인 중... / 로그인 |
| `localStorage sidebar-collapsed` | [icon:PanelLeftOpen+PanelLeftClose] |
| `nav /agency-login` | 새 창으로 열기 &rarr; |
| `nav /dashboard/alerts` | 아이디 비밀번호 이 기기 기억하기 (24시간) 로그인 중... / 로그인 · 로그인 중... / 로그인 · 알림 센터로 이동 |
| `nav /dashboard/all` | 취소 요청 처리가 필요한 취소 요청건 {cancellationCount} 건 · 예약관리에서 보기 {req.name} {req.status} {req.source} {req.pax} {req.option} {req.pick… |
| `nav /dashboard/crew` | 스케쥴 관리 |
| `nav /dashboard/crew/attendance` | 출석 현황 |
| `nav /dashboard/overview` | Overview |
| `nav /dashboard/settlement` | 정산검토 |
| `nav /dashboard/today` | <div> |
| `nav /login` | 로그아웃 |
| `nav <pendingNavigation>` | 저장 후 이동 · 저장하지 않음 |
| `storage website-assets.remove` | [icon:Loader2+X] · <SortableThumbnail> |
| `storage website-assets.upload` | [icon:Loader2+X] · <input> · [icon:SortableThumbnail] · <SortableThumbnail> |

### agency

| 기능(효과) | 버튼/링크 |
|---|---|
| `action cancelAgencyReservation` | 취소 요청 취소 |
| `action createAgencyReservation` | 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `action loginAgency` | 아이디 비밀번호 로그인 중... / 로그인 하기 · 로그인 중... / 로그인 하기 |
| `action logoutAgency` | 로그아웃 |
| `action updateAgencyReservation` | 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `db agencies.select` | 아이디 비밀번호 로그인 중... / 로그인 하기 · 로그인 중... / 로그인 하기 |
| `db agency_notifications.insert` | 취소 요청 취소 · 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `db reservations.insert` | 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `db reservations.select` | 취소 요청 취소 · 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `db reservations.update` | 취소 요청 취소 · 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `db tour_settings.select` | 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `external http://pf.kakao.com/:param` | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 |
| `external https://www.instagram.com/oceanstar_turtlesnorkelling` | 인스타그램 DM 문의하기 인스타그램 DM 문의 |
| `fetch GET /api/agency/reservations` | 취소 요청 취소 · 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 |
| `nav /agency-dashboard` | 아이디 비밀번호 로그인 중... / 로그인 하기 · 로그인 중... / 로그인 하기 |
| `nav /agency-login` | 로그아웃 |

### checkin

| 기능(효과) | 버튼/링크 |
|---|---|
| `db captain_attendance.select` | PIN · Sign In |
| `db captains.select` | PIN · Sign In |
| `db crew_attendance.select` | PIN · Sign In |
| `db crew_members.select` | PIN · Sign In |
| `db crew_schedules.select` | PIN · Sign In |
| `db shift_captains.select` | PIN · Sign In |
| `external http://pf.kakao.com/:param` | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 |
| `external https://www.instagram.com/oceanstar_turtlesnorkelling` | 인스타그램 DM 문의하기 인스타그램 DM 문의 |

## 페이지별 인터랙티브 요소

### `/` (customer) — 요소 62개

로드/전체 기능: `cookie` `fetch GET /api/availability` `fetch GET /api/google-reviews` `fetch GET /api/pickup` `fetch GET /api/reviews` `fetch GET /api/settings` `fetch GET {SUPABASE}/storage/v1/object/public/website-assets/versions.json?t=:param` `fetch POST /api/reviews` `fetch POST /api/stripe/checkout` `nav /` `nav /kr` `nav <data.url>`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 구글에서 전체 리뷰 보기 | external https://www.google.com/maps/search/ | `src/components/GoogleReviews.tsx:85` |
| button | [icon:ChevronLeft] | scroll | `src/components/GoogleReviews.tsx:98` |
| button | [icon:ChevronRight] | scroll | `src/components/GoogleReviews.tsx:106` |
| button | {category.category} {category.items.length} | 상태: ActiveTab,OpenItems | `src/components/landing/FAQSection.tsx:261` |
| button | Q. {item.q} | 상태: OpenItems | `src/components/landing/FAQSection.tsx:301` |
| clickable | [icon:Image] | 상태: IsTouched | `src/components/landing/ImageCarousel.tsx:65` |
| clickable | Official Pickup Route / 오션스타 공식 픽업 노선도 Enter your hotel address when booking to… | 상태: IsOpen | `src/components/landing/PickupGuide.tsx:36` |
| link | 구글 지도 열기 | external https://www.google.com/maps/search/ | `src/components/landing/PickupGuide.tsx:91` |
| clickable | OceanStar Logo | anchor #home, scroll | `src/components/landing/ReservationClientPage.tsx:595` |
| button | Home | anchor #home, scroll | `src/components/landing/ReservationClientPage.tsx:600` |
| button | Tours / 투어 | anchor #tours, scroll | `src/components/landing/ReservationClientPage.tsx:601` |
| button | Reviews / 고객후기 | anchor #reviews, scroll | `src/components/landing/ReservationClientPage.tsx:602` |
| button | FAQ | anchor #faq, scroll | `src/components/landing/ReservationClientPage.tsx:603` |
| button | About Us / 회사소개 | anchor #about, scroll | `src/components/landing/ReservationClientPage.tsx:604` |
| button | Toggle Menu | 상태: IsMobileMenuOpen | `src/components/landing/ReservationClientPage.tsx:608` |
| button | EN / KR | cookie, nav /, nav /kr | `src/components/landing/ReservationClientPage.tsx:615` |
| link | 내 예약 관리 | nav /manage-booking, nav /kr/manage-booking | `src/components/landing/ReservationClientPage.tsx:630` |
| button | 투어 예약하기 | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:635` |
| button | Home | anchor #home, scroll | `src/components/landing/ReservationClientPage.tsx:646` |
| button | Tours / 투어 | anchor #tours, scroll | `src/components/landing/ReservationClientPage.tsx:647` |
| button | Reviews / 고객후기 | anchor #reviews, scroll | `src/components/landing/ReservationClientPage.tsx:648` |
| button | FAQ | anchor #faq, scroll | `src/components/landing/ReservationClientPage.tsx:649` |
| button | About Us / 회사소개 | anchor #about, scroll | `src/components/landing/ReservationClientPage.tsx:650` |
| button | 바로 예약하기 | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:685` |
| button | 자세히 보기 | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:914` |
| button | 예약하기 | 상태: SelectedTour,IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:920` |
| button | 리뷰 작성하기 | 상태: ReviewError,ReviewSuccess,IsReviewOpen | `src/components/landing/ReservationClientPage.tsx:939` |
| button | 이전 리뷰 | scroll | `src/components/landing/ReservationClientPage.tsx:964` |
| button | 다음 리뷰 | scroll | `src/components/landing/ReservationClientPage.tsx:971` |
| button | <button> | 상태: ExpandedReviews | `src/components/landing/ReservationClientPage.tsx:998` |
| button | <Image> | 상태: LightboxImage | `src/components/landing/ReservationClientPage.tsx:1010` |
| link | Instagram | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/landing/ReservationClientPage.tsx:1083` |
| link | YouTube | external https://www.youtube.com/@oceanstarhi | `src/components/landing/ReservationClientPage.tsx:1092` |
| link | Hawaiian Restaurants / 맛집 리스트 보기 | nav /restaurants, nav /kr/restaurants | `src/components/landing/ReservationClientPage.tsx:1101` |
| link | 구글 지도로 바로보기 | external https://www.google.com/maps/place/%EC%98%A4%EC%85%98%EC%8A%A4%ED%83%80/@21.2909527,-157.8596751,17.95z/data=!4m6!3m5!1s0x7c006e0714500001:0x42c44e799ee07eac!8m2!3d21.2913542!4d-157.8586971!16s%2Fg%2F11t2p_627w | `src/components/landing/ReservationClientPage.tsx:1123` |
| button | 예약하기 | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1172` |
| clickable | <div> | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1185` |
| button | [icon:X] | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1191` |
| form | 1 투어 선택 1.5 Select Combo Option / 콤보 세부 옵션 선택 1.6 Select Snorkeling Trip Time /… | 상태: BookingError,PendingBookingData,IsCurrencyModalOpen | `src/components/landing/ReservationClientPage.tsx:1197` |
| clickable | [icon:Check] | scroll | `src/components/landing/ReservationClientPage.tsx:1208` |
| clickable | {opt.label} | 상태: ComboOption | `src/components/landing/ReservationClientPage.tsx:1270` |
| clickable | {opt.label} | scroll | `src/components/landing/ReservationClientPage.tsx:1302` |
| button | [icon:X] | 상태: BookingError | `src/components/landing/ReservationClientPage.tsx:1689` |
| button | 응답 대기 중... / 결제하기 | 상태: BookingError,PendingBookingData,IsCurrencyModalOpen | `src/components/landing/ReservationClientPage.tsx:1701` |
| clickable | <div> | 상태: IsReviewOpen | `src/components/landing/ReservationClientPage.tsx:1720` |
| button | [icon:X] | 상태: IsReviewOpen | `src/components/landing/ReservationClientPage.tsx:1726` |
| form | {reviewError} 예약 번호 (영숫자 6자리) 예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다. 이름 (초성 또는 닉네임… | fetch POST /api/reviews, fetch GET /api/reviews | `src/components/landing/ReservationClientPage.tsx:1732` |
| button | [icon:Star] | 상태: ReviewForm | `src/components/landing/ReservationClientPage.tsx:1767` |
| button | [icon:X] | 상태: ReviewForm | `src/components/landing/ReservationClientPage.tsx:1816` |
| button | 등록 중... / 리뷰 등록하기 | fetch POST /api/reviews, fetch GET /api/reviews | `src/components/landing/ReservationClientPage.tsx:1830` |
| clickable | <div> | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:1848` |
| button | [icon:X] | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:1856` |
| button | 닫기 | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:1880` |
| button | 예약하기 | 상태: ExpandedTourDetails,SelectedTour,IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1883` |
| clickable | Close Enlarged review photo | 상태: LightboxImage | `src/components/landing/ReservationClientPage.tsx:1903` |
| button | Close | 상태: LightboxImage | `src/components/landing/ReservationClientPage.tsx:1905` |
| clickable | <img> | onClick: (e) => e.stopPropagation() | `src/components/landing/ReservationClientPage.tsx:1912` |
| component | <CurrencySelectModal> | 상태: IsCurrencyModalOpen | `src/components/landing/ReservationClientPage.tsx:1923` |
| button | [icon:X] | 상태: IsCurrencyModalOpen | `src/components/payment/CurrencySelectModal.tsx:49` |
| button | ₩ {t.krwTitle} {t.krwDesc} | fetch POST /api/stripe/checkout, nav <data.url> | `src/components/payment/CurrencySelectModal.tsx:57` |
| button | {t.usdTitle} {t.usdDesc} | fetch POST /api/stripe/checkout, nav <data.url> | `src/components/payment/CurrencySelectModal.tsx:70` |
| button | {t.cancel} | 상태: IsCurrencyModalOpen | `src/components/payment/CurrencySelectModal.tsx:85` |

### `/agency-dashboard` (agency) — 요소 16개

로드/전체 기능: `action cancelAgencyReservation` `action createAgencyReservation` `action getAgencyAvailabilityWeekly` `action getAgencySession` `action logoutAgency` `action updateAgencyReservation` `db agencies.select` `db agency_notifications.insert` `db reservations.insert` `db reservations.select` `db reservations.update` `db tour_settings.select` `fetch GET /api/agency/reservations` `nav /agency-login`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | [icon:ChevronLeft] | 상태: AvailabilityStart | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:260` |
| button | [icon:ChevronRight] | 상태: AvailabilityStart | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:264` |
| button | 초기화 | 상태: FilterDate,SortFilter | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:352` |
| button | 새 예약 등록 | 상태: FormMode,SelectedId,FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:356` |
| button | 수정 | 상태: FormMode,SelectedId,FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:420` |
| button | 취소 요청 취소 | dialog confirm, action cancelAgencyReservation, db reservations.select, db reservations.update, db agency_notifications.insert, dialog alert, fetch GET /api/agency/reservations | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:421` |
| clickable | <div> | 상태: IsFormOpen,FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:443` |
| button | [icon:X] | 상태: IsFormOpen,FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:453` |
| form | 여행사명 (고정) 예약자명 * 투어 날짜 투어 옵션 1부 2부 선셋 프라이빗 탑승 인원 픽업 위치 담당자 인솔(연락처) 기타 메모 작성 | action createAgencyReservation, db tour_settings.select, db reservations.select, db reservations.insert, db agency_notifications.insert, action updateAgencyReservation, db reservations.update, dialog alert, fetch GET /api/agency/reservations | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:460` |
| button | - | 상태: FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:500` |
| button | + | 상태: FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:502` |
| button | 취소 | 상태: IsFormOpen,FormData | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:536` |
| button | 저장 완료 (마감 점검) | — | `src/app/(ko)/(agency)/agency-dashboard/page.tsx:537` |
| button | 로그아웃 | action logoutAgency, nav /agency-login | `src/app/(ko)/(agency)/layout.tsx:54` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/agency-login` (agency) — 요소 5개

로드/전체 기능: `action getAgencySession` `action loginAgency` `action logoutAgency` `db agencies.select` `db agency_notifications.insert` `db reservations.insert` `db reservations.select` `db reservations.update` `db tour_settings.select` `nav /agency-dashboard` `nav /agency-login`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| form | 아이디 비밀번호 로그인 중... / 로그인 하기 | action loginAgency, db agencies.select, nav /agency-dashboard, dialog alert | `src/app/(ko)/(agency)/agency-login/page.tsx:41` |
| button | 로그인 중... / 로그인 하기 | action loginAgency, db agencies.select, nav /agency-dashboard, dialog alert | `src/app/(ko)/(agency)/agency-login/page.tsx:69` |
| button | 로그아웃 | action logoutAgency, nav /agency-login | `src/app/(ko)/(agency)/layout.tsx:54` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/booking/payment-cancel` (customer) — 요소 2개

로드/전체 기능: —

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | Try Booking Again | nav / | `src/app/(en)/booking/payment-cancel/page.tsx:34` |
| link | Return to Home | nav / | `src/app/(en)/booking/payment-cancel/page.tsx:40` |

### `/booking/payment-success` (customer) — 요소 2개

로드/전체 기능: `fetch POST /api/stripe/verify-session` `nav /booking/success`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | Manage My Booking | nav /manage-booking | `src/app/(en)/booking/payment-success/page.tsx:69` |
| link | Go Home | nav / | `src/app/(en)/booking/payment-success/page.tsx:75` |

### `/booking/success` (customer) — 요소 3개

로드/전체 기능: `cookie` `export` `fetch GET /api/reservation-detail` `nav /`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 홈으로 돌아가기 | nav / | `src/components/booking/BookingSuccessClient.tsx:79` |
| button | 바우처 저장 | export, dialog alert | `src/components/booking/BookingSuccessClient.tsx:195` |
| link | 홈으로 이동 | nav / | `src/components/booking/BookingSuccessClient.tsx:201` |

### `/checkin` (checkin) — 요소 8개

로드/전체 기능: `db captain_attendance.select` `db captains.select` `db crew_attendance.select` `db crew_members.select` `db crew_schedules.select` `db shift_captains.select`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | Sign In | db crew_members.select, db crew_schedules.select, db crew_attendance.select, db captains.select, db shift_captains.select, db captain_attendance.select | `src/app/(ko)/checkin/page.tsx:190` |
| button | No, Back | 상태: ConfirmingOption | `src/app/(ko)/checkin/page.tsx:222` |
| button | Yes, Confirm | 상태: Loading,Error,Attended | `src/app/(ko)/checkin/page.tsx:229` |
| button | ✅ Checked In | 상태: ConfirmingOption | `src/app/(ko)/checkin/page.tsx:255` |
| button | Switch account | 상태: Step,Member,Pin | `src/app/(ko)/checkin/page.tsx:281` |
| button | Back | 상태: Step | `src/app/(ko)/checkin/page.tsx:302` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/dashboard/agencies` (admin) — 요소 29개

로드/전체 기능: `action createAgency` `action deleteAgency` `action getAgencies` `action updateAgency` `auth signOut` `clipboard` `db agencies.delete` `db agencies.insert` `db agencies.select` `db agencies.update` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 새 여행사 등록 | 상태: ModalMode,SelectedAgency,FormData | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:108` |
| button | 주소 복사 | clipboard, dialog alert | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:129` |
| link | 새 창으로 열기 &rarr; | nav /agency-login | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:139` |
| button | 수정 | 상태: ModalMode,SelectedAgency,FormData | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:184` |
| button | 삭제 | dialog confirm, action deleteAgency, db agencies.delete, dialog alert, action getAgencies, db agencies.select | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:190` |
| form | 여행사명 로그인 아이디 비밀번호 (변경 시에만 입력) 취소 저장 | dialog alert, action createAgency, db agencies.select, db agencies.insert, action getAgencies, action updateAgency, db agencies.update | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:214` |
| button | 취소 | 상태: IsModalOpen,FormData | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:252` |
| button | 저장 | dialog alert, action createAgency, db agencies.select, db agencies.insert, action getAgencies, action updateAgency, db agencies.update | `src/app/(ko)/(admin)/dashboard/agencies/page.tsx:259` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/alerts` (admin) — 요소 35개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `db reservations.update` `fetch POST /api/admin/approve-reschedule` `fetch POST /api/admin/refund` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /dashboard/all` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | {card.count} {card.label} | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/alerts/page.tsx:119` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| clickable | 취소 처리 {request.name} 취소요청 {request.source} {request.pax} {request.contact} 📝 | 상태: SelectedReservation,RefundAmount,RefundReason | `src/components/reservations/CancellationRequestsView.tsx:140` |
| button | 취소 처리 | 상태: SelectedReservation,RefundAmount,RefundReason | `src/components/reservations/CancellationRequestsView.tsx:147` |
| button | 취소 처리 | 상태: SelectedReservation,RefundAmount,RefundReason | `src/components/reservations/CancellationRequestsView.tsx:169` |
| button | 닫기 | 상태: IsModalOpen | `src/components/reservations/CancellationRequestsView.tsx:271` |
| button | 결제 취소 (수수료 없음) | fetch POST /api/admin/refund, dialog alert, db reservations.update | `src/components/reservations/CancellationRequestsView.tsx:278` |
| button | [icon:ArrowLeft] | 상태: ShowNewReservations | `src/components/reservations/NewReservationsView.tsx:102` |
| button | 전체 확인 | dialog confirm, db reservations.update, db reservations.select | `src/components/reservations/NewReservationsView.tsx:114` |
| button | 확인 완료 | db reservations.update, db reservations.select | `src/components/reservations/NewReservationsView.tsx:136` |
| clickable | 예약관리에서 보기 {req.name} {req.status} {req.source} {req.pax} {req.option} {req.pick… | nav /dashboard/all | `src/components/reservations/NewReservationsView.tsx:143` |
| clickable | 변경 승인 {request.name} 변경요청 OTA 에서 이미 확정된 변경이라 날짜는 반영해 두었습니다 반영됨 {request.source}… | 상태: SelectedReservation,NewDate,NewPickup | `src/components/reservations/RescheduleRequestsView.tsx:114` |
| button | 변경 승인 | 상태: SelectedReservation,NewDate,NewPickup | `src/components/reservations/RescheduleRequestsView.tsx:119` |
| button | 닫기 | 상태: IsModalOpen | `src/components/reservations/RescheduleRequestsView.tsx:185` |
| button | 처리 중... | fetch POST /api/admin/approve-reschedule, dialog alert | `src/components/reservations/RescheduleRequestsView.tsx:191` |

### `/dashboard/all` (admin) — 요소 68개

로드/전체 기능: `auth signOut` `clipboard` `db agency_notifications.select` `db agency_notifications.update` `db reservations.delete` `db reservations.insert` `db reservations.select` `db reservations.update` `db reservations.upsert` `db tour_settings.select` `fetch POST /api/admin/approve-reschedule` `fetch POST /api/admin/refund` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| clickable | <div> | onDragStart: (e) => e.preventDefault() | `src/app/(ko)/(admin)/dashboard/all/page.tsx:1505` |
| clickable | {status} | onDragStart: e => e.preventDefault() | `src/app/(ko)/(admin)/dashboard/all/page.tsx:1650` |
| button | 검색 초기화 ✕ | 상태: SearchQuery | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2100` |
| button | 명단복사 | 상태: CopyStartRow,CopyEndRow,ShowCopyModal | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2112` |
| button | 행 추가 | 상태: History,HistoryIndex,Rows | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2120` |
| button | ▼ | 상태: ShowAddMenu | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2128` |
| button | + {num} 행 추가 | 상태: History,HistoryIndex,Rows | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2137` |
| clickable | <div> | 상태: ShowAddMenu | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2147` |
| button | 실행 취소 (Ctrl+Z) | 상태: HistoryIndex,History,Rows | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2154` |
| button | 다시 실행 (Ctrl+Y) | 상태: HistoryIndex,History,Rows | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2162` |
| button | 저장... / 저장 | dialog alert, db reservations.select, db reservations.insert, db reservations.upsert | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2172` |
| button | ▲ 위로 | dialog alert, db reservations.select, db reservations.update | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2206` |
| button | ▼ 아래로 | dialog alert, db reservations.select, db reservations.update | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2212` |
| button | 예약확정 | dialog confirm, db reservations.delete, dialog alert | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2221` |
| button | 예약대기 | dialog confirm, db reservations.delete, dialog alert | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2227` |
| button | 취소처리 | dialog confirm, db reservations.delete, dialog alert | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2233` |
| button | 환불하기 | 상태: RefundTargets | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2239` |
| button | 일괄삭제 | dialog confirm, db reservations.delete, dialog alert | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2246` |
| button | ✕ | 상태: SelectedRows | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2252` |
| component | <BulkRefundSheet> | 상태: RefundTargets | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2264` |
| button | 예약 입력 (전체 관리) | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2273` |
| button | 안내 필요 {tabCounts.guidance} | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2279` |
| button | 취소 요청 {tabCounts.cancellation} | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2288` |
| button | 변경 요청 {tabCounts.reschedule} | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2297` |
| button | 예약확정 (상태변경) | dialog alert, db reservations.delete | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2391` |
| button | 예약대기 (상태변경) | dialog alert, db reservations.delete | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2397` |
| button | 취소 (상태변경) | dialog alert, db reservations.delete | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2403` |
| button | 삭제 (DB 영구삭제) | dialog alert, db reservations.delete | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2410` |
| button | 닫기 | 상태: ActiveActionRow | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2416` |
| button | 취소 | 상태: ShowCopyModal | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2455` |
| button | 복사하기 | dialog alert, clipboard | `src/app/(ko)/(admin)/dashboard/all/page.tsx:2461` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 목록으로 돌아가기 ✕ | 상태: IsCustomMode,CustomText,Timeout | `src/components/editors/ComboSelectEditor.tsx:105` |
| clickable | <div> | onClick: () => { if (isAlwaysOn && inputRef.current) { inputRef.current.focus(… | `src/components/editors/CustomTextEditor.tsx:185` |
| clickable | {opt.label} | onMouseDown: (e) => e.stopPropagation() | `src/components/editors/StatusEditor.tsx:67` |
| clickable | {opt.label} | onClick: () => handleSelect(opt.value) | `src/components/editors/StatusEditor.tsx:80` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | 다시 시도 | fetch POST /api/admin/refund, db reservations.select | `src/components/reservations/BulkRefundSheet.tsx:293` |
| button | 닫기 | db reservations.select | `src/components/reservations/BulkRefundSheet.tsx:334` |
| clickable | 취소 처리 {request.name} 취소요청 {request.source} {request.pax} {request.contact} 📝 | 상태: SelectedReservation,RefundAmount,RefundReason | `src/components/reservations/CancellationRequestsView.tsx:140` |
| button | 취소 처리 | 상태: SelectedReservation,RefundAmount,RefundReason | `src/components/reservations/CancellationRequestsView.tsx:147` |
| button | 취소 처리 | 상태: SelectedReservation,RefundAmount,RefundReason | `src/components/reservations/CancellationRequestsView.tsx:169` |
| button | 닫기 | 상태: IsModalOpen | `src/components/reservations/CancellationRequestsView.tsx:271` |
| button | 결제 취소 (수수료 없음) | fetch POST /api/admin/refund, dialog alert, db reservations.update | `src/components/reservations/CancellationRequestsView.tsx:278` |
| button | 처리 중... / 안내완료 | dialog confirm, db reservations.update, dialog alert | `src/components/reservations/GuidanceNeededView.tsx:92` |
| clickable | 변경 승인 {request.name} 변경요청 OTA 에서 이미 확정된 변경이라 날짜는 반영해 두었습니다 반영됨 {request.source}… | 상태: SelectedReservation,NewDate,NewPickup | `src/components/reservations/RescheduleRequestsView.tsx:114` |
| button | 변경 승인 | 상태: SelectedReservation,NewDate,NewPickup | `src/components/reservations/RescheduleRequestsView.tsx:119` |
| button | 닫기 | 상태: IsModalOpen | `src/components/reservations/RescheduleRequestsView.tsx:185` |
| button | 처리 중... | fetch POST /api/admin/approve-reschedule, dialog alert | `src/components/reservations/RescheduleRequestsView.tsx:191` |

### `/dashboard/bulk-add` (admin) — 요소 24개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.insert` `db reservations.select` `db tour_settings.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 닫기 | onClick: handleClose | `src/app/(ko)/(admin)/dashboard/bulk-add/page.tsx:362` |
| button | 저장 중... / 전체 저장 | dialog alert, db reservations.insert | `src/app/(ko)/(admin)/dashboard/bulk-add/page.tsx:366` |
| button | 200행 추가 | 상태: Rows | `src/app/(ko)/(admin)/dashboard/bulk-add/page.tsx:387` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/crew` (admin) — 요소 42개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db captains.delete` `db captains.insert` `db captains.select` `db crew_members.delete` `db crew_members.insert` `db crew_members.select` `db crew_members.upsert` `db crew_memos.select` `db crew_memos.upsert` `db crew_schedules.delete` `db crew_schedules.select` `db crew_schedules.upsert` `db reservations.select` `db shift_captains.delete` `db shift_captains.select` `db shift_captains.upsert` `export` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| clickable | [icon:ChevronLeft] | onPointerDown: (e) => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:98` |
| button | [icon:ChevronLeft] | db crew_members.upsert, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:99` |
| clickable | [icon:ChevronRight] | onPointerDown: (e) => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:110` |
| button | [icon:ChevronRight] | db crew_members.upsert, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:111` |
| button | [icon:Trash2] | dialog confirm, db crew_members.delete, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:122` |
| link | 스케쥴 관리 | nav /dashboard/crew | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:564` |
| link | 출석 현황 | nav /dashboard/crew/attendance | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:571` |
| button | [icon:Trash2] | dialog confirm, db captains.delete, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:588` |
| button | [icon:Plus] | db captains.insert, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:593` |
| component | [icon:SortableCrewItem+Plus] | db crew_members.upsert, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:602` |
| component | <SortableCrewItem> | dialog confirm, db crew_members.delete, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:613` |
| button | [icon:Plus] | db crew_members.insert, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:624` |
| button | 저장 | db crew_memos.upsert, dialog alert | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:636` |
| button | [icon:ChevronLeft] | 상태: CurrentDate | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:653` |
| button | [icon:ChevronRight] | 상태: CurrentDate | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:655` |
| button | 저장 중... / 이미지 저장 | export, dialog alert | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:658` |
| clickable | {text} | db crew_schedules.delete, db crew_schedules.upsert, db crew_members.select, db captains.select, db crew_schedules.select, db shift_captains.select, db crew_memos.select | `src/app/(ko)/(admin)/dashboard/crew/page.tsx:747` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | {day} | 상태: IsOpen,CurrentDate,SelectedDate | `src/components/ui/DatePicker.tsx:184` |
| button | [icon:CalendarIcon] | 상태: IsOpen | `src/components/ui/DatePicker.tsx:224` |
| button | [icon:ChevronLeft] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:237` |
| button | [icon:ChevronRight] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:276` |

### `/dashboard/crew/attendance` (admin) — 요소 30개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db captain_attendance.select` `db captains.select` `db captains.update` `db crew_attendance.select` `db crew_members.select` `db crew_members.update` `db crew_schedules.select` `db reservations.select` `db shift_captains.select` `export` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 스케쥴 관리 | nav /dashboard/crew | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:288` |
| link | 출석 현황 | nav /dashboard/crew/attendance | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:291` |
| button | QR 보기 | 상태: ShowQr | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:303` |
| button | [icon:ChevronLeft] | 상태: CurrentDate | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:311` |
| button | [icon:ChevronRight] | 상태: CurrentDate | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:313` |
| clickable | 출석 체크 QR OCEANSTAR 출석 체크 QR 스캔 후 각자 PIN 입력 이미지로 저장 | 상태: ShowQr | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:442` |
| clickable | 출석 체크 QR OCEANSTAR 출석 체크 QR 스캔 후 각자 PIN 입력 이미지로 저장 | onClick: e => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:443` |
| button | [icon:X] | 상태: ShowQr | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:446` |
| button | 이미지로 저장 | export | `src/app/(ko)/(admin)/dashboard/crew/attendance/page.tsx:453` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/home` (admin) — 요소 28개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `db reservations.update` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /dashboard/all` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| clickable | 새로운 예약 (대기) 처리되지 않은 신규 예약건 {waitingCount} 건 | 상태: ShowNewReservations | `src/app/(ko)/(admin)/dashboard/home/page.tsx:92` |
| clickable | 취소 요청 처리가 필요한 취소 요청건 {cancellationCount} 건 | nav /dashboard/all | `src/app/(ko)/(admin)/dashboard/home/page.tsx:114` |
| link | {item.name} | — | `src/app/(ko)/(admin)/dashboard/home/page.tsx:143` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | [icon:ArrowLeft] | 상태: ShowNewReservations | `src/components/reservations/NewReservationsView.tsx:102` |
| button | 전체 확인 | dialog confirm, db reservations.update, db reservations.select | `src/components/reservations/NewReservationsView.tsx:114` |
| button | 확인 완료 | db reservations.update, db reservations.select | `src/components/reservations/NewReservationsView.tsx:136` |
| clickable | 예약관리에서 보기 {req.name} {req.status} {req.source} {req.pax} {req.option} {req.pick… | nav /dashboard/all | `src/components/reservations/NewReservationsView.tsx:143` |

### `/dashboard/invoice` (admin) — 요소 28개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `export` `fetch GET /api/admin/invoice-prices` `fetch POST /api/admin/invoice-prices` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 인보이스 생성 (미리보기) | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:371` |
| button | 단가 관리 ($) | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:377` |
| button | 예약 조회 | dialog alert, db reservations.select | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:415` |
| button | 엑셀 다운로드 (.xlsx) | dialog alert, export | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:429` |
| button | 여행사 추가 | 상태: Prices | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:536` |
| button | 단가 저장 | dialog alert, fetch POST /api/admin/invoice-prices, fetch GET /api/admin/invoice-prices | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:539` |
| button | 삭제 | 상태: Prices | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:554` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/list` (admin) — 요소 59개

로드/전체 기능: `auth signOut` `clipboard` `db agency_notifications.select` `db agency_notifications.update` `db reservations.delete` `db reservations.insert` `db reservations.select` `db reservations.update` `db tour_settings.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | <button> | 상태: ActiveTab | `src/components/reservations/ReservationListView.tsx:252` |
| button | 명단 선택 명단선택 | 상태: IsListSelectOpen | `src/components/reservations/ReservationListView.tsx:272` |
| button | 오늘 명단 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:287` |
| button | 리컨펌 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:297` |
| clickable | 날짜 직접 선택 | onClick: (e) => e.stopPropagation() | `src/components/reservations/ReservationListView.tsx:311` |
| clickable | <div> | 상태: IsListSelectOpen | `src/components/reservations/ReservationListView.tsx:319` |
| button | 정렬 | 상태: IsSortOpen | `src/components/reservations/ReservationListView.tsx:330` |
| button | 접수일 (오름차순) | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:340` |
| button | 접수일 (내림차순) | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:341` |
| button | 예약 경로별 | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:342` |
| button | 픽업 장소별 | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:343` |
| clickable | <div> | 상태: IsSortOpen | `src/components/reservations/ReservationListView.tsx:345` |
| button | 한눈에 보기 | 상태: IsSimpleView | `src/components/reservations/ReservationListView.tsx:351` |
| button | 오늘명단 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:377` |
| button | 내일명단 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:383` |
| button | 새 예약 등록 | 상태: SelectedReservation,IsModalOpen | `src/components/reservations/ReservationListView.tsx:389` |
| button | 검색 초기화 ✕ | 상태: SearchQuery | `src/components/reservations/ReservationListView.tsx:420` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:463` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:488` |
| button | [icon:X] | 상태: IsSimpleView | `src/components/reservations/ReservationListView.tsx:503` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:552` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:578` |
| component | <ReservationModal> | 상태: IsModalOpen | `src/components/reservations/ReservationListView.tsx:594` |
| button | [icon:X] | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:215` |
| form | 진행상태 예약확정 예약대기 취소 대기 예약경로 (자동변환) 예약자명 인원 (자동변환) 옵션 (자동변환) 픽업장소 (선택안함) 직접 입력... … | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:224` |
| button | 명단복사 | clipboard, dialog alert | `src/components/reservations/ReservationModal.tsx:390` |
| button | 취소 | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:398` |
| button | 저장 중... | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:405` |
| clickable | {res.status} {res.source} {res.name} {res.pax} {res.option} {res.pickup_locatio… | 상태: SelectedRowId | `src/components/reservations/ReservationTable.tsx:185` |
| button | [icon:Settings] | 상태: OpenMenuId | `src/components/reservations/ReservationTable.tsx:201` |
| button | 수정 | 상태: OpenMenuId,SelectedReservation,IsModalOpen | `src/components/reservations/ReservationTable.tsx:216` |
| button | 삭제 | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationTable.tsx:228` |
| clickable | <td> | onClick: (e) => e.stopPropagation() | `src/components/reservations/ReservationTable.tsx:245` |
| clickable | {res.contact} | clipboard | `src/components/reservations/ReservationTable.tsx:327` |
| button | {day} | 상태: IsOpen,CurrentDate,SelectedDate | `src/components/ui/DatePicker.tsx:184` |
| button | [icon:CalendarIcon] | 상태: IsOpen | `src/components/ui/DatePicker.tsx:224` |
| button | [icon:ChevronLeft] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:237` |
| button | [icon:ChevronRight] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:276` |

### `/dashboard/monthly` (admin) — 요소 38개

로드/전체 기능: `auth signOut` `clipboard` `db agency_notifications.select` `db agency_notifications.update` `db reservations.insert` `db reservations.select` `db reservations.update` `db tour_settings.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /dashboard/today` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | + 새 예약 추가 | 상태: IsModalOpen | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:135` |
| button | [icon:ChevronLeft] | 상태: CurrentDate | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:144` |
| button | ▼ | 상태: ShowDatePicker | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:149` |
| button | 오늘 날짜로 이동 | 상태: CurrentDate,ShowDatePicker | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:167` |
| button | [icon:ChevronRight] | 상태: CurrentDate | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:175` |
| clickable | <div> | 상태: ShowDatePicker | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:180` |
| clickable | <div> | nav /dashboard/today | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:210` |
| component | <ReservationModal> | 상태: IsModalOpen | `src/app/(ko)/(admin)/dashboard/monthly/page.tsx:272` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | [icon:X] | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:215` |
| form | 진행상태 예약확정 예약대기 취소 대기 예약경로 (자동변환) 예약자명 인원 (자동변환) 옵션 (자동변환) 픽업장소 (선택안함) 직접 입력... … | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:224` |
| button | 명단복사 | clipboard, dialog alert | `src/components/reservations/ReservationModal.tsx:390` |
| button | 취소 | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:398` |
| button | 저장 중... | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:405` |
| button | {day} | 상태: IsOpen,CurrentDate,SelectedDate | `src/components/ui/DatePicker.tsx:184` |
| button | [icon:CalendarIcon] | 상태: IsOpen | `src/components/ui/DatePicker.tsx:224` |
| button | [icon:ChevronLeft] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:237` |
| button | [icon:ChevronRight] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:276` |

### `/dashboard/overview` (admin) — 요소 34개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `export` `fetch GET /api/admin/invoice-prices` `fetch POST /api/admin/invoice-prices` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 인보이스 생성 (미리보기) | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:371` |
| button | 단가 관리 ($) | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:377` |
| button | 예약 조회 | dialog alert, db reservations.select | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:415` |
| button | 엑셀 다운로드 (.xlsx) | dialog alert, export | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:429` |
| button | 여행사 추가 | 상태: Prices | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:536` |
| button | 단가 저장 | dialog alert, fetch POST /api/admin/invoice-prices, fetch GET /api/admin/invoice-prices | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:539` |
| button | 삭제 | 상태: Prices | `src/app/(ko)/(admin)/dashboard/invoice/page.tsx:554` |
| link | Overview | nav /dashboard/overview | `src/app/(ko)/(admin)/dashboard/overview/page.tsx:170` |
| link | 정산검토 | nav /dashboard/settlement | `src/app/(ko)/(admin)/dashboard/overview/page.tsx:177` |
| button | PPT 생성 중 / PPT 다운로드 | export, dialog alert | `src/app/(ko)/(admin)/dashboard/overview/page.tsx:196` |
| button | 다시 시도 | 상태: Retry | `src/app/(ko)/(admin)/dashboard/overview/page.tsx:237` |
| button | {p} | 상태: Hidden | `src/app/(ko)/(admin)/dashboard/overview/page.tsx:289` |
| button | {o.label} | onClick: () => onChange(o.value) | `src/app/(ko)/(admin)/dashboard/overview/page.tsx:541` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/reconfirm` (admin) — 요소 46개

로드/전체 기능: `auth signOut` `clipboard` `db agency_notifications.select` `db agency_notifications.update` `db reservations.delete` `db reservations.insert` `db reservations.select` `db reservations.update` `db tour_settings.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | {tab} | 상태: ActiveTab | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:93` |
| button | 정렬 | 상태: IsSortOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:123` |
| button | 접수일 (오름차순) | 상태: SortOption,IsSortOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:134` |
| button | 접수일 (내림차순) | 상태: SortOption,IsSortOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:135` |
| button | 예약 경로별 | 상태: SortOption,IsSortOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:136` |
| button | 픽업 장소별 | 상태: SortOption,IsSortOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:137` |
| clickable | <div> | 상태: IsSortOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:139` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:159` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:175` |
| component | <ReservationModal> | 상태: IsModalOpen | `src/app/(ko)/(admin)/dashboard/reconfirm/page.tsx:186` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | [icon:X] | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:215` |
| form | 진행상태 예약확정 예약대기 취소 대기 예약경로 (자동변환) 예약자명 인원 (자동변환) 옵션 (자동변환) 픽업장소 (선택안함) 직접 입력... … | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:224` |
| button | 명단복사 | clipboard, dialog alert | `src/components/reservations/ReservationModal.tsx:390` |
| button | 취소 | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:398` |
| button | 저장 중... | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:405` |
| clickable | {res.status} {res.source} {res.name} {res.pax} {res.option} {res.pickup_locatio… | 상태: SelectedRowId | `src/components/reservations/ReservationTable.tsx:185` |
| button | [icon:Settings] | 상태: OpenMenuId | `src/components/reservations/ReservationTable.tsx:201` |
| button | 수정 | 상태: OpenMenuId,SelectedReservation,IsModalOpen | `src/components/reservations/ReservationTable.tsx:216` |
| button | 삭제 | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationTable.tsx:228` |
| clickable | <td> | onClick: (e) => e.stopPropagation() | `src/components/reservations/ReservationTable.tsx:245` |
| clickable | {res.contact} | clipboard | `src/components/reservations/ReservationTable.tsx:327` |
| button | {day} | 상태: IsOpen,CurrentDate,SelectedDate | `src/components/ui/DatePicker.tsx:184` |
| button | [icon:CalendarIcon] | 상태: IsOpen | `src/components/ui/DatePicker.tsx:224` |
| button | [icon:ChevronLeft] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:237` |
| button | [icon:ChevronRight] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:276` |

### `/dashboard/refunds` (admin) — 요소 29개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `fetch POST /api/admin/refund` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | 다시 시도 | fetch POST /api/admin/refund, db reservations.select | `src/components/reservations/BulkRefundSheet.tsx:293` |
| button | 닫기 | db reservations.select | `src/components/reservations/BulkRefundSheet.tsx:334` |
| button | {f.label} | db reservations.select | `src/components/reservations/RefundView.tsx:105` |
| clickable | {r.name} {r.order_id} {r.tour_date} {r.option} {r.pax} — 수기 환불 환불 완료 결제확정 결제확정X | 상태: Selected | `src/components/reservations/RefundView.tsx:165` |
| clickable | <td> | onClick: e => e.stopPropagation() | `src/components/reservations/RefundView.tsx:173` |
| button | 선택 건 환불 | 상태: SheetOpen | `src/components/reservations/RefundView.tsx:227` |
| button | ✕ | 상태: Selected | `src/components/reservations/RefundView.tsx:234` |
| component | <BulkRefundSheet> | db reservations.select | `src/components/reservations/RefundView.tsx:241` |

### `/dashboard/settlement` (admin) — 요소 53개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db product_prices.delete` `db product_prices.insert` `db product_prices.select` `db product_prices.update` `db reservations.select` `db reservations.update` `export` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | Overview | nav /dashboard/overview | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:302` |
| link | 정산검토 | nav /dashboard/settlement | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:309` |
| button | 기준가 관리 | 상태: ShowSettings | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:325` |
| button | {p.label} (준비중) | 상태: CurrentPlatform,ParsedRows,ParseErrors | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:340` |
| clickable | 확인되지 않은 과거 미정산 내역이 {unsettledItems.length} 건 있습니다. 이월된 예약이 누락되지 않도록 확인해주세요. 내역 … | 상태: ShowUnsettledModal | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:357` |
| clickable | 파일 처리 중... {uploadedFileName} 다시 업로드하려면 클릭하세요 {platform.label} 정산 엑셀 파일을 드래그하거나… | db reservations.select, db product_prices.select | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:377` |
| button | 초기화 | 상태: ParsedRows,ParseErrors,MatchResults | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:459` |
| button | 정산 제외 | dialog alert, dialog confirm, db reservations.update | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:462` |
| button | 정산 확정 ( {selectedIds.size} ) | dialog alert, dialog confirm, db reservations.update | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:470` |
| clickable | {r.statusLabel} {r.excelGroup.rows.length} 건 {r.classifiedProductName} - {note} | 상태: DetailResult | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:501` |
| clickable | <td> | onClick: e => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:506` |
| component | <ProductSettingsModal> | 상태: ShowSettings | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:590` |
| component | <DetailPopup> | 상태: DetailResult | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:593` |
| component | <UnsettledItemsModal> | 상태: ShowUnsettledModal | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:597` |
| clickable | 미정산 이월 내역 확인 ( {items.length} 건) 이름 투어일 옵션 인원 플랫폼 {selected.size} 개 선택됨 정산 제외 정… | 상태: ShowUnsettledModal | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:640` |
| clickable | 미정산 이월 내역 확인 ( {items.length} 건) 이름 투어일 옵션 인원 플랫폼 {selected.size} 개 선택됨 정산 제외 정… | onClick: e => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:641` |
| button | [icon:X] | 상태: ShowUnsettledModal | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:647` |
| button | 정산 제외 | dialog alert, dialog confirm | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:694` |
| button | 정산 확정 처리 | dialog alert, dialog confirm | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:700` |
| clickable | ⚙️ 기준가 관리 취소 / 상품 추가 닫기 | 상태: ShowSettings | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:803` |
| clickable | ⚙️ 기준가 관리 취소 / 상품 추가 닫기 | onClick: e => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:804` |
| button | [icon:X] | 상태: ShowSettings | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:808` |
| button | ON / OFF | db product_prices.update | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:851` |
| button | 저장 | db product_prices.update, dialog alert | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:856` |
| button | 삭제 | dialog confirm, db product_prices.delete | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:859` |
| button | ... / 추가 | db product_prices.select, db product_prices.insert, dialog alert | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:890` |
| button | 취소 / 상품 추가 | 상태: NewRow | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:903` |
| button | 닫기 | 상태: ShowSettings | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:909` |
| clickable | 상세 비교 — {result.statusLabel} 📄 엑셀 데이터 ( 건) 엑셀에 데이터 없음 🗃️ DB 데이터 (병합) DB에 데이터 … | 상태: DetailResult | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:922` |
| clickable | 상세 비교 — {result.statusLabel} 📄 엑셀 데이터 ( 건) 엑셀에 데이터 없음 🗃️ DB 데이터 (병합) DB에 데이터 … | onClick: e => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:923` |
| button | [icon:X] | 상태: DetailResult | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:933` |
| button | 닫기 | 상태: DetailResult | `src/app/(ko)/(admin)/dashboard/settlement/page.tsx:1035` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/stats` (admin) — 요소 24개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `export` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | Overview | nav /dashboard/overview | `src/app/(ko)/(admin)/dashboard/stats/page.tsx:239` |
| link | 정산검토 | nav /dashboard/settlement | `src/app/(ko)/(admin)/dashboard/stats/page.tsx:246` |
| button | 인보이스 (Excel) | dialog alert, export | `src/app/(ko)/(admin)/dashboard/stats/page.tsx:387` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/today` (admin) — 요소 59개

로드/전체 기능: `auth signOut` `clipboard` `db agency_notifications.select` `db agency_notifications.update` `db reservations.delete` `db reservations.insert` `db reservations.select` `db reservations.update` `db tour_settings.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | <button> | 상태: ActiveTab | `src/components/reservations/ReservationListView.tsx:252` |
| button | 명단 선택 명단선택 | 상태: IsListSelectOpen | `src/components/reservations/ReservationListView.tsx:272` |
| button | 오늘 명단 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:287` |
| button | 리컨펌 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:297` |
| clickable | 날짜 직접 선택 | onClick: (e) => e.stopPropagation() | `src/components/reservations/ReservationListView.tsx:311` |
| clickable | <div> | 상태: IsListSelectOpen | `src/components/reservations/ReservationListView.tsx:319` |
| button | 정렬 | 상태: IsSortOpen | `src/components/reservations/ReservationListView.tsx:330` |
| button | 접수일 (오름차순) | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:340` |
| button | 접수일 (내림차순) | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:341` |
| button | 예약 경로별 | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:342` |
| button | 픽업 장소별 | 상태: SortOption,IsSortOpen | `src/components/reservations/ReservationListView.tsx:343` |
| clickable | <div> | 상태: IsSortOpen | `src/components/reservations/ReservationListView.tsx:345` |
| button | 한눈에 보기 | 상태: IsSimpleView | `src/components/reservations/ReservationListView.tsx:351` |
| button | 오늘명단 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:377` |
| button | 내일명단 | 상태: ViewMode,IsListSelectOpen,SelectedDate | `src/components/reservations/ReservationListView.tsx:383` |
| button | 새 예약 등록 | 상태: SelectedReservation,IsModalOpen | `src/components/reservations/ReservationListView.tsx:389` |
| button | 검색 초기화 ✕ | 상태: SearchQuery | `src/components/reservations/ReservationListView.tsx:420` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:463` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:488` |
| button | [icon:X] | 상태: IsSimpleView | `src/components/reservations/ReservationListView.tsx:503` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:552` |
| component | <ReservationTable> | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationListView.tsx:578` |
| component | <ReservationModal> | 상태: IsModalOpen | `src/components/reservations/ReservationListView.tsx:594` |
| button | [icon:X] | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:215` |
| form | 진행상태 예약확정 예약대기 취소 대기 예약경로 (자동변환) 예약자명 인원 (자동변환) 옵션 (자동변환) 픽업장소 (선택안함) 직접 입력... … | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:224` |
| button | 명단복사 | clipboard, dialog alert | `src/components/reservations/ReservationModal.tsx:390` |
| button | 취소 | 상태: IsModalOpen | `src/components/reservations/ReservationModal.tsx:398` |
| button | 저장 중... | db reservations.update, db reservations.insert, dialog alert, db reservations.select | `src/components/reservations/ReservationModal.tsx:405` |
| clickable | {res.status} {res.source} {res.name} {res.pax} {res.option} {res.pickup_locatio… | 상태: SelectedRowId | `src/components/reservations/ReservationTable.tsx:185` |
| button | [icon:Settings] | 상태: OpenMenuId | `src/components/reservations/ReservationTable.tsx:201` |
| button | 수정 | 상태: OpenMenuId,SelectedReservation,IsModalOpen | `src/components/reservations/ReservationTable.tsx:216` |
| button | 삭제 | dialog confirm, db reservations.delete, db reservations.select, dialog alert | `src/components/reservations/ReservationTable.tsx:228` |
| clickable | <td> | onClick: (e) => e.stopPropagation() | `src/components/reservations/ReservationTable.tsx:245` |
| clickable | {res.contact} | clipboard | `src/components/reservations/ReservationTable.tsx:327` |
| button | {day} | 상태: IsOpen,CurrentDate,SelectedDate | `src/components/ui/DatePicker.tsx:184` |
| button | [icon:CalendarIcon] | 상태: IsOpen | `src/components/ui/DatePicker.tsx:224` |
| button | [icon:ChevronLeft] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:237` |
| button | [icon:ChevronRight] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:276` |

### `/dashboard/vehicle` (admin) — 요소 35개

로드/전체 기능: `auth signOut` `clipboard` `db agency_notifications.select` `db agency_notifications.update` `db daily_vehicle_status.select` `db daily_vehicle_status.upsert` `db drivers.delete` `db drivers.insert` `db drivers.select` `db reservations.select` `db reservations.upsert` `db tour_settings.select` `export` `fetch GET <dataUrl>` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 기사 공유 기사님 명단 공유 | db reservations.select, db daily_vehicle_status.select | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:978` |
| button | {d.name} 기사님 | dialog alert, export, fetch GET <dataUrl>, dialog confirm | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:992` |
| button | 복사 텍스트로 복사 | clipboard, dialog alert | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:1007` |
| button | 저장 이미지 저장 | export, dialog alert | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:1015` |
| button | 전체 공유 전체 명단 공유 | db reservations.select, db daily_vehicle_status.select, dialog alert, export, fetch GET <dataUrl>, dialog confirm | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:1023` |
| component | [icon:UnassignedDropZone+VehicleDropZone] | db reservations.upsert | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:1070` |
| button | 바로 공유하기 | dialog alert, export | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:1156` |
| button | 닫기 | 상태: ReadyShareFiles | `src/app/(ko)/(admin)/dashboard/vehicle/page.tsx:1192` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | {day} | 상태: IsOpen,CurrentDate,SelectedDate | `src/components/ui/DatePicker.tsx:184` |
| button | [icon:CalendarIcon] | 상태: IsOpen | `src/components/ui/DatePicker.tsx:224` |
| button | [icon:ChevronLeft] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:237` |
| button | [icon:ChevronRight] | 상태: CurrentMonth | `src/components/ui/DatePicker.tsx:276` |
| button | [icon:Plus] | db drivers.select, db drivers.insert, dialog alert | `src/components/vehicle/DriverManager.tsx:72` |
| button | 삭제 | dialog confirm, db drivers.delete, dialog alert | `src/components/vehicle/DriverManager.tsx:85` |

### `/dashboard/website-settings` (admin) — 요소 21개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /dashboard/website-settings/dates` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/website-settings/dates` (admin) — 요소 33개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db blocked_dates.delete` `db blocked_dates.insert` `db blocked_dates.select` `db reservations.select` `db tour_settings.delete` `db tour_settings.insert` `db tour_settings.select` `db tour_settings.update` `db tour_settings.upsert` `fetch GET /api/exchange-rate` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 새 상품 추가 | 상태: ShowAddModal | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:361` |
| button | 수동 갱신 | 상태: Settings | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:388` |
| button | 판매중지 판매중 | db tour_settings.update, dialog alert | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:443` |
| button | 상품 삭제 | dialog confirm, db tour_settings.delete, db tour_settings.select, db blocked_dates.select, dialog alert | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:458` |
| button | 전체 설정 저장 | db tour_settings.upsert, dialog alert | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:596` |
| button | 해당 옵션 차단 | dialog alert, db blocked_dates.insert, db tour_settings.select, db blocked_dates.select | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:662` |
| button | 차단 해제 | dialog confirm, db blocked_dates.delete, db tour_settings.select, db blocked_dates.select, dialog alert | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:697` |
| clickable | 새 투어 상품 추가 옵션 ID (영문) * 상품명 (한글) * 상품 설명 시작 시간 종료 시간 성인 가격 (USD) 성인 가격 (KRW) 아동… | 상태: ShowAddModal | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:716` |
| clickable | 새 투어 상품 추가 옵션 ID (영문) * 상품명 (한글) * 상품 설명 시작 시간 종료 시간 성인 가격 (USD) 성인 가격 (KRW) 아동… | onClick: e => e.stopPropagation() | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:717` |
| button | [icon:X] | 상태: ShowAddModal | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:720` |
| button | 취소 | 상태: ShowAddModal | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:824` |
| button | 상품 추가 | dialog alert, db tour_settings.insert, db tour_settings.select, db blocked_dates.select | `src/app/(ko)/(admin)/dashboard/website-settings/dates/page.tsx:828` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/dashboard/website-settings/images` (admin) — 요소 26개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `db tour_settings.select` `fetch GET :param/versions.json?t=:param` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission` `storage website-assets.remove` `storage website-assets.upload`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |
| button | [icon:Loader2+X] | fetch GET :param/versions.json?t=:param, storage website-assets.upload, storage website-assets.remove | `src/components/website-settings/WebsiteImagesTable.tsx:97` |
| component | [icon:SortableThumbnail] | fetch GET :param/versions.json?t=:param, storage website-assets.upload | `src/components/website-settings/WebsiteImagesTable.tsx:433` |
| component | <SortableThumbnail> | fetch GET :param/versions.json?t=:param, storage website-assets.upload, storage website-assets.remove | `src/components/website-settings/WebsiteImagesTable.tsx:445` |
| button | 사진 추가 | 상태: SelectedTargetId | `src/components/website-settings/WebsiteImagesTable.tsx:469` |
| button | 업로드 중... / 사진 변경 | 상태: SelectedTargetId | `src/components/website-settings/WebsiteImagesTable.tsx:492` |

### `/dashboard/website-settings/pickup` (admin) — 요소 22개

로드/전체 기능: `auth signOut` `db agency_notifications.select` `db agency_notifications.update` `db reservations.select` `fetch GET /api/pickup` `fetch POST /api/admin/pickup` `localStorage ?` `localStorage remember-device` `localStorage sidebar-collapsed` `nav /dashboard/alerts` `nav /login` `nav <pendingNavigation>` `nav <targetUrl>` `push-permission`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 변경사항 저장 | fetch POST /api/admin/pickup, dialog alert | `src/app/(ko)/(admin)/dashboard/website-settings/pickup/page.tsx:152` |
| button | [icon:X+Menu] | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:124` |
| clickable | <div> | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:134` |
| button | [icon:PanelLeftOpen+PanelLeftClose] | localStorage sidebar-collapsed | `src/app/(ko)/(admin)/layout.tsx:164` |
| button | {item.name} | 상태: IsMobileOpen,OpenGroups | `src/app/(ko)/(admin)/layout.tsx:191` |
| button | {child.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:226` |
| button | {item.name} | 상태: IsMobileOpen | `src/app/(ko)/(admin)/layout.tsx:249` |
| button | 로그아웃 | auth signOut, nav /login | `src/app/(ko)/(admin)/layout.tsx:287` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| button | 알림 99+ | db agency_notifications.update | `src/components/dashboard/NotificationBell.tsx:234` |
| button | [icon:X] | 상태: Toasts | `src/components/dashboard/NotificationBell.tsx:315` |
| clickable | <div> | 상태: IsOpen | `src/components/dashboard/NotificationBell.tsx:336` |
| button | 알림 센터로 이동 | nav /dashboard/alerts | `src/components/dashboard/NotificationBell.tsx:361` |
| button | 알림 설정 | 상태: ShowSettingsPanel | `src/components/dashboard/NotificationBell.tsx:444` |
| button | <button> | onClick: () => updateSettings({ soundEnabled: !settings.soundEnabled }) | `src/components/dashboard/NotificationBell.tsx:474` |
| button | <button> | onClick: () => updateSettings({ vibrationEnabled: !settings.vibrationEnabled }) | `src/components/dashboard/NotificationBell.tsx:497` |
| button | <button> | onClick: handlePushToggle | `src/components/dashboard/NotificationBell.tsx:525` |
| button | 테스트 알림 보내기 | 상태: IsOpen,ShowSettingsPanel,Timeout | `src/components/dashboard/NotificationBell.tsx:539` |
| button | 저장 후 이동 | nav <pendingNavigation>, dialog alert | `src/components/providers/UnsavedChangesProvider.tsx:115` |
| button | 저장하지 않음 | nav <pendingNavigation> | `src/components/providers/UnsavedChangesProvider.tsx:121` |
| button | 취소 | 상태: ShowModal,PendingNavigation | `src/components/providers/UnsavedChangesProvider.tsx:127` |

### `/kr` (customer) — 요소 64개

로드/전체 기능: `cookie` `fetch GET /api/availability` `fetch GET /api/google-reviews` `fetch GET /api/pickup` `fetch GET /api/reviews` `fetch GET /api/settings` `fetch GET {SUPABASE}/storage/v1/object/public/website-assets/versions.json?t=:param` `fetch POST /api/reviews` `fetch POST /api/stripe/checkout` `nav /` `nav /kr` `nav <data.url>`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |
| link | 구글에서 전체 리뷰 보기 | external https://www.google.com/maps/search/ | `src/components/GoogleReviews.tsx:85` |
| button | [icon:ChevronLeft] | scroll | `src/components/GoogleReviews.tsx:98` |
| button | [icon:ChevronRight] | scroll | `src/components/GoogleReviews.tsx:106` |
| button | {category.category} {category.items.length} | 상태: ActiveTab,OpenItems | `src/components/landing/FAQSection.tsx:261` |
| button | Q. {item.q} | 상태: OpenItems | `src/components/landing/FAQSection.tsx:301` |
| clickable | [icon:Image] | 상태: IsTouched | `src/components/landing/ImageCarousel.tsx:65` |
| clickable | Official Pickup Route / 오션스타 공식 픽업 노선도 Enter your hotel address when booking to… | 상태: IsOpen | `src/components/landing/PickupGuide.tsx:36` |
| link | 구글 지도 열기 | external https://www.google.com/maps/search/ | `src/components/landing/PickupGuide.tsx:91` |
| clickable | OceanStar Logo | anchor #home, scroll | `src/components/landing/ReservationClientPage.tsx:595` |
| button | Home | anchor #home, scroll | `src/components/landing/ReservationClientPage.tsx:600` |
| button | Tours / 투어 | anchor #tours, scroll | `src/components/landing/ReservationClientPage.tsx:601` |
| button | Reviews / 고객후기 | anchor #reviews, scroll | `src/components/landing/ReservationClientPage.tsx:602` |
| button | FAQ | anchor #faq, scroll | `src/components/landing/ReservationClientPage.tsx:603` |
| button | About Us / 회사소개 | anchor #about, scroll | `src/components/landing/ReservationClientPage.tsx:604` |
| button | Toggle Menu | 상태: IsMobileMenuOpen | `src/components/landing/ReservationClientPage.tsx:608` |
| button | EN / KR | cookie, nav /, nav /kr | `src/components/landing/ReservationClientPage.tsx:615` |
| link | 내 예약 관리 | nav /manage-booking, nav /kr/manage-booking | `src/components/landing/ReservationClientPage.tsx:630` |
| button | 투어 예약하기 | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:635` |
| button | Home | anchor #home, scroll | `src/components/landing/ReservationClientPage.tsx:646` |
| button | Tours / 투어 | anchor #tours, scroll | `src/components/landing/ReservationClientPage.tsx:647` |
| button | Reviews / 고객후기 | anchor #reviews, scroll | `src/components/landing/ReservationClientPage.tsx:648` |
| button | FAQ | anchor #faq, scroll | `src/components/landing/ReservationClientPage.tsx:649` |
| button | About Us / 회사소개 | anchor #about, scroll | `src/components/landing/ReservationClientPage.tsx:650` |
| button | 바로 예약하기 | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:685` |
| button | 자세히 보기 | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:914` |
| button | 예약하기 | 상태: SelectedTour,IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:920` |
| button | 리뷰 작성하기 | 상태: ReviewError,ReviewSuccess,IsReviewOpen | `src/components/landing/ReservationClientPage.tsx:939` |
| button | 이전 리뷰 | scroll | `src/components/landing/ReservationClientPage.tsx:964` |
| button | 다음 리뷰 | scroll | `src/components/landing/ReservationClientPage.tsx:971` |
| button | <button> | 상태: ExpandedReviews | `src/components/landing/ReservationClientPage.tsx:998` |
| button | <Image> | 상태: LightboxImage | `src/components/landing/ReservationClientPage.tsx:1010` |
| link | Instagram | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/landing/ReservationClientPage.tsx:1083` |
| link | YouTube | external https://www.youtube.com/@oceanstarhi | `src/components/landing/ReservationClientPage.tsx:1092` |
| link | Hawaiian Restaurants / 맛집 리스트 보기 | nav /restaurants, nav /kr/restaurants | `src/components/landing/ReservationClientPage.tsx:1101` |
| link | 구글 지도로 바로보기 | external https://www.google.com/maps/place/%EC%98%A4%EC%85%98%EC%8A%A4%ED%83%80/@21.2909527,-157.8596751,17.95z/data=!4m6!3m5!1s0x7c006e0714500001:0x42c44e799ee07eac!8m2!3d21.2913542!4d-157.8586971!16s%2Fg%2F11t2p_627w | `src/components/landing/ReservationClientPage.tsx:1123` |
| button | 예약하기 | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1172` |
| clickable | <div> | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1185` |
| button | [icon:X] | 상태: IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1191` |
| form | 1 투어 선택 1.5 Select Combo Option / 콤보 세부 옵션 선택 1.6 Select Snorkeling Trip Time /… | 상태: BookingError,PendingBookingData,IsCurrencyModalOpen | `src/components/landing/ReservationClientPage.tsx:1197` |
| clickable | [icon:Check] | scroll | `src/components/landing/ReservationClientPage.tsx:1208` |
| clickable | {opt.label} | 상태: ComboOption | `src/components/landing/ReservationClientPage.tsx:1270` |
| clickable | {opt.label} | scroll | `src/components/landing/ReservationClientPage.tsx:1302` |
| button | [icon:X] | 상태: BookingError | `src/components/landing/ReservationClientPage.tsx:1689` |
| button | 응답 대기 중... / 결제하기 | 상태: BookingError,PendingBookingData,IsCurrencyModalOpen | `src/components/landing/ReservationClientPage.tsx:1701` |
| clickable | <div> | 상태: IsReviewOpen | `src/components/landing/ReservationClientPage.tsx:1720` |
| button | [icon:X] | 상태: IsReviewOpen | `src/components/landing/ReservationClientPage.tsx:1726` |
| form | {reviewError} 예약 번호 (영숫자 6자리) 예약 확정 및 결제 후 전송된 바우처에서 확인하실 수 있습니다. 이름 (초성 또는 닉네임… | fetch POST /api/reviews, fetch GET /api/reviews | `src/components/landing/ReservationClientPage.tsx:1732` |
| button | [icon:Star] | 상태: ReviewForm | `src/components/landing/ReservationClientPage.tsx:1767` |
| button | [icon:X] | 상태: ReviewForm | `src/components/landing/ReservationClientPage.tsx:1816` |
| button | 등록 중... / 리뷰 등록하기 | fetch POST /api/reviews, fetch GET /api/reviews | `src/components/landing/ReservationClientPage.tsx:1830` |
| clickable | <div> | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:1848` |
| button | [icon:X] | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:1856` |
| button | 닫기 | 상태: ExpandedTourDetails | `src/components/landing/ReservationClientPage.tsx:1880` |
| button | 예약하기 | 상태: ExpandedTourDetails,SelectedTour,IsBookingOpen | `src/components/landing/ReservationClientPage.tsx:1883` |
| clickable | Close Enlarged review photo | 상태: LightboxImage | `src/components/landing/ReservationClientPage.tsx:1903` |
| button | Close | 상태: LightboxImage | `src/components/landing/ReservationClientPage.tsx:1905` |
| clickable | <img> | onClick: (e) => e.stopPropagation() | `src/components/landing/ReservationClientPage.tsx:1912` |
| component | <CurrencySelectModal> | 상태: IsCurrencyModalOpen | `src/components/landing/ReservationClientPage.tsx:1923` |
| button | [icon:X] | 상태: IsCurrencyModalOpen | `src/components/payment/CurrencySelectModal.tsx:49` |
| button | ₩ {t.krwTitle} {t.krwDesc} | fetch POST /api/stripe/checkout, nav <data.url> | `src/components/payment/CurrencySelectModal.tsx:57` |
| button | {t.usdTitle} {t.usdDesc} | fetch POST /api/stripe/checkout, nav <data.url> | `src/components/payment/CurrencySelectModal.tsx:70` |
| button | {t.cancel} | 상태: IsCurrencyModalOpen | `src/components/payment/CurrencySelectModal.tsx:85` |

### `/kr/booking/payment-cancel` (customer) — 요소 4개

로드/전체 기능: —

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 다시 예약하기 | nav /kr | `src/app/(ko)/kr/booking/payment-cancel/page.tsx:34` |
| link | 홈페이지로 돌아가기 | nav /kr | `src/app/(ko)/kr/booking/payment-cancel/page.tsx:40` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/kr/booking/payment-success` (customer) — 요소 4개

로드/전체 기능: `fetch POST /api/stripe/verify-session` `nav /kr/booking/success`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 내 예약 조회 | nav /kr/manage-booking | `src/app/(ko)/kr/booking/payment-success/page.tsx:69` |
| link | 홈으로 | nav /kr | `src/app/(ko)/kr/booking/payment-success/page.tsx:75` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/kr/booking/success` (customer) — 요소 5개

로드/전체 기능: `cookie` `export` `fetch GET /api/reservation-detail` `nav /`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| button | 홈으로 돌아가기 | nav / | `src/components/booking/BookingSuccessClient.tsx:79` |
| button | 바우처 저장 | export, dialog alert | `src/components/booking/BookingSuccessClient.tsx:195` |
| link | 홈으로 이동 | nav / | `src/components/booking/BookingSuccessClient.tsx:201` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/kr/manage-booking` (customer) — 요소 13개

로드/전체 기능: `cookie` `fetch GET /api/availability` `fetch GET /api/pickup` `fetch GET /api/settings` `fetch POST /api/cancel` `fetch POST /api/reschedule` `fetch POST /api/verify-booking`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| form | 예약 정보 보호를 위해 예약 번호와 이메일을 입력해 주세요. 예약 번호 (영숫자 6자리) 이메일 주소 (Email Address) 예약 조회하기 | fetch POST /api/verify-booking, dialog alert | `src/components/booking/ManageBookingClient.tsx:323` |
| button | 예약 조회하기 | fetch POST /api/verify-booking, dialog alert | `src/components/booking/ManageBookingClient.tsx:350` |
| button | 투어일정 / 픽업장소 변경하기 (수수료 없음) | 상태: IsRescheduling | `src/components/booking/ManageBookingClient.tsx:386` |
| button | 💬 일정 변경은 카카오톡 채널로 문의해주세요 | — | `src/components/booking/ManageBookingClient.tsx:393` |
| button | 예약 취소 진행 | 상태: ShowCancelModal | `src/components/booking/ManageBookingClient.tsx:398` |
| button | 취소 | 상태: IsRescheduling | `src/components/booking/ManageBookingClient.tsx:527` |
| button | 변경 완료 | dialog alert, fetch POST /api/reschedule | `src/components/booking/ManageBookingClient.tsx:533` |
| button | 돌아가기 | 상태: ShowCancelModal | `src/components/booking/ManageBookingClient.tsx:612` |
| button | 취소하기 | 상태: ShowFinalConfirmModal | `src/components/booking/ManageBookingClient.tsx:618` |
| button | 아니오 | 상태: ShowFinalConfirmModal | `src/components/booking/ManageBookingClient.tsx:656` |
| button | 최종 취소 확정 | dialog alert, fetch POST /api/cancel | `src/components/booking/ManageBookingClient.tsx:663` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/kr/restaurants` (customer) — 요소 7개

로드/전체 기능: `export` `fetch GET https://api.qrserver.com/v1/create-qr-code/` `open https://api.qrserver.com/v1/create-qr-code/`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 메인으로 | nav / | `src/app/(ko)/kr/restaurants/page.tsx:24` |
| button | QR 보기 | 상태: IsQrOpen | `src/app/(ko)/kr/restaurants/page.tsx:34` |
| link | 카톡 바로가기! | external http://pf.kakao.com/_yxfcExj | `src/app/(ko)/kr/restaurants/page.tsx:245` |
| button | [icon:X] | 상태: IsQrOpen | `src/app/(ko)/kr/restaurants/page.tsx:263` |
| button | QR 코드 다운로드 | fetch GET https://api.qrserver.com/v1/create-qr-code/, export, open https://api.qrserver.com/v1/create-qr-code/ | `src/app/(ko)/kr/restaurants/page.tsx:277` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/login` (admin) — 요소 4개

로드/전체 기능: `auth signInWithPassword` `localStorage remember-device` `nav /dashboard/alerts`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| form | 아이디 비밀번호 이 기기 기억하기 (24시간) 로그인 중... / 로그인 | auth signInWithPassword, dialog alert, localStorage remember-device, nav /dashboard/alerts | `src/app/(ko)/login/page.tsx:70` |
| button | 로그인 중... / 로그인 | auth signInWithPassword, dialog alert, localStorage remember-device, nav /dashboard/alerts | `src/app/(ko)/login/page.tsx:107` |
| link | 인스타그램 DM 문의하기 인스타그램 DM 문의 | external https://www.instagram.com/oceanstar_turtlesnorkelling | `src/components/common/KakaoChatWidget.tsx:31` |
| link | 카카오톡 1:1 상담하기 Ch 1:1 카카오톡 상담 | external http://pf.kakao.com/:param | `src/components/common/KakaoChatWidget.tsx:53` |

### `/manage-booking` (customer) — 요소 11개

로드/전체 기능: `cookie` `fetch GET /api/availability` `fetch GET /api/pickup` `fetch GET /api/settings` `fetch POST /api/cancel` `fetch POST /api/reschedule` `fetch POST /api/verify-booking`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| form | 예약 정보 보호를 위해 예약 번호와 이메일을 입력해 주세요. 예약 번호 (영숫자 6자리) 이메일 주소 (Email Address) 예약 조회하기 | fetch POST /api/verify-booking, dialog alert | `src/components/booking/ManageBookingClient.tsx:323` |
| button | 예약 조회하기 | fetch POST /api/verify-booking, dialog alert | `src/components/booking/ManageBookingClient.tsx:350` |
| button | 투어일정 / 픽업장소 변경하기 (수수료 없음) | 상태: IsRescheduling | `src/components/booking/ManageBookingClient.tsx:386` |
| button | 💬 일정 변경은 카카오톡 채널로 문의해주세요 | — | `src/components/booking/ManageBookingClient.tsx:393` |
| button | 예약 취소 진행 | 상태: ShowCancelModal | `src/components/booking/ManageBookingClient.tsx:398` |
| button | 취소 | 상태: IsRescheduling | `src/components/booking/ManageBookingClient.tsx:527` |
| button | 변경 완료 | dialog alert, fetch POST /api/reschedule | `src/components/booking/ManageBookingClient.tsx:533` |
| button | 돌아가기 | 상태: ShowCancelModal | `src/components/booking/ManageBookingClient.tsx:612` |
| button | 취소하기 | 상태: ShowFinalConfirmModal | `src/components/booking/ManageBookingClient.tsx:618` |
| button | 아니오 | 상태: ShowFinalConfirmModal | `src/components/booking/ManageBookingClient.tsx:656` |
| button | 최종 취소 확정 | dialog alert, fetch POST /api/cancel | `src/components/booking/ManageBookingClient.tsx:663` |

### `/restaurants` (customer) — 요소 5개

로드/전체 기능: `export` `fetch GET https://api.qrserver.com/v1/create-qr-code/` `open https://api.qrserver.com/v1/create-qr-code/`

| 종류 | 라벨 | 하는 일 | 위치 |
|---|---|---|---|
| link | 메인으로 | nav / | `src/app/(en)/restaurants/page.tsx:24` |
| button | QR 보기 | 상태: IsQrOpen | `src/app/(en)/restaurants/page.tsx:34` |
| link | 카톡 바로가기! | external http://pf.kakao.com/_yxfcExj | `src/app/(en)/restaurants/page.tsx:245` |
| button | [icon:X] | 상태: IsQrOpen | `src/app/(en)/restaurants/page.tsx:263` |
| button | QR 코드 다운로드 | fetch GET https://api.qrserver.com/v1/create-qr-code/, export, open https://api.qrserver.com/v1/create-qr-code/ | `src/app/(en)/restaurants/page.tsx:277` |

## 어떤 페이지에서도 쓰이지 않는 파일

- `src/app/(ko)/(admin)/dashboard/vehicle/page_skeleton.tsx`
- `src/components/dashboard/Navbar.tsx`
- `src/components/editors/SelectEditor.tsx`
- `src/components/landing/VideoPopupModal.tsx`
- `src/components/reservations/ReservationToast.tsx`

<details><summary>코드에서 참조되지 않는 번역 키 25개</summary>

`meta.title` `meta.description` `header.subtitle` `hero.badge` `hero.desc2` `tour.badges.private` `tour.badges.sunset` `tour.details.perTeam` `tour.details.team_price_format` `tour.details.adult_price_format` `review.google_desc1` `review.google_desc2` `review.google_btn` `footer.biz_no` `bookingModal.alert_error` `bookingModal.pay_currency` `bookingModal.usd_currency` `voucherEmail.attachment_notice` `voucherEmail.no_voucher_notice` `voucher.tip_review` `voucher.tip_manage` `voucher.tip_save` `voucher.prep_1` `voucher.prep_2` `voucher.prep_3`

</details>
