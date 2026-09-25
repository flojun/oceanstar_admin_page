# 오션스타 홈 리뉴얼 — 배포 전 기능 회귀 검사 계획서

- 작성일: 2026-09-25 · 기준 커밋: `84a88b5` (리뉴얼 코드가 들어가기 전)
- 대상: 이 저장소가 배포하는 **모든 것** — 고객 사이트, 어드민, 여행사 포털, 크루 체크인, API, 크론
- 관련 문서: `docs/renewal-prd.md` (리뉴얼 범위), `qa/baseline/ui-inventory.md` (버튼 전수 목록, 자동 생성)

---

## 0. 한 장 요약

**질문:** 리뉴얼을 배포했을 때, 지금 사이트에 있는 기능이 전부 제자리에서 제 버튼에 붙어 동작하는가?

**답을 내는 방법:** 리뉴얼 전 상태를 기준선으로 저장해 두고, 배포 후보를 4층으로 검사해 기준선과 비교한다.

| 층 | 무엇을 | 도구 | 시간 | 운영에서 돌려도 되나 |
|---|---|---|---|---|
| L1 정적 감사 | 소스 코드만 읽어 "버튼 → 핸들러 → API/DB" 지도를 만들고 기준선과 비교. 사라진 기능, 끊어진 버튼, 없는 페이지로 가는 링크, 빠진 301, 없는 번역 키를 찾는다 | `npm run qa:static` | 1분 | 해당 없음 (코드만 봄) |
| L2 API·라우팅 계약 | API 23개 응답 모양, 권한 차단(401), 미들웨어 리다이렉트, sitemap/robots, 리뉴얼 301 | `playwright --project=api` | 10초 | 예 (읽기·거절 경로만) |
| L3 브라우저 E2E | ① 핵심 흐름 계약 테스트(예약→결제 요청, 조회, 리뷰, 언어 전환…) ② **버튼 전수 클릭**: 화면의 모든 클릭 요소를 눌러 에러가 나거나 아무 일도 안 일어나는 버튼을 찾는다 | `npm run qa:e2e`, `npm run qa:e2e:sweep` | 5분 / 페이지당 10~15분 | 예 (쓰기·결제·외부 이동 자동 차단) |
| L4 수동 확인 | 돈·외부 시스템·실기기: 실결제→환불 1사이클, 바우처 메일, 크론·디스코드, 실제 폰 | 체크리스트 §6 | 1~2시간 | 일부 (실결제는 소액 1건) |

**배포 합격 기준(§7):** L1 차단 0 · L2/L3 실패 0 · 버튼 전수 클릭 "에러" 0, "무반응"은 모두 사유가 적힌 허용 목록에 있음 · L4 필수 항목 통과.

**이미 운영 사이트에 돌려본 결과(§10):** 자동 검사는 운영에서 그대로 돈다. 리뉴얼 전인 지금도 알려진 결함이 몇 개 있어 따로 적어 둔다(§9). 리뉴얼 회귀와 섞이지 않게 하려는 것.

---

## 1. 범위 — 왜 "고객 사이트만" 보면 안 되는가

PRD 는 리뉴얼 대상을 고객 사이트로 한정하지만, 코드는 한 저장소·한 번의 Vercel 배포로 나간다. 특히 아래 파일은 고객 사이트와 어드민이 **함께 쓴다**.

| 공유 지점 | 리뉴얼에서 건드릴 가능성 | 깨지면 어디가 |
|---|---|---|
| `src/app/(ko)/layout.tsx` — `/kr/**` 뿐 아니라 `/login`, `/dashboard/*`, `/agency-*`, `/checkin` 의 **루트 레이아웃** | PRD 부록 A: "헤더/푸터 삽입" 예정 | 어드민·에이전시·체크인 화면에 고객 헤더/푸터가 뜸 |
| `src/app/globals.css` | PRD: tokens.css import, `break-keep` 전역 | 어드민 알림 벨 애니메이션(`.animate-bell-shake`), 그리드 레이아웃 |
| `src/middleware.ts` (Next 16 에서 `proxy.ts` 로 이름 변경 권장) | 언어 감지·리다이렉트 추가 시 | 어드민 로그인 보호, 에이전시 세션, 모든 API 요청(미들웨어가 전부 거침) |
| `next.config.ts` | PRD: 301 리다이렉트 추가 | `images.remotePatterns` 가 `*.supabase.co` 뿐 → 새 이미지 호스트를 `next/image` 로 쓰면 깨짐 |
| `src/locales/{ko,en}.ts` | PRD: 하드코딩 문구 이관 | 바우처 이메일(`voucherEmail.*`)·바우처 페이지·내 예약 관리도 같은 파일 사용 |
| `/api/settings`, `/api/pickup`, `/api/availability` | 변경 없음(PRD §10) | 어드민 픽업시간 페이지도 `/api/pickup` 을 씀 |

→ 권장: 새 헤더/푸터는 `(ko)/layout.tsx` 가 아니라 `src/app/(ko)/kr/layout.tsx` (고객 전용 하위 레이아웃)에 넣는다. 자동 검사 `admin.spec.ts › 리뉴얼 안전장치` 가 이 누수를 잡는다.

### 규모 (정적 감사 기준, `qa/baseline/ui-inventory.json`)

| 화면 | 페이지 | 인터랙티브 요소 |
|---|---|---|
| 고객 사이트 | 12 (`/`, `/kr`, 예약 결과 3종×2, 내 예약 관리×2, 맛집×2) | 111 |
| 크루 체크인 | 1 (`/checkin`) | 9 |
| 어드민 | 22 (`/login` + `/dashboard/*` 21) | 383 |
| 여행사 포털 | 2 | 30 |
| API | 23 라우트 / 25 핸들러 (+ 크론 4개, `vercel.json`) | — |

(요소 수는 한 컴포넌트가 여러 화면에 쓰이면 화면마다 셉니다. 전체 고유 요소는 537개.)

---

## 2. 검사 로직

### 2.1 L1 정적 감사 — `scripts/qa/audit-ui.mjs`

TypeScript 컴파일러로 `src/` 전체를 읽는다. 앱을 띄우지 않으므로 환경변수·DB 없이 1.5초에 끝난다.

1. **라우트 수집** — `src/app/**/page.tsx` → URL, `route.ts` → API 경로와 export 된 메서드(GET/POST…), `next.config.ts` 의 redirects.
2. **페이지별 파일 그래프** — 각 페이지(+상위 layout)에서 import 를 따라가 그 페이지에 실제로 렌더되는 파일을 모은다. 리뉴얼로 컴포넌트를 쪼개거나 옮겨도 자동으로 따라간다.
3. **인터랙티브 요소 추출** — `<button>`, `<a>/<Link href>`, `<form onSubmit>`, `onClick` 등이 붙은 모든 JSX. 라벨은 텍스트·`aria-label`·`t("키")`(→ 한국어 문구로 치환)에서 뽑는다.
4. **핸들러 추적 = "이 버튼이 실제로 하는 일"** — 핸들러 함수를 따라 들어가(같은 파일의 함수, import 한 함수, `useCallback`, `form.handleSubmit(onSubmit)` 같은 인자 전달까지) 다음 효과를 모은다.
   - `fetch('/api/…')` 메서드·경로, Supabase `.from(표).insert/update/delete/select`, storage 업로드, 서버 액션 호출
   - 페이지 이동(`router.push`, `location.href`, `<Link>`), 새 창, `#앵커` 스크롤, 클립보드, 다운로드/내보내기, 쿠키, `confirm()`
   - **컴포넌트 경계 넘기**: `<CurrencySelectModal onSelectKRW={() => processPayment('KRW')}>` 처럼 부모가 넘긴 콜백을 자식 버튼에 연결한다. 그래서 "통화 모달의 '한화 결제' 버튼 → `POST /api/stripe/checkout` → Stripe 이동" 이 한 줄로 이어진다.
5. **검사** — 아래 중 `error` 는 배포 차단.

   | 코드 | 등급 | 의미 |
   |---|---|---|
   | `broken-link` | error | 존재하지 않는 페이지로 가는 링크/이동 |
   | `missing-api` / `missing-api-method` | error | 없는 API 경로 또는 그 경로에 없는 메서드 호출 |
   | `missing-locale-key` | error(두 언어 모두 없음) / warn(한쪽만) | `t("키")` 가 로케일 파일에 없음 → 화면에 키 문자열이 그대로 찍힘 |
   | `dead-button` | warn | onClick 도 없고 submit 도 아닌 `<button>` |
   | `missing-anchor` | warn | `href="#id"`/스크롤 대상 id 가 페이지에 없음 |
   | `no-accessible-name` | info | 아이콘만 있는 버튼 (스크린리더·E2E 선택자 문제) |

6. **기준선 비교(`--compare`)** — 파일·줄 번호가 아니라 **기능 단위**로 비교한다.

   | 코드 | 등급 | 잡는 것 |
   |---|---|---|
   | `feature-unwired` | error | 기준선에서 어떤 버튼이 하던 일(예: 고객 화면에서 `POST /api/reviews`)을 이제 **어떤 버튼도 안 함** — 기능은 코드에 남았는데 버튼과 끊긴 경우 |
   | `capability-removed` | error | 화면이 더 이상 부르지 않는 API/테이블 (로드 시 조회 포함) |
   | `route-removed` | error | 사라진 페이지인데 리다이렉트도 없음 |
   | `redirect-missing` / `redirect-wrong` | error | PRD 필수 301(맛집 QR) 누락·목적지 틀림 |
   | `api-removed` / `api-method-removed` | error | API 경로·메서드 삭제 |
   | `new-*` | error | 기준선엔 없던 새 정적 검사 error, 그리고 **새로 생긴** 죽은 버튼·빈 핸들러·없는 앵커·없는 번역 키 (기준선에 원래 있던 것은 제외) |
   | `text-unreferenced` | warn | 기준선에서 쓰던 번역 키가 더 이상 화면에서 안 쓰임 (PRD G2 "문구 유실 0") |
   | `label-missing` | warn | 같은 이름의 버튼이 사라짐 (이름만 바뀐 건지 확인) |

   의도한 변경은 `qa/renewal-expected-changes.json` 의 `accept` 에 **사유와 함께** 적으면 차단에서 빠진다. 이미 PRD 기준으로 채워 둠: 헤더 `#앵커` → 페이지 링크, 맛집 → 블로그, '투어'/'회사소개' 메뉴 제거.

   동작 확인(2026-09-25, 일부러 망가뜨린 뒤 되돌림):
   - 리뷰 폼 `onSubmit` 제거 + `/kr/restaurants` 삭제 → `feature-unwired POST /api/reviews`, `route-removed`, `redirect-missing`, `broken-link` 로 차단(exit 1).
   - '결제하기' 버튼 핸들러를 빈 함수로 → `new-empty-handler` 로 차단.

   **한계:** 정적 감사는 "모달이 열려야 보이는 버튼"의 도달 가능성(상태에 따른 표시)을 모델링하지 않는다. 예를 들어 '결제하기'가 통화 선택 모달을 더 이상 열지 않게 바뀌어도, 통화 모달 버튼 자체는 여전히 Stripe 결제에 연결돼 있으므로 `feature-unwired` 는 나지 않는다. 이런 흐름 단절은 L3 흐름 테스트(`booking.spec`)와 버튼 전수 클릭이 잡는다. 세 층을 같이 돌리는 이유다.

7. 같이 도는 것: `tsc --noEmit`, `scripts/qa/lint-diff.mjs`(ESLint error 가 파일별로 **늘었는지**만 봄 — 리뉴얼 전 이미 264개), 이메일 파서 회귀 스크립트 5종(`npm run qa:parsers`).

### 2.2 L2 API·라우팅 계약 — `e2e/api/*.spec.ts`

- **조회 API**: `/api/settings`(tourSettings 필수 컬럼), `/api/pickup`(DB 장애 시 코드 속 기본 목록으로 200 을 주는 상태도 감지), `/api/availability`(정상 200, 파라미터 누락·잘못된 옵션 400), `/api/reviews`, `/api/google-reviews`, `/api/exchange-rate`(900~3000).
- **고객 쓰기 API는 거절 경로만**: 없는 예약번호로 verify-booking/cancel/reschedule/reviews → 404, 빈 요청 → 400, Stripe 잘못된 통화 → 400(세션 안 만듦), 웹훅 서명 없음 → 400 (**500 이면 `STRIPE_WEBHOOK_SECRET` 누락**).
- **권한**: `/api/admin/{refund,approve-reschedule,pickup,invoice-prices}` POST → 401, `/api/agency/reservations` → 401, 크론은 `QA_CRON_SECRET` 이 있을 때만 401 확인(시크릿이 배포에 없으면 호출이 곧 실행이므로).
- **라우팅**: 로그인 없이 `/dashboard/*` → `/login`, `/dashboard` → `/dashboard/alerts`, 쿠키 없이 `/agency-dashboard` → `/agency-login`, 공개 페이지 200, robots/sitemap, **sitemap 의 모든 주소가 실제로 열림**.
- **리뉴얼 후(`QA_EXPECT_RENEWAL=1`)**: `/restaurants`·`/kr/restaurants` → 블로그 글로 301/308, 새 페이지(`/kr/reviews`, `/kr/faq`, `/kr/blog`, `/kr/booking` 및 EN) 200.

### 2.3 L3 브라우저 E2E

**안전망 `e2e/support/guard.ts`** — 모든 브라우저 테스트에 깔린다.

- POST/PUT/PATCH/DELETE 는 기본 **차단**(조회용 POST 인 verify-booking, 로그인 토큰만 통과). 차단된 요청은 "이 버튼이 실제로 저장하려 했다"는 **증거로 기록**된다.
- 서버 액션(에이전시·여행사 관리)도 페이지 로드 후에는 차단.
- Stripe·디스코드 웹훅·크론은 항상 차단. 외부 사이트로 이동하는 문서 요청은 막고 주소만 기록.
- `confirm()` 은 "취소", `prompt()` 는 닫기 → 삭제·환불 같은 파괴적 동작이 진행되지 않는다.
- 구글 광고·HubSpot·유튜브 로깅은 조용히 막는다(테스트 트래픽이 마케팅 통계에 섞이지 않게).
- 콘솔 에러, 처리 안 된 예외, 5xx, `_next`/API 404 를 모은다.
- `QA_ALLOW_MUTATIONS=1` 은 **운영 도메인에서 쓰면 즉시 에러**로 멈춘다.

**① 흐름 계약 테스트** — 선택자를 `src/locales` 문구로 잡는다(PRD 가 문구 100% 보존을 요구하므로 디자인이 바뀌어도 대부분 그대로 돈다). 리뉴얼로 구조가 바뀌는 곳은 `e2e/support/customer.ts` 의 ★ 함수(예약 화면 열기, 투어 선택, 결제 버튼)만 고치면 된다.

| 테스트 | 검증하는 계약 |
|---|---|
| `booking.spec` 예약 흐름 (ko/en) | 판매 중 투어 선택 → 성인 2 → 첫 예약 가능일 → 픽업 → 예약자 → 결제하기 → 통화 선택 → `POST /api/stripe/checkout` 본문이 `{selectedTour, adultCount:2, childCount:0, tourDate:YYYY-MM-DD, currency, lang, bookerName, bookerEmail, pickupLocationId|hotelName}` 이고 응답 url 로 이동. **결제 API 는 가로채서 가짜 응답** → 실제 Stripe 세션 없음 |
| 예약 검증 | 날짜 없이 결제 → 경고 표시, 결제 요청 안 나감 |
| 언어 전환 | `/kr` ↔ `/`, `NEXT_LOCALE` 쿠키 |
| 헤더 '내 예약 관리' | 두 언어 모두 올바른 경로 |
| 내 예약 관리 | 없는 예약 → verify-booking 404 → 알림, 상세 안 뜸. (테스트 예약이 있으면) 취소 모달 → 동의 → 최종 확정 버튼이 `/api/cancel` 을 부르는지(차단 상태로 확인) |
| 리뷰 작성 | 폼 → `POST /api/reviews` multipart(가짜 응답) → 오류 문구가 모달에 표시 |
| 맛집 QR | QR 보기 → QR 이미지 → 다운로드(또는 새 창) |
| 연락 채널 | 카카오 채널·인스타·유튜브·구글지도 링크가 사이트 어딘가에 존재 (리뉴얼로 푸터로 옮겨도 통과) |
| 페이지 스모크 | 모든 고객 라우트: 응답 <400, 예외·콘솔 에러·5xx 없음, **번역 키 노출 없음**, 375px 가로 스크롤 없음, 홈 canonical·hreflang |
| 어드민 | `/dashboard/*` 20개 페이지 로드(로그인으로 튕기지 않음, 리다이렉트 전용 `/dashboard/website-settings` 제외), 사이드바 15개 메뉴 → 정확한 경로, **고객 헤더/카카오 위젯이 어드민에 새지 않음**, (스테이징) 판매중지 토글 → 고객 `/api/settings` 반영 → 원복 |
| 여행사 포털 | 로그인 화면, (계정 있으면) 주간 가용 현황·예약 목록 API 200·새 예약 폼 |

**② 버튼 전수 클릭 `e2e/support/sweep.ts`** — "모든 버튼이 기능과 매치되는가"를 런타임에서 확인하는 핵심 로직.

1. 페이지를 열고, 화면에 보이는 클릭 가능 요소를 모두 찾는다. 네이티브 `button`/`a[href]` 뿐 아니라 **React 가 onClick 을 붙인 모든 요소**(`__reactProps$` 로 식별 — 투어 카드 div, 로고 div 등)까지. 마크업이 바뀌어도 선택자 수정이 필요 없다.
2. 요소마다 **페이지를 새로 열고** 그 하나만 누른다(앞 클릭의 영향 제거). 로드 중 5xx/예외가 있으면 한 번 다시 열고, 그래도 안 되면 "로드 실패"로 기록(버튼 탓으로 오판하지 않음).
3. 누른 뒤 일어난 일을 판정한다.

   | 판정 | 뜻 | 합격? |
   |---|---|---|
   | `navigate` | 다른 페이지로 이동 (이동한 문서가 4xx/5xx 면 `error`) | ✅ |
   | `popup` / `download` / `dialog` | 새 창·파일 다운로드·알림창 | ✅ |
   | `write-attempt` | 우리 서버/Supabase 에 저장 요청을 시도(차단됨) | ✅ 기능 연결 증거 |
   | `request` | 조회 요청 발생 | ✅ |
   | `scroll` / `ui` | 스크롤 / 화면 변화(모달 열림, 탭 전환…) | ✅ |
   | `none` | **아무 일도 없음 = 죽은 버튼** | ❌ (허용 목록 `qa/sweep-allowlist.json` 에 사유가 있으면 통과) |
   | `error` | 예외·5xx·깨진 링크 | ❌ |
   | `unclickable` / `skipped` | 다시 열었을 때 못 찾음(동적 콘텐츠) / 로그아웃·tel: 등 일부러 안 누름 | 참고 |

4. 깊이 2(기본): 클릭 **전후를 비교해 새로 나타난 요소**(예약 모달 안 투어 카드, 리뷰 모달 별점, 사진 확대 창의 닫기 등)까지 한 단계 더 들어가 같은 방식으로 누른다.
5. 오판을 줄이는 장치
   - `none` 이 나오면 새로 열어 한 번 더 누른다. 두 번 다 무반응일 때만 "죽은 버튼".
   - 요소 가운데를 누르면 자식의 핸들러가 가로채는 경우(모달 배경 가운데 = 모달 본문)가 있어, 그 요소 **자신의 핸들러가 받는 지점**을 찾아 누른다.
   - `e.stopPropagation()` 만 하는 핸들러(사진 확대 창의 사진처럼 "눌러도 안 닫히게" 하는 것)는 의도된 무반응으로 보고 `skipped`.
   - 이미지·폰트 같은 정적 리소스 5xx 는 버튼 탓으로 돌리지 않는다(페이지 스모크가 따로 잡음).
   - 30번 클릭마다 새 탭으로 갈아타고, 탭이 죽어도 새 탭으로 이어 간다. 결과는 요소마다 저장해 중간에 멈춰도 남는다.
6. 결과는 `qa/reports/sweep/<프로젝트>/<라우트>.md|json`. 리뉴얼 전 운영 결과를 보관해 두면, 리뉴얼 후 같은 라벨의 판정이 바뀐 것(예: `request` → `none`)을 바로 비교할 수 있다.

---

## 3. 실행 순서

### 3.1 지금 (리뉴얼 코드 착수 전) — 기준선 확정 ✅ 대부분 완료

| 할 일 | 상태 |
|---|---|
| 정적 기준선 `qa/baseline/ui-inventory.{json,md}`, ESLint 기준선 `qa/baseline/eslint.json` (커밋 `84a88b5` 기준) | ✅ 커밋됨 |
| 운영 사이트에 L2·L3 한 번 돌려 현재 상태 확인 | ✅ §10 |
| 운영 버튼 전수 클릭 결과 보관: `QA_BASE_URL=https://www.oceanstarhi.com npm run qa:e2e:sweep` → `qa/reports/sweep/` 를 `qa/baseline/sweep/` 로 복사해 커밋 | `/kr` 데스크탑·모바일 ✅ (`qa/baseline/sweep/`) · 나머지 라우트는 로컬에서 1회 실행 권장 |
| 스테이징 준비: 테스트 예약 1건(7일 이상 뒤 날짜), 테스트 여행사 계정, QA 어드민 계정, Stripe 테스트 키가 들어간 Vercel Preview 환경 | ☐ |

> 기준선은 **리뉴얼 전 코드**여야 한다. 리뉴얼 브랜치에서 `--save-baseline` 을 다시 돌리면 비교 대상이 사라진다.

### 3.2 리뉴얼 작업 중 — PR/커밋마다

```bash
npm run qa:static        # tsc + ESLint 증가 여부 + 정적 감사 비교 + 파서 회귀 (약 1분)
```

차단이 나오면 `qa/reports/renewal-diff.md` 를 본다. 의도한 변경이면 `qa/renewal-expected-changes.json` 에 사유와 함께 추가.

### 3.3 배포 직전 — Vercel Preview 에서

```bash
export QA_BASE_URL=https://<preview>.vercel.app
export QA_EXPECT_RENEWAL=1                      # 301·새 페이지·/booking 기대치 켜기
export QA_ADMIN_EMAIL=... QA_ADMIN_PASSWORD=...  # QA 전용 어드민
export QA_AGENCY_ID=... QA_AGENCY_PASSWORD=...   # 테스트 여행사
export QA_BOOKING_ORDER_ID=... QA_BOOKING_EMAIL=...  # 테스트 예약
export QA_CRON_SECRET=...                       # 배포 env 에 CRON_SECRET 이 있을 때만

npm run qa:static
npm run qa:e2e                                   # L2 + L3 흐름 (약 5분)
npm run qa:e2e:sweep                             # 고객 페이지 버튼 전수 클릭
QA_ADMIN_SWEEP=1 npx playwright test --project=admin --grep 전수   # 어드민 전수 클릭 (쓰기 차단)
QA_ALLOW_MUTATIONS=1 npx playwright test --project=admin -g 판매중지   # 스테이징 DB 일 때만
npm run qa:report                                # HTML 리포트
```

그다음 §6 수동 체크리스트.

### 3.4 배포 직후 — 운영에서 (쓰기 없음)

```bash
QA_BASE_URL=https://www.oceanstarhi.com QA_EXPECT_RENEWAL=1 npx playwright test --project=api --project=public-desktop --project=public-mobile --grep-invert 전수
```

+ Vercel 로그에서 `[MRT Cron]`·`[OTA Cron]`·`[capture-cron]` 이 배포 후 첫 주기에 200, Stripe 대시보드 웹훅 최근 전달 2xx, 실제 폰으로 `/kr` 예약 모달(또는 `/kr/booking`)·맛집 QR 1회.

**롤백 기준:** 결제 흐름(예약→Stripe 이동), 내 예약 관리 조회, 어드민 로그인·예약관리, 크론/웹훅 중 하나라도 실패하면 Vercel 에서 직전 배포로 즉시 Promote(롤백) 후 원인 조사.

---

## 4. 준비물

### 4.1 QA 환경 변수 (`.env.qa.local` 또는 CI 시크릿 — 커밋 금지)

| 변수 | 용도 | 없으면 |
|---|---|---|
| `QA_BASE_URL` | 검사 대상 URL | `http://localhost:3000` |
| `QA_EXPECT_RENEWAL=1` | 리뉴얼 후 기대치(301, 새 페이지, `/booking` 페이지 모드) | 리뉴얼 전 기준으로 검사 |
| `QA_ALLOW_MUTATIONS=1` | 차단하던 쓰기를 실제로 보냄 (스테이징 전용, 운영 URL 이면 에러로 중단) | 모든 쓰기 차단 |
| `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` | 어드민 로그인 ("아이디" 칸은 이메일 전체) | 어드민 테스트 건너뜀 |
| `QA_AGENCY_ID` / `QA_AGENCY_PASSWORD` | 여행사 포털 | 로그인 후 테스트 건너뜀 |
| `QA_BOOKING_ORDER_ID` / `QA_BOOKING_EMAIL` | 내 예약 관리 흐름용 테스트 예약 | 해당 테스트 건너뜀 |
| `QA_CRON_SECRET` | 크론 401 확인 (= 배포에 `CRON_SECRET` 이 있다는 확인) | 건너뜀 |
| `QA_SWEEP_LIMIT` / `QA_SWEEP_DEPTH` / `QA_SWEEP_ONLY` | 전수 클릭 페이지당 최대 클릭(120) / 깊이(2) / 특정 버튼만 재검사(정규식) | 기본값 |
| `QA_ROUTE_SAMPLES` | 동적 라우트 예시값 `{"/blog/[slug]":"hawaii-restaurants"}` | 동적 라우트 건너뜀 |
| `QA_START_SERVER=1` | 로컬에서 `build && start` 를 자동 실행 | 서버를 직접 띄움 |

처음 한 번: `npx playwright install chromium`.

### 4.2 배포 환경 변수 체크 (Vercel → Settings → Environment Variables)

`NEXT_PUBLIC_*` 는 **빌드 때** 박히므로 바꾸면 재배포해야 한다.

| 변수 | 없으면 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 미들웨어가 모든 요청에서 터짐 → 사이트 전체 500 |
| `SUPABASE_SERVICE_ROLE_KEY` | exchange-rate 외 모든 API 500, 에이전시 로그인 실패 |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | 결제·환불·캡처 500 / 웹훅 500 (예약이 결제 성공 페이지에만 의존, 환불 동기화 끊김) |
| `CRON_SECRET` | 크론 4개가 **누구나 호출 가능** (`docs/ota-email-auto-import-plan.md` 에 "Vercel 에 미설정"이라고 적혀 있음 — 확인 필요) |
| `IMAP_EMAIL`/`IMAP_PW`, `IMAP_EMAIL_OTA`/`IMAP_PW_OTA` | 메일 자동 등록 크론 500 |
| `DISCORD_WEBHOOK_URL`, `DISCORD_URGENT_ROLE_ID`, `DB_WEBHOOK_SECRET` | 알림이 조용히 안 감 / 디스코드 알림 엔드포인트 공개 |
| `NODEMAILER_EMAIL`, `NODEMAILER_PW` | 바우처 메일 실패(예약은 생성됨, 로그에만 남음) |
| `JWT_SECRET` | 여행사 로그인 실패 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | 예약·내 예약 관리 숙소 자동완성, OTA 크론 좌표 변환 |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_KAKAO_CHANNEL_ID`, `DEEPL_API_KEY` | 기본값/선택 |

그리고 `vercel.json` 크론 4개가 Vercel → Cron Jobs 에 등록돼 있는지, Supabase DB 웹훅(`reservations` → `/api/notifications/discord-urgent-reservation`)이 살아 있는지.

---

## 5. 기능 ↔ 버튼 ↔ 검사 매핑

버튼 하나하나의 전체 목록(파일:줄, 핸들러, 효과)은 자동 생성된 `qa/baseline/ui-inventory.md` 에 있다. 아래는 **기능 단위**로 묶은 체크리스트이고, 각 줄이 어느 검사로 확인되는지 적었다. (자=자동, 전=버튼 전수 클릭, 수=수동)

### 5.1 고객 사이트 (`/`, `/kr` 및 하위)

| ID | 기능 | 버튼/진입점 | 연결 (API·테이블) | 검사 |
|---|---|---|---|---|
| C-01 | 홈 로드·SEO | — | `/api/settings`, `/api/pickup`, `/api/reviews`, `/api/google-reviews`, storage `versions.json`; canonical·hreflang·JSON-LD | 자 `pages.spec`, `routing.spec` |
| C-02 | 헤더 메뉴 | Home·투어·고객후기·FAQ·회사소개 (현재 `#앵커` 스크롤) | — | 전 / 리뉴얼 후 페이지 링크 → 정적 `feature-added` 로 확인 |
| C-03 | 언어 전환 | EN / KR 버튼 | 쿠키 `NEXT_LOCALE`, `/` ↔ `/kr` (현재는 항상 홈으로 감 — PRD 는 같은 경로로 개선 예정) | 자 |
| C-04 | 내 예약 관리 진입 | 헤더 링크 | `/manage-booking`, `/kr/manage-booking` | 자 |
| C-05 | 예약 시작 | 헤더 '투어 예약하기'(640px 미만 숨김), 히어로 '바로 예약하기', 투어 카드 '예약하기', 하단 플로팅 '예약하기', 투어 상세 모달 '예약하기' | 예약 모달 (리뉴얼 후 `/booking`) | 전 + 자 `booking.spec` |
| C-06 | 투어 카드 | 카드·이미지 슬라이드·'자세히 보기' | `tour_settings`(판매중·가격·정원), `versions.json` 사진 | 전 + 수(§6.3 어드민 반영) |
| C-07 | 예약 1~4단계 | 투어 선택 → (콤보 옵션·시간) → 인원 → 날짜 → 숙소/픽업 → 예약자 → 결제하기 | `/api/availability`(월·투어 바뀔 때), 차단 요일·차단일, Google Places | 자 `booking.spec` |
| C-08 | 결제 통화 선택 | 한화 결제(KRW) / 달러 결제(USD) / 취소 | `POST /api/stripe/checkout` → Stripe 이동 (수동 캡처 방식) | 자(요청 계약) + 수 §6.1 실결제 |
| C-09 | 결제 후 처리 | Stripe → `/…/booking/payment-success?session_id=` | `POST /api/stripe/verify-session` → `reservations` 생성 → 바우처 메일 2통(ko·en) → `/…/booking/success?order_id=` | 수 §6.1 (+ 웹훅 백업) |
| C-10 | 결제 취소 | Stripe 취소 → payment-cancel | '다시 예약하기', '홈으로' | 자 `pages.spec` |
| C-11 | 바우처 페이지 | '바우처 저장'(PNG), '홈으로' | `GET /api/reservation-detail` | 수 §6.1 |
| C-12 | 리뷰 보기 | 이전/다음 화살표, 더보기/접기, 사진 → 라이트박스 | `/api/reviews` (EN 은 `content_en`) | 전 |
| C-13 | 리뷰 작성 | '리뷰 작성하기' → 예약번호·이름·별점·내용·사진 5장 → '리뷰 등록하기' | `POST /api/reviews` (예약 상태 검사, storage `review-images`, DeepL) | 자(가짜 응답) + 자 API 거절 경로 + 수(스테이징 1건) |
| C-14 | 구글 리뷰 | 좌우 화살표, '구글에서 전체 리뷰 보기' | `/api/google-reviews` | 자 + 전 |
| C-15 | 유튜브 영상 | iframe | — | 자 `pages.spec` |
| C-16 | 픽업 노선도 | 아코디언 헤더, 정류장 '구글 지도 열기' | `/api/pickup` | 전 |
| C-17 | FAQ | 카테고리 탭 7개, 질문 아코디언 (KO 30 / EN 28문항) | — | 전 |
| C-18 | 푸터 | 인스타그램, 유튜브, 맛집, 구글 지도 | — | 자 연락 채널 |
| C-19 | 플로팅·외부 스크립트 | 카카오톡 1:1 상담, 인스타 DM (KO 레이아웃만), HubSpot 채팅, 구글 광고 | — | 자 + 수 |
| C-20 | 예약 조회 | 예약번호 + 이메일 → '예약 조회하기' | `POST /api/verify-booking` | 자 |
| C-21 | 일정·픽업 변경 | '투어일정 / 픽업장소 변경하기'(7일 이상 남았을 때만) → 달력·숙소·픽업 → '변경 완료' | `/api/availability`, `POST /api/reschedule` → 어드민 '변경 요청' 큐 | 수(테스트 예약) + 전 |
| C-22 | 예약 취소 | '예약 취소 진행' → 규정 동의 → '취소하기' → '최종 취소 확정' | `POST /api/cancel` (환불 예정액 100/50/0%) → 어드민 '취소 요청' 큐 | 자(연결 확인, 차단) + 수 |
| C-23 | 맛집 | 메인으로, QR 보기 → QR 다운로드, 카톡 바로가기 | api.qrserver.com (QR 은 `https://oceanstarhi.com/restaurants` 를 가리킴 → **301 필수**) | 자 + 리뉴얼 후 `routing.spec` 301 |
| C-24 | 크루 체크인 `/checkin` | PIN → 로그인 → 1/2/3부 체크인 → 확인 | Supabase `crew_members`/`captains` → `crew_attendance`/`captain_attendance` | 자 로드 + 수(스테이징 PIN) |
| C-25 | 404 | 없는 주소 | `not-found.tsx` (en/ko) | 수 |

### 5.2 어드민 (`/login`, `/dashboard/*`)

| ID | 기능 | 주요 버튼 | 연결 | 검사 |
|---|---|---|---|---|
| A-01 | 로그인/로그아웃 | 로그인, 이 기기 기억하기, 로그아웃 | Supabase Auth, 미들웨어 | 자 `auth.setup`, `routing.spec` |
| A-02 | 사이드바 | 15개 메뉴 + 3개 그룹, 접기/펼치기 | 저장 안 한 변경 확인 모달 | 자 |
| A-03 | 알림 벨 | 벨, 알림 센터로 이동, 알림음/진동/데스크탑 알림, 테스트 알림 | realtime `admin_reservation_realtime`, `agency_notifications` | 수 (새 예약 1건 넣고 토스트 확인) |
| A-04 | 알림 센터 | 전체 확인, 확인 완료, 변경 승인 → 승인 완료, 취소 처리 → 결제 취소/환불 실행/처리 완료 | `reservations.update`, `POST /api/admin/approve-reschedule`, `POST /api/admin/refund` | 전(차단) + 수 §6.2 |
| A-05 | 예약관리 그리드 | 검색, 명단복사, 행 추가(+10~200), 실행 취소/다시 실행, 저장, 선택 후 예약확정/예약대기/취소처리/환불하기/일괄삭제/▲▼, 탭 4개(입력·안내필요·취소요청·변경요청), 셀 편집 **(500ms 자동저장)** | `reservations` insert/upsert/delete | 전(차단) + 수 |
| A-06 | 명단보기·오늘·리컨펌 | 오늘명단/내일명단, 새 예약 등록, 탭, 정렬, 한눈에 보기, ⚙ 수정/삭제, 리컨펌 체크 | `reservations` | 전 + 수 |
| A-07 | 차량용 명단 | 날짜·옵션, 기사 추가/삭제, 차량별 기사 선택, **드래그 배차**, 복사, 이미지 저장, 기사/전체 공유 | `drivers`, `daily_vehicle_status`, `reservations.vehicle_id` | 전 + 수(드래그는 수동) |
| A-08 | 캘린더 | 월 이동, 연·월 선택, 날짜 두 번 클릭 → `/dashboard/today?date=` | `reservations`, `tour_settings` | 전 |
| A-09 | 취소 및 환불 | 필터 3종, 검색, 선택 건 환불 → 비율·사유 → 환불 | `POST /api/admin/refund` (Stripe) | 수 §6.1 (Stripe 테스트) |
| A-10 | 크루 스케쥴·출석 | 크루/선장 추가·삭제·순서, 스케줄 셀, 메모 저장, 이미지 저장, QR 보기/저장, PIN | `crew_*`, `captains`, `shift_captains` | 전 + 수 |
| A-11 | Overview | 집계 기준, 유입 경로, 기간, 범례 토글, PPT 다운로드 | `reservations` 1000건씩 | 전(다운로드 감지) |
| A-12 | 정산 검토 | 플랫폼 탭, 엑셀 업로드 → 매칭, 정산 확정/제외, 기준가 관리 | `reservations.settlement_status`, `product_prices` | 수(샘플 엑셀) |
| A-13 | 인보이스 | 예약 조회, 엑셀 다운로드, 단가 저장(**전체 교체**) | `invoice_prices`, `/api/admin/invoice-prices` | 수 |
| A-14 | 가격 및 날짜 관리 | 판매중 토글(즉시 저장), 가격·정원·시간·휴무요일, 전체 설정 저장, 차단일 추가/해제, 새 상품 | `tour_settings`, `blocked_dates` → **고객 사이트** | 자(스테이징 토글) + 수 §6.3 |
| A-15 | 픽업시간 관리 | 시/분 선택, 변경사항 저장 | `POST /api/admin/pickup` → **고객 사이트** | 수 §6.3 |
| A-16 | 사진 및 배너 관리 | 사진 추가(압축 업로드), 삭제(확인 없음), 드래그 순서 | storage `website-assets` + `versions.json` → **고객 투어 카드** | 수 §6.3 |
| A-17 | 여행사 관리 | 새 여행사 등록, 주소 복사, 새 창으로 열기, 수정, 삭제 | 서버 액션 `createAgency` 등 | 전(차단) + 수 |
| A-18 | 숨은 페이지 | `/dashboard/home`, `/reconfirm`, `/bulk-add`, `/stats`, `/today` | — | 자 로드 |

### 5.3 여행사 포털 (`/agency-login`, `/agency-dashboard`)

| ID | 기능 | 주요 버튼 | 연결 | 검사 |
|---|---|---|---|---|
| G-01 | 로그인/로그아웃 | 로그인 하기, 로그아웃 | 서버 액션 `loginAgency`, 쿠키 `agency_session` | 자 |
| G-02 | 주간 가용 현황 | ◀ ▶ 주 이동 | `getAgencyAvailabilityWeekly` | 자 + 전 |
| G-03 | 목록 | 검색, 날짜, 정렬/필터, 초기화 | `GET /api/agency/reservations` | 자 + 전 |
| G-04 | 예약 등록·수정·취소 | 새 예약 등록 → 저장 완료(마감 점검), 수정, 취소 | 서버 액션 → `reservations`, `agency_notifications` → 어드민 벨 | 전(차단) + 수(테스트 여행사, 먼 날짜) |

### 5.4 서버 (API·크론·웹훅)

| ID | 기능 | 검사 |
|---|---|---|
| S-01 | 공개 조회 API 6종 | 자 `contract.spec` |
| S-02 | 고객 쓰기 API 4종 (verify-booking, cancel, reschedule, reviews) | 자 거절 경로 + 수 |
| S-03 | Stripe checkout / verify-session / webhook | 자 거절 경로 + 수 §6.1 |
| S-04 | 어드민 API 4종, 에이전시 API | 자 401 |
| S-05 | 크론 4종 (환율 월 00:00 UTC, MRT 메일 5분, OTA 메일 5분, 결제 캡처 06:00 UTC) | 수 §6.4 + 자(시크릿 있을 때 401) |
| S-06 | DB 웹훅 → 디스코드 긴급 알림 | 수 §6.4 |
| S-07 | 미들웨어 보호 규칙 | 자 `routing.spec` |
| S-08 | 바우처 이메일 | 수 `npx tsx scripts/test_email.ts` (보내는 계정 자기 자신에게) |
| S-09 | OTA/마이리얼트립 메일 파서 | 자 `npm run qa:parsers` |

---

## 6. 수동 체크리스트 (자동으로 못 보는 것)

### 6.1 돈이 걸린 흐름 — Preview + Stripe **테스트 키**

- [ ] 예약(모달 또는 `/kr/booking`) → KRW 카드 4242 결제 → payment-success → 바우처 페이지에 예약번호·픽업 정보
- [ ] Supabase `reservations`: 새 행, `status=예약확정`, `payment_intent_id` 있음, `captured_at` 비어 있음
- [ ] 바우처 메일 2통(ko·en), PDF 첨부
- [ ] 같은 success URL 새로고침 → 행이 늘지 않음
- [ ] USD 로 한 번 더
- [ ] 콤보 상품 1건 (§9 결함 D-02 확인용)
- [ ] 어드민 '취소 및 환불' → 선택 건 환불 → 전액 → `mode: canceled`, 상태 취소
- [ ] 운영 배포 후 **실제 소액 결제 → 환불 1사이클** (PRD §11 P7 필수)

### 6.2 고객 요청 → 어드민 큐

- [ ] 고객 '변경 완료' → 어드민 알림 센터 '변경 요청'에 뜸 → 승인 완료 → 예약일 변경
- [ ] 고객 '최종 취소 확정' → '취소 요청'에 뜸, 환불 예정액이 규정(7일↑ 100%, 3일↑ 50%)대로
- [ ] 여행사 새 예약 → 어드민 벨 알림

### 6.3 어드민 설정 → 고객 사이트 반영 (스테이징)

| 어드민에서 | 고객 사이트에서 확인 |
|---|---|
| 판매중지 | 투어 카드·예약 1단계에서 사라짐, 결제 시 "판매가 중지된 옵션" |
| 가격(USD/KRW) → 전체 설정 저장 | KO 카드 ₩, EN 카드 $, 결제 금액 |
| 정원 | 그 인원을 넘는 날짜가 달력에서 비활성 |
| 정기 휴무 요일 / 차단일 | 그 요일·날짜가 달력에서 비활성 (전체 차단 `all` 포함) |
| 시작·종료 시간 | 카드 시간 표기, 선셋(3부) 픽업 시간 |
| 픽업 1부/2부 시간 | 예약 모달 픽업 목록, 픽업 노선도, 내 예약 관리, 바우처 |
| 투어 사진 추가/삭제/순서 | 투어 카드 슬라이드 (1부·2부 합친 카드는 1부 사진만 씀) |
| 여행사 추가/비밀번호 변경/삭제 | 새 계정 로그인, 옛 비밀번호 실패, 삭제 계정 로그인 불가 |
| 크루 PIN | `/checkin` 로그인 |

### 6.4 외부 시스템

- [ ] Vercel → Cron Jobs: 4개 등록, 배포 후 첫 실행 200
- [ ] Stripe 대시보드 → 웹훅: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `refund.failed` 구독, 최근 전달 2xx
- [ ] 디스코드: 내일 날짜 테스트 예약 확정 → 긴급 알림 1회
- [ ] 메일 크론: `node scripts/check_unprocessed.ts` 로 미처리 메일 0

### 6.5 실제 기기·브라우저

- [ ] iPhone Safari / Android Chrome: 예약 흐름, 하단 CTA 와 카카오 위젯 겹침, 가로 스크롤 없음
- [ ] 차량용 명단 '기사님 명단 공유' (모바일에서만 공유 시트)
- [ ] 어드민 데스크탑 알림(서비스워커)

---

## 7. 배포 합격 기준

| 구분 | 기준 |
|---|---|
| 차단 | `npm run qa:static` 실패 (새 tsc 에러, 파일별 ESLint error 증가, 정적 감사 차단, 파서 회귀 실패) |
| 차단 | L2/L3 테스트 실패 (알려진 결함 `test.fail()` 은 리스트에 ✘ 로 보이지만 "passed" 로 집계됨 — 정상) |
| 차단 | 버튼 전수 클릭 `error` 1건 이상, 허용 목록에 없는 `none` 1건 이상 |
| 차단 | §6.1 결제·환불, §6.2 큐 연결, §6.4 크론·웹훅 중 실패 |
| 경고(판단) | `text-unreferenced`(문구 유실 가능), `label-missing`, `unclickable` 증가, 접근성 info |
| 배포 후 | 운영 스모크 실패 또는 크론/웹훅 첫 주기 실패 → 즉시 롤백 |

---

## 8. 리뉴얼 PRD 기준 특별 주의 항목

| # | PRD 변경 | 깨질 수 있는 기존 기능 | 막는 검사 |
|---|---|---|---|
| R1 | 헤더/푸터를 `(ko)/layout.tsx` 에 삽입 | 어드민·에이전시·체크인에 고객 헤더 노출 | `admin.spec` 누수 테스트, 어드민 전수 클릭 |
| R2 | 예약 모달 → `/booking` 페이지 (P4) | 결제 요청 본문·통화 선택·Stripe return URL(`/kr/booking/payment-success`) | `booking.spec` 계약, 정적 `feature-unwired fetch POST /api/stripe/checkout`, §6.1 |
| R3 | 맛집 → 블로그 + 301 | 현장 QR(`https://oceanstarhi.com/restaurants`) | `requiredRedirects`, `routing.spec` |
| R4 | `#앵커` 메뉴 → 페이지 링크 | 스크롤 대상 id 제거로 남은 앵커 링크가 죽음 | 정적 `missing-anchor`, 전수 클릭 `none` |
| R5 | 리뷰·FAQ 분리 | 리뷰 작성 모달·사진 라이트박스·구글 리뷰·픽업 노선도(`/api/pickup`)가 새 위치에서 연결 유지 | `feature-unwired`, `customer-features`, 전수 클릭 |
| R6 | 언어 전환이 "같은 경로"로 | 쿠키 `NEXT_LOCALE`, EN/KR 쌍 페이지 존재 | `customer-features` 언어 전환 (리뉴얼 후 기대 경로로 수정) |
| R7 | 하드코딩 문구 → 로케일 이관 | 바우처 메일·바우처 페이지·내 예약 관리가 같은 로케일 파일 사용 | `missing-locale-key`, `text-unreferenced`, 번역 키 노출 검사 |
| R8 | `globals.css`·토큰 | 어드민 벨 애니메이션, 그리드 | 어드민 페이지 로드 + 수동 눈 확인 |
| R9 | `next/image` 로 교체 | `images.remotePatterns` 가 Supabase 만 허용 | 페이지 스모크 콘솔 에러 |
| R10 | sitemap 동적화 | sitemap 의 모든 주소 200 | `routing.spec` |
| R11 | 미들웨어 → `proxy.ts` 이름 변경(Next 16 권장) | matcher·보호 규칙 | `routing.spec` |
| R12 | 카카오 위젯·HubSpot·gtag "그대로" | KO 전용 위젯, 전환 추적 | 연락 채널 테스트 + 수동 |

---

## 9. 리뉴얼 전부터 있던 결함 (회귀와 구분하기 위해)

코드 검토 중 발견. 리뉴얼과 무관하지만, 검사 중 드러나면 "리뉴얼이 깨뜨렸다"로 오해할 수 있어 적어 둔다. **✔ = 코드(또는 운영)에서 직접 확인**, 나머지는 검토 보고로 재현 확인 필요.

| # | 심각도 | 내용 | 위치 |
|---|---|---|---|
| D-01 ✔ | 높음(개인정보) | 예약 조회·취소·일정변경이 이메일/이름을 `ilike` 로 비교하고 `%` 를 거르지 않음 → 예약번호만 알면 이메일 칸에 `%` 로 전체 예약 행 조회·취소 요청 가능. 리뷰 API 가 예약번호를 공개 반환 | `api/verify-booking`, `api/cancel`, `api/reschedule`, `api/reviews` |
| D-02 ✔ | 높음(돈) | 콤보 예약은 같은 `order_id` 로 2행 저장, 이후 `.single()` 조회가 실패 → 결제 성공 페이지/웹훅이 다시 부르면 **중복 저장·바우처 재발송**, 바우처 페이지·내 예약 관리·리뷰에서 "없는 예약" | `lib/stripeBooking.ts` 외 |
| D-03 ✔ | 높음(돈) | 어드민 취소 처리 모달: 환불 예정액이 0(3일 이내 취소)이면 **전액 환불**로 처리됨 | `CancellationRequestsView.tsx` → `/api/admin/refund` |
| D-04 ✔ | 높음(곧 발생) | 어드민 그리드·일괄추가의 날짜 약식 입력("1/5")이 연도를 **2026 고정** → 2027년 1월부터 잘못된 날짜 저장 | `lib/smartParser.ts` |
| D-05 ✔ | 높음(보안) | 어드민 API 권한이 "로그인한 Supabase 사용자면 누구나"(역할 확인 없음) — Supabase 가입이 열려 있으면 위험 | `lib/adminAuth.ts` |
| D-06 ✔ | 높음(보안) | 크론 인증이 `CRON_SECRET` 이 있을 때만 → 없으면 누구나 결제 캡처·환율 덮어쓰기 실행 | `api/cron/*` |
| D-07 ✔ | 중간 | `GET /api/admin/invoice-prices` 로그인 없이 공개 (운영에서 200 확인) — `contract.spec` 에 `test.fail()` 로 등록 | `api/admin/invoice-prices` |
| D-08 ✔ | 낮음 | 내 예약 관리 '💬 일정 변경은 카카오톡 채널로 문의해주세요' 버튼에 동작 없음(7일 이내 예약에서 보임) | `ManageBookingClient.tsx:393` |
| D-09 | 높음 | 결제 성공 URL 재방문·웹훅 재전송 시 `취소요청`/`변경요청` 이 `예약확정`으로 되돌아감 | `lib/stripeBooking.ts` |
| D-10 | 높음 | 예약관리 그리드가 행 전체를 upsert → 페이지를 연 뒤 고객이 넣은 취소요청 등을 편집 한 번에 덮어씀 | `dashboard/all` |
| D-11 | 높음 | 여행사 '수정'이 인원을 항상 2명으로 되돌리고 메모 앞에 `(성N)` 을 중복 추가 | `agency-dashboard` |
| D-12 | 중간 | 결제 API 가 정원·차단일·과거 날짜를 서버에서 다시 검사하지 않음 | `api/stripe/checkout` |
| D-13 | 중간 | 선셋(3부) 픽업 시간이 `/api/pickup` 에서는 계산값, 바우처에서는 DB 값 → 서로 다를 수 있음 | `api/pickup`, 바우처 |
| D-14 | 중간 | 내 예약 관리: 셀프 변경 허용 기준이 화면 7일 / 서버 3일로 다름, 변경 후 화면 정보가 갱신 안 됨 | `ManageBookingClient`, `api/reschedule` |
| D-15 | 낮음 | 결제 성공 페이지에 쿼리 없이 들어오면 무한 로딩 | `booking/payment-success` |
| D-16 | 낮음 | `/public/notification.mp3` 없음(어드민 알림음 404 → 비프음 대체), `/dashboard/bulk-add` 에 DEBUG 배너 노출 | — |

전체 목록(수십 건, 파일:줄 포함)은 이 문서 작성 시의 코드 검토 보고서에 있었다. 필요하면 항목별로 이슈를 만든다.

---

## 10. 운영 사이트에서 돌려본 결과 (2026-09-25, 리뉴얼 전, 쓰기 없음)

| 검사 | 결과 |
|---|---|
| `npm run qa:static` | 통과 (tsc 0, ESLint 264=기준선, 정적 감사 차단 0 / warn 2, 파서 5종 통과) |
| 정적 감사 warn 2 | ① 내 예약 관리 카카오 버튼 핸들러 없음(D-08) ② `tour.features.pickup_service` 가 ko.ts 에 없음 — EN 에서만 렌더되어 현재 화면 영향 없음 (리뉴얼에서 KO 로도 쓰면 키 문자열이 노출됨) |
| API·라우팅 (`--project=api`) | 21 통과, 4 건너뜀(크론·리뉴얼 전용), 알려진 결함 D-07 확인 |
| 고객 페이지 스모크 (데스크탑·모바일 24개) | 첫 실행 23/24 — `/restaurants`(모바일)에서 5xx 1회, 이후 재실행 3회 모두 통과. 이 검사를 돌린 환경의 프록시가 운영 사이트 요청에 간헐적으로 502 를 돌려준 것이 확인돼 그 영향으로 본다 |
| 고객 흐름 (예약 계약 ko/en, 검증, 언어 전환, 내 예약 관리, 리뷰, 맛집 QR, 연락 채널) | 데스크탑 12 통과·1 건너뜀(테스트 예약 필요), 모바일 9 통과·4 건너뜀(모바일은 KO 만·맛집 QR 버튼은 모바일에서 이름 없음) |
| 버튼 전수 클릭 `/kr` 데스크탑·모바일 | 216개 요소 중 죽은 버튼 0, 버튼 탓 에러 0 (부록 B) |
| 어드민·여행사 로그인 후 | 계정이 없어 미실행 — §3.3 에서 실행 |

---

## 11. 파일 구조와 명령어

```
docs/qa/regression-test-plan.md        이 문서
qa/baseline/ui-inventory.md            버튼 전수 목록 (자동 생성, 리뉴얼 전 기준선)
qa/baseline/ui-inventory.json          위의 기계용 원본 — --compare 기준
qa/baseline/eslint.json                ESLint 파일별 error 수 기준선
qa/renewal-expected-changes.json       의도된 변경(승인)·필수 리다이렉트
qa/sweep-allowlist.json                전수 클릭 "무반응" 허용 목록 (사유 필수)
qa/reports/                            실행 결과 (git 제외)
scripts/qa/audit-ui.mjs                L1 정적 감사
scripts/qa/lint-diff.mjs               ESLint 기준선 비교
playwright.config.ts                   프로젝트: public-desktop(1440) · public-mobile(375) · api · admin-setup · admin · agency
e2e/support/guard.ts                   쓰기 차단·기록 안전망
e2e/support/sweep.ts                   버튼 전수 클릭 엔진
e2e/support/customer.ts                고객 화면 조작 (리뉴얼 후 ★ 함수만 수정)
e2e/support/routes.ts                  검사 라우트 = 인벤토리에서 자동 (새 페이지 자동 포함)
e2e/api/contract.spec.ts, routing.spec.ts
e2e/public/pages.spec.ts, booking.spec.ts, customer-features.spec.ts, sweep.spec.ts
e2e/admin/auth.setup.ts, admin.spec.ts
e2e/agency/agency.spec.ts
```

| 명령 | 하는 일 |
|---|---|
| `npm run qa:audit` | 정적 감사 → `qa/reports/ui-inventory.md` |
| `npm run qa:audit:compare` | 기준선 비교 → `qa/reports/renewal-diff.md`, 차단 시 exit 1 |
| `npm run qa:static` | tsc + ESLint 비교 + 정적 비교 + 파서 회귀 |
| `npm run qa:e2e` | API·라우팅·페이지·흐름·어드민·에이전시 (전수 클릭 제외) |
| `npm run qa:e2e:sweep` | 버튼 전수 클릭 |
| `npm run qa:report` | Playwright HTML 리포트 |
| `node scripts/qa/audit-ui.mjs --save-baseline` | 기준선 재저장 — **리뉴얼 배포가 끝난 뒤** 다음 기준선으로 삼을 때만 |

### 부록 A. 리뉴얼 후 테스트 수정이 필요한 곳

1. `e2e/support/customer.ts` ★ 함수 — 예약 화면 열기(`/booking`), 투어 선택, 결제 버튼 위치.
2. `customer-features.spec.ts` 언어 전환 — PRD 대로 "같은 경로"로 바뀌면 기대 URL 수정.
3. `qa/sweep-allowlist.json` — 새 디자인의 장식용 클릭 요소.
4. `qa/renewal-expected-changes.json` — PRD 밖의 의도된 변경이 생기면 사유와 함께.

### 부록 B. `/kr` 버튼 전수 클릭 기준 결과 (운영, 2026-09-25)

전체 표: `qa/baseline/sweep/public-desktop/kr.md`, `qa/baseline/sweep/public-mobile/kr.md`

| 판정 | 데스크탑 1440 | 모바일 375 |
|---|---|---|
| 검사한 요소 (모달 안쪽 포함) | 112 | 104 |
| `ui` 화면 변화 (모달·탭·아코디언) | 50 | 44 |
| `scroll` (메뉴 앵커, 리뷰·구글리뷰 화살표) | 27 | 40 |
| `popup` 새 창 (인스타·유튜브·카카오·구글지도) | 16 | 5 |
| `request` 조회 (투어 선택 → `/api/availability` 등) | 13 | 8 |
| `navigate` (EN, 내 예약 관리, 맛집) | 3 | 3 |
| `unclickable` (다른 요소에 가려짐·다시 열 때 목록이 바뀜) | 2 | 3 |
| `none` 무반응 | 1 → 사진 확대 창의 사진(`e.stopPropagation()` 전용, 의도됨). 엔진 보완 후 `skipped` 로 분류되는 것 확인 | 0 |
| `error` | 0 | 1 → 이 검사를 돌린 환경의 프록시가 `/api/pickup` 에 502 를 돌려준 1회 (같은 API 계약 테스트는 통과) |

- 내 예약 관리의 카카오 문의 버튼(D-08)은 7일 이내 예약을 조회해야 나타나므로 이 전수 클릭에는 잡히지 않고, 정적 감사가 잡는다. 두 층을 같이 쓰는 이유.
- 모달 안쪽의 결제하기 → 통화 선택 → Stripe 는 폼 입력이 필요해 전수 클릭으로는 끝까지 가지 않는다. `booking.spec` 이 담당.
