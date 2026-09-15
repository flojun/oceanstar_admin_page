# 오션스타 고객 웹사이트 리뉴얼 PRD

- 문서 버전: v1.0
- 작성일: 2026-08-31
- 대상: `oceanstar_admin_page` 리포지토리의 **고객용 웹사이트**(어드민 대시보드 제외)
- 상태: 리뷰 대기 (§12 결정 필요 항목 확정 후 착수)

---

## 0. 한 줄 요약

현재 KO(`/kr`)·EN(`/`) 각각 **1,884줄짜리 단일 페이지 앵커 스크롤** 구조인 고객 사이트를,
**기존 문구를 100% 보존한 채** `Home / 고객후기 / FAQ / 블로그` 4개 메뉴 기반 **멀티페이지**로 재구축한다.
동시에 모든 사이즈 값(폰트·여백·컨테이너·컴포넌트 높이)을 **CSS 변수 1개 파일로 중앙 집중**시켜,
데스크탑/모바일 수치를 문서와 코드 양쪽에서 직접 고칠 수 있게 만든다.

---

## 1. 현황 진단

| 항목 | 현재 상태 |
|---|---|
| 라우트 | `/`(EN), `/kr`(KO) — 전 섹션이 앵커 스크롤 (`#home #tours #reviews #faq #about`) |
| 핵심 파일 | `src/components/landing/ReservationClientPage.tsx` **1,884줄** (헤더·히어로·벤토·투어카드·리뷰·푸터·예약모달·리뷰작성모달 전부 한 파일) |
| 문구 저장소 | `src/locales/ko.ts`(266줄), `src/locales/en.ts`(267줄) — `getTranslation(lang)` 로 접근 |
| 문구 하드코딩 | FAQ 30문항(`FAQSection.tsx`), 투어 코스 7단계(`TourCourseTimeline.tsx`), 맛집 페이지 전체(`restaurants/page.tsx`) |
| 부가 페이지 | `/kr/restaurants`(맛집), `/kr/manage-booking`, `/kr/booking/success` 등 |
| 스택 | Next.js 16 App Router · React 19 · Tailwind v4 · Supabase · Stripe · framer-motion |
| 폰트 | KO: Pretendard(본문)/SUIT(제목), EN: Inter/Poppins (`globals.css`) |
| 현재 톤앤매너 | 글래스모피즘 (`backdrop-blur-[40px]`, `bg-white/40`, `rounded-[2rem]`, sky/blue 팔레트) |

### 문제점

1. **페이지별 SEO 불가.** FAQ·후기가 개별 URL을 못 가져 검색 유입이 홈 1개 URL에 묶여 있다.
2. **유지보수 리스크.** 1,884줄 단일 클라이언트 컴포넌트라 한 줄 수정이 전체 페이지에 영향.
3. **블로그 부재.** 하와이 여행 검색 키워드를 잡을 콘텐츠 채널이 없다.
4. **사이즈 수정 비용.** `text-3xl md:text-5xl` 같은 값이 수십 군데 흩어져 있어 "제목 2px 키우기"가 전수 수정 작업이 된다.
5. **EN 콘텐츠 누락.** FAQ가 KO 30문항 / EN 28문항 (EN에 "음식·음료 제공" · "예약 변경 가능 여부" 2문항 없음).

---

## 2. 목표 / 비목표

### 목표

| ID | 목표 | 완료 기준 |
|---|---|---|
| G1 | 멀티페이지 전환 | 메뉴 4개가 각각 독립 URL·독립 `metadata` 보유 |
| G2 | **기존 문구 100% 보존** | §4 인벤토리 전 항목 체크 완료, 유실 0 |
| G3 | KO/EN 완전 동일 구조 | 동일 라우트 트리 + `hreflang` 상호 링크, FAQ 문항 수 동일(30/30) |
| G4 | 모바일 최적 반응형 | §7 사이즈 스펙 준수, 375px에서 가로 스크롤 0 |
| G5 | 사이즈 중앙 집중 | `src/styles/tokens.css` 1개 파일 수정으로 전 페이지 사이즈 변경 가능 |
| G6 | 블로그 신설 | 목록/상세 페이지 + 어드민에서 글 작성 가능 |
| G7 | 디자인 시안 4종 뷰 | Claude Design 캔버스에 **한국어/영어 × 데스크탑/모바일** 아트보드 완비 (§13) |

### 비목표 (이번 범위 아님)

- 예약·결제 로직 변경 (Stripe 결제, 환율, 환불 규정, 매뉴얼 캡처 — **손대지 않음**)
- 어드민 대시보드(`/dashboard/*`) UI 변경
- 가격·투어 상품 정책 변경
- 신규 언어(일본어/중국어) 추가
- 리뷰 작성/조회 API 스펙 변경

---

## 3. 정보구조 (IA)

### 3.1 헤더 (요청안 그대로)

```
[로고]        Home   고객후기   FAQ   블로그        [EN] [내 예약 관리] [예약하기]
```

### 3.2 라우트 맵

| 메뉴 | 한국어 | 영어 | 상태 |
|---|---|---|---|
| Home | `/kr` | `/` | 기존 페이지 개편 |
| 고객후기 | `/kr/reviews` | `/reviews` | **신규** (홈에서 분리) |
| FAQ | `/kr/faq` | `/faq` | **신규** (홈에서 분리) |
| 블로그 | `/kr/blog`, `/kr/blog/[slug]` | `/blog`, `/blog/[slug]` | **신규** |
| 내 예약 관리 | `/kr/manage-booking` | `/manage-booking` | 기존 유지 (헤더만 교체) |
| 예약하기 | `/kr/booking` | `/booking` | **신규** (모달 → 페이지, §5.6) |
| 맛집(푸터·QR) | `/kr/blog/hawaii-restaurants` | `/blog/hawaii-restaurants` | 이전 + **301 리다이렉트** |
| 결제 결과 | `/kr/booking/success` 외 | `/booking/success` 외 | 기존 유지 |

### 3.3 사라진 메뉴 처리 (문구는 전부 보존)

| 기존 메뉴 | 처리 |
|---|---|
| 투어 (`#tours`) | Home 내 "오션스타 추천 프로그램" 섹션으로 유지 + 예약 페이지 1단계로 재활용. 메뉴에서만 제거 |
| 회사소개 (`#about`) | **전역 푸터**로 승격 (모든 페이지 하단에 노출) |

### 3.4 언어 전환 규칙

- `EN` 버튼은 **현재 페이지의 반대 언어 동일 경로**로 이동한다.
  - 예: `/kr/faq` → `/faq`, `/blog/hawaii-restaurants` → `/kr/blog/hawaii-restaurants`
  - 현재는 무조건 `/` 또는 `/kr`(홈)으로 보내고 있어 **개선 대상**.
- 기존 `setLanguageCookie()` (NEXT_LOCALE, 1년) 로직은 유지.

---

## 4. 콘텐츠 인벤토리 — 문구 유실 0 체크리스트

> 리뉴얼 후 아래 표의 모든 항목이 새 위치에 **글자 그대로** 존재해야 한다. QA 시 이 표로 전수 대조한다.

### 4.1 `src/locales/{ko,en}.ts` (그대로 재사용, 키 이동 없음)

| 네임스페이스 | 항목 수 | 새 위치 |
|---|---|---|
| `meta` | 2 | 각 페이지 `metadata` 기본값 |
| `header` | 3 | 전역 헤더 |
| `hero` | 7 | Home 히어로 |
| `bento` | 10 (5카드 × 제목/본문) | Home 강점 섹션 |
| `tour` | 30+ (제목·뱃지 6·상품명 3·상세 7·특징 8) | Home 투어 섹션 + 예약 1단계 |
| `review` | 8 | **고객후기 페이지** |
| `footer` | 13 | **전역 푸터** |
| `bookingModal` | 27 | **예약 페이지** |
| `reviewModal` | 10 | 고객후기 페이지(작성 모달) |
| `tourDetailsModal` | 3 | 투어 상세 모달 |
| `floater` | 3 | 모바일 하단 고정 CTA |
| `voucherEmail` | 20 | 변경 없음 (이메일 템플릿) |
| `voucher` | 22 | 변경 없음 (예약 완료 페이지) |
| `manage` | 55 | 내 예약 관리 페이지 |

### 4.2 컴포넌트 하드코딩 문구 (→ locale 파일로 이관 권장)

| 원본 | 내용 | 새 위치 |
|---|---|---|
| `FAQSection.tsx` | KO 7카테고리 **30문항**, EN 7카테고리 **28문항** | **FAQ 페이지** (전문) + Home 발췌 |
| `TourCourseTimeline.tsx` | 투어 코스 7단계 (픽업→하버→스노클링→SUP→카약→보트다이빙→드랍오프) + 이미지 7장 | Home "투어 코스" 섹션 |
| `PickupGuide.tsx` | "오션스타 공식 픽업 노선도" / "Official Pickup Route" + 안내 문구 | Home 하단 섹션 (아코디언 유지) |
| `restaurants/page.tsx` | 맛집 소개 전문, "오늘 즐거운 투어 되셨길 바랍니다✨…", QR 모달 | **블로그 1호 글** |
| `ReservationClientPage.tsx` | 투어 카드 예외 문구 3종 (프라이빗 설명, 선셋/콤보 상품명 줄바꿈 처리) | 투어 카드 컴포넌트 |
| `GoogleReviews.tsx` | 구글 리뷰 캐러셀 문구 | 고객후기 페이지 |
| 유튜브 섹션 | `review.video_title`, `video_subtitle`, embed `HaxDMbuuJHE` | 고객후기 페이지 |

### 4.3 KO/EN 갭 (리뉴얼 중 채울 것)

| 갭 | 조치 |
|---|---|
| EN FAQ "기타"에 2문항 없음 (음식·음료 제공 / 예약 변경 가능 여부) | EN 번역 추가 → 30/30 맞춤 |
| `hero.title1~3` KO/EN 구조가 달라 JSX에 `lang === 'ko'` 분기 하드코딩 | 분기 제거, locale 값만으로 렌더되게 정리 |
| `desc2` 등 빈 문자열 키 다수 | 사용 안 하면 삭제, 쓰면 값 채움 |

---

## 5. 페이지별 스펙

### 5.1 공통 셸 (모든 페이지)

**헤더** — `src/components/site/SiteHeader.tsx` (신규)

| 요소 | 데스크탑(≥1024) | 모바일(<1024) |
|---|---|---|
| 로고 | 좌측, 클릭 시 홈 | 좌측 |
| 메뉴 4개 | 중앙 정렬, `<Link>` (앵커 아님) | 햄버거 → 전체화면 드로어 |
| EN 전환 | 우측, 국기 아이콘 + 코드 | 드로어 내부 + 헤더 축약형 |
| 내 예약 관리 | 우측 아웃라인 버튼 | 드로어 내부 |
| 예약하기 | 우측 **Primary 버튼** | 헤더 아이콘 + **하단 고정 CTA로 상시 노출** |
| 현재 메뉴 표시 | 활성 링크 밑줄/색상 | 드로어 내 활성 강조 |
| 스크롤 반응 | 20px 초과 시 배경 불투명도·blur 강화 (기존 동작 유지) | 동일 |

**푸터** — `src/components/site/SiteFooter.tsx` (신규). 기존 `#about` 섹션 문구 전량 이관:
영업시간 / 이메일 / 주소 + 구글지도 링크 / Instagram / YouTube / 맛집(블로그) 링크 / 사업자 정보 4줄 / 저작권.

**전역 유지 요소**: `KakaoChatWidget`, Google Ads gtag, HubSpot 챗 — `layout.tsx`에 그대로 둔다.

---

### 5.2 Home (`/kr`, `/`)

섹션 순서 (기존 순서 유지, 후기/FAQ만 "발췌 + 더보기"로 축약):

| # | 섹션 | 재사용 | 비고 |
|---|---|---|---|
| 1 | 히어로 | 기존 | 제목/부제/CTA. CTA → `/booking` |
| 2 | 강점 벤토 5카드 | 기존 | Since 2019 / 14,000+ 리뷰 / 100% 거북이 / 51인승 루프탑 / 한국인 크루 |
| 3 | 추천 프로그램 (투어 카드) | 기존 | Supabase `tourSettings` 기반. 카드 CTA → `/booking?tour={id}` |
| 4 | 투어 코스 타임라인 | 기존 | 7단계 |
| 5 | 고객후기 **발췌** | 신규 축약 | 최신 6개 + "전체 후기 보기" → `/reviews` |
| 6 | 픽업 노선도 | 기존 | 아코디언 유지 |
| 7 | FAQ **발췌** | 신규 축약 | 인기 6문항 + "전체 FAQ 보기" → `/faq` |
| 8 | 하단 CTA 배너 | 신규 | `floater` 문구 재사용 |

### 5.3 고객후기 (`/kr/reviews`, `/reviews`)

- 자체 리뷰 **전체** (현재는 가로 캐러셀 → **그리드**로 변경, 모바일 1열)
- 리뷰 작성 모달 (`reviewModal` 문구 그대로, 예약번호 6자리 인증 로직 유지)
- 구글 리뷰 캐러셀 (`GoogleReviews`)
- 유튜브 영상 섹션
- 이미지 라이트박스 유지
- 데이터: `GET /api/reviews` (변경 없음). 페이지네이션 필요 여부는 §12-4

### 5.4 FAQ (`/kr/faq`, `/faq`)

- 7개 카테고리 × 전 문항. 좌측 카테고리 탭(데스크탑) / 상단 가로 스크롤 탭(모바일) — 기존 UX 유지
- 각 문항에 `id` 부여 → `/faq#refund-policy` 형태 딥링크 가능
- **`FAQPage` JSON-LD 구조화 데이터 추가** (검색 리치결과 목적, 신규)
- 취소·환불 규정 문항은 별도 강조 박스 (예약 전 필독)

### 5.5 블로그 (`/kr/blog`, `/blog`)

| 항목 | 스펙 |
|---|---|
| 목록 | 카드 그리드, 썸네일 + 제목 + 요약 + 작성일 + 카테고리 |
| 상세 | 본문(마크다운/리치텍스트), 하단 예약 CTA, 관련 글 3개 |
| 카테고리 (초안) | 하와이 맛집 · 여행 팁 · 투어 후기 · 공지 |
| 1호 글 | 기존 맛집 페이지 전문 이관 (`hawaii-restaurants`) — QR 모달 기능 포함 |
| 다국어 | 글 단위로 `lang` 보유. 번역 없는 글은 해당 언어 목록에서 제외 |
| 저장 방식 | **§12-1 결정 필요** (권장: Supabase `blog_posts` + 어드민 작성 화면) |
| SEO | 글별 `metadata`, OG 이미지, `Article` JSON-LD, sitemap 자동 포함 |

### 5.6 예약하기 (`/kr/booking`, `/booking`)

현재 4단계 모달(`bookingModal`)을 **독립 페이지**로 전환한다.

- 이유: 헤더 CTA가 모든 페이지에서 눌리는데 모달은 홈에만 존재 / 광고 랜딩 URL 필요 / 이탈 후 복귀 가능 / 전환 추적 용이
- **단계·검증·결제 로직은 그대로 이식** (react-hook-form + zod, 통화 선택 모달, Stripe checkout, 정원 조회, Google Places 픽업 자동추천)
- 단계: ① 투어 선택 → ② 인원 → ③ 날짜 → ④ 예약자 정보·결제
- 모바일: 단계당 1화면 풀스크린 + 하단 고정 "다음" 버튼 + 상단 4단계 진행 표시
- 데스크탑: 좌측 단계 폼 / 우측 **sticky 요약 카드**(선택 투어·날짜·인원·총 결제 금액)
- 쿼리 프리셋: `?tour=private` 등으로 진입 시 해당 단계 프리필
- 홈 히어로 CTA도 이 페이지로 이동 (모달 제거)

### 5.7 내 예약 관리 (`/kr/manage-booking`, `/manage-booking`)

- 기능·문구·API 변경 없음. 공통 헤더/푸터 적용 + §6·§7 토큰 적용만.

---

### 5.8 영어 페이지 (EN) 스펙

> **원칙: 영어 사이트는 한국어 사이트의 번역본이 아니라 "동일 구조 + 동일 컴포넌트 + 언어만 다른" 쌍둥이다.**
> 라우트 트리, 섹션 순서, 컴포넌트, §7 사이즈 토큰 전부 동일. 다른 것은 문구·폰트·통화·날짜 포맷뿐이다.

#### 5.8.1 헤더 라벨 매핑

| 위치 | 한국어 (`/kr`) | 영어 (`/`) | 출처 |
|---|---|---|---|
| 메뉴 1 | Home | Home | 고정 |
| 메뉴 2 | 고객후기 | Reviews | 신규 확정 |
| 메뉴 3 | FAQ | FAQ | 고정 |
| 메뉴 4 | 블로그 | Blog | 신규 확정 |
| 언어 토글 | `EN` + 🇺🇸 | `KR` + 🇰🇷 | 기존 로직 |
| 우측 버튼 1 | 내 예약 관리 | Manage My Booking | `header.manageBooking` |
| 우측 버튼 2 | 투어 예약하기 | Book a Tour | `header.bookNow` |

#### 5.8.2 페이지별 EN 문구 소스

| 페이지 | EN 문구 출처 | 비고 |
|---|---|---|
| Home 히어로 | `en.hero.*` | "Waikiki's Best Turtle Snorkeling Tour, Oceanstar" / CTA "Book Now & Get Best Rate Guarantee" — **KO보다 3~4배 긴 CTA**, 버튼 줄바꿈 설계 필요 |
| Home 강점 벤토 | `en.bento.*` | `desc2_title`이 "13,000+ Reviews ★Most in the Industry★" — KO(14,000+)와 **숫자 불일치**, §5.8.5 참조 |
| Home 투어 카드 | `en.tour.*` + Supabase `tourSettings` | 상품명은 `getTourNameByLang()` |
| Home 투어 코스 | `TourCourseTimeline.tsx` `courseDataEn` 7단계 | 이미지 7장 KO와 공유 |
| Home 픽업 노선도 | `PickupGuide.tsx` "Official Pickup Route" | |
| 고객후기 | `en.review.*` + `review.content_en` 컬럼 | 리뷰 본문에 영문 번역본(`content_en`)이 있으면 그것, 없으면 원문 노출 (현행 로직 유지) |
| FAQ | `FAQSection.tsx` `faqDataEn` 7카테고리 **28문항** | **2문항 부족** → §4.3 |
| 블로그 | `blog_posts.lang = 'en'` | 번역 없는 글은 EN 목록에서 제외 |
| 예약하기 | `en.bookingModal.*` (27개) | |
| 내 예약 관리 | `en.manage.*` (55개) | |
| 푸터 | `en.footer.*` | 사업자 정보는 KO/EN 동일 값 |
| 하단 고정 CTA | `en.floater.*` | "Undisputed #1 in Hawaii" / "Best Snorkeling Tour Booking" / "Book Now" |

#### 5.8.3 EN 전용 렌더링 규칙

| 항목 | 한국어 | 영어 |
|---|---|---|
| 제목 폰트 | SUIT | Poppins |
| 본문 폰트 | Pretendard | Inter |
| 줄바꿈 | `word-break: keep-all` (어절 단위) | `overflow-wrap: break-word` (긴 단어 대응) |
| 텍스트 길이 | 기준 | **KO 대비 평균 1.3~1.6배** — 버튼·카드 제목은 2줄까지 깨지지 않게 설계 |
| 히어로 대제목 | 2줄 (`--fs-hero`) | 최대 3줄 허용, 모바일에서 `--fs-hero` 32px → 28px 하향 검토 |
| 통화 기본값 | KRW (통화 선택 모달 노출) | **USD** 기본 |
| 가격 표기 | `₩150,000` | `$xxx` |
| 날짜 | `2026년 9월 3일 (수)` | `Wed, Sep 3, 2026` |
| 시간 | `오전 8:00` | `08:00 AM` (기존 `formatTimeAMPM` 유지) |
| 예약자 성함 | "예약자 성함(한국어)" | "Booker Name" (한글 요구 제거) |
| 상담 채널 | 카카오톡 채널 (`hioceanstar`) | **§12-7 결정 필요** (현재 EN FAQ는 "KakaoTalk/WhatsApp"이라 표기하나 실제 위젯은 카카오만 붙어 있음) |
| 국기 아이콘 | `flagcdn.com` 외부 이미지 | **로컬 SVG로 교체 권장** (외부 의존 + LCP 영향) |

#### 5.8.4 EN SEO

- `hreflang`: 모든 페이지에 `ko-KR` ↔ `en-US` 상호 링크 + `x-default = EN(/)`
- EN `canonical`은 `/`, `/reviews`, `/faq`, `/blog/...` (현행 `x-default`가 EN인 정책 유지)
- EN 메타 키워드는 `Waikiki turtle snorkeling`, `Honolulu snorkeling tour`, `Hawaii sunset cruise` 등 영어 검색어로 신규 작성 (현재 EN layout에 `keywords` 미설정)

#### 5.8.5 KO/EN 수치 불일치 정리 (리뉴얼 중 확정할 것)

| 항목 | KO | EN | 조치 |
|---|---|---|---|
| 누적 리뷰 수 | 14,000+ | 13,000+ | 한쪽으로 통일 |
| 푸터 리뷰 수 | 플랫폼 8,000 · 구글 5,000 | Platform 8,000+ · Google 5,000+ | 일치 |
| FAQ "왜 오션스타" | 마리 6,500+ · 구글 5,000+ | 6,500+ reviews | 일치 |
| 최대 정원 | 51인승 보트 / 예약 45인 | 51-passenger / max 45 pax | 일치 (표기 그대로 유지) |
| 거북이 이격 거리 | 2~3m | 10-foot | 동일 의미, 단위만 다름 — 유지 |

---

## 6. 디자인 시스템

### 6.1 방향

- 기준: **Wanted Design System** (설치본의 컬러/타이포/컴포넌트 규칙을 1차 소스로 사용)
- 현 사이트의 글래스모피즘은 **히어로·핵심 카드에만 제한적으로 유지**하고, 본문·리스트·폼은 불투명 서피스로 전환한다.
  - 근거: `backdrop-blur-[40px]`가 모바일 저사양 기기에서 스크롤 성능을 떨어뜨리고, 텍스트 대비(WCAG AA)를 위협한다.
- 아이콘: `lucide-react` 유지 (이미 의존성 존재, 교체 불필요)

### 6.2 컬러 토큰

> `현재값`은 지금 코드에서 쓰는 값. `원티드 DS 매핑` 칸은 착수 시 채운다.

| 토큰 | 용도 | 현재값 | 원티드 DS 매핑 |
|---|---|---|---|
| `--color-primary` | 예약 CTA, 링크 | `#2563eb` (blue-600) | (채울 것) |
| `--color-primary-hover` | CTA hover | `#1d4ed8` (blue-700) | |
| `--color-accent` | 브랜드 포인트(바다) | `#0284c7` (sky-600) | |
| `--color-text-strong` | 제목 | `#0f172a` (slate-900) | |
| `--color-text` | 본문 | `#334155` (slate-700) | |
| `--color-text-muted` | 보조 | `#64748b` (slate-500) | |
| `--color-surface` | 카드 배경 | `#ffffff` | |
| `--color-surface-glass` | 글래스 카드 | `rgba(255,255,255,.40)` | |
| `--color-border` | 구분선 | `#e2e8f0` (slate-200) | |
| `--color-warning` | 환불/주의 | `#f59e0b` | |
| `--color-danger` | 취소 | `#dc2626` | |

### 6.3 타이포 (폰트 패밀리는 현행 유지)

| 언어 | 제목 | 본문 |
|---|---|---|
| KO | SUIT | Pretendard |
| EN | Poppins | Inter |

한국어 본문에는 `word-break: keep-all` 을 전역 적용한다 (현재 일부 요소에만 `break-keep` 적용 중).

### 6.4 라운드 / 그림자

| 토큰 | 값 | 적용 |
|---|---|---|
| `--radius-card` | 24px | 일반 카드 |
| `--radius-hero` | 40px | 히어로·대형 패널 |
| `--radius-pill` | 9999px | 버튼·뱃지 |
| `--radius-input` | 12px | 입력 필드 |
| `--shadow-card` | `0 8px 24px rgba(0,0,0,.06)` | 카드 |
| `--shadow-cta` | `0 12px 28px rgba(37,99,235,.30)` | 주요 CTA |

---

## 7. 반응형 사이즈 스펙 ★ (직접 수정 구간)

### 7.1 원칙

**아래 표의 모든 숫자는 `src/styles/tokens.css` 한 파일에만 존재한다.**
수치를 바꾸고 싶으면 이 표를 고치고, 같은 이름의 변수를 그 파일에서 고치면 전 페이지에 반영된다.
컴포넌트에는 `text-3xl` 같은 리터럴 사이즈 클래스를 **쓰지 않는다** (arbitrary value로 변수 참조).

### 7.2 브레이크포인트

| 이름 | 범위 | 기준 검증 폭 |
|---|---|---|
| Mobile | ~639px | **375px** (iPhone SE / 13 mini 기준) |
| Tablet | 640~1023px | **768px** |
| Desktop | 1024px~ | **1440px** |

> Tailwind v4 기본 브레이크포인트(`sm:640 md:768 lg:1024 xl:1280`)를 그대로 쓴다. 신규 정의 없음.

### 7.3 레이아웃

| 변수 | Mobile(375) | Tablet(768) | Desktop(1440) |
|---|---|---|---|
| `--container-max` | 100% | 100% | **1200px** |
| `--container-pad` | 16px | 24px | 32px |
| `--section-gap` (섹션 간 상하 여백) | 56px | 72px | 96px |
| `--grid-gap` (카드 간격) | 16px | 20px | 24px |
| `--header-h` (헤더 높이) | 60px | 68px | 76px |
| `--bottom-cta-h` (모바일 하단 고정 CTA) | 64px | — | — |

### 7.4 타이포 스케일

| 변수 | 용도 | Mobile | Tablet | Desktop |
|---|---|---|---|---|
| `--fs-hero` | 히어로 대제목 | **32px / 1.25** | 44px / 1.2 | 60px / 1.15 |
| `--fs-hero-sub` | 히어로 소제목 | 18px / 1.4 | 24px / 1.35 | 30px / 1.3 |
| `--fs-h2` | 섹션 제목 | 24px / 1.3 | 32px / 1.25 | 42px / 1.2 |
| `--fs-h3` | 카드 제목 | 18px / 1.4 | 20px / 1.4 | 22px / 1.4 |
| `--fs-body` | 본문 | **15px / 1.7** | 16px / 1.7 | 17px / 1.75 |
| `--fs-sm` | 보조 | 13px / 1.6 | 14px / 1.6 | 14px / 1.6 |
| `--fs-btn` | 버튼 | 15px | 16px | 16px |
| `--fs-nav` | 헤더 메뉴 | 16px(드로어) | — | 15px |

> 한국어 본문 최소 15px 유지. 14px 이하는 캡션·법적고지에만 사용.

### 7.5 컴포넌트 사이즈

| 컴포넌트 | 변수 | Mobile | Tablet | Desktop |
|---|---|---|---|---|
| Primary 버튼 | `--btn-h` / `--btn-pad-x` | 52px / 24px | 52px / 28px | 56px / 32px |
| Secondary 버튼 | `--btn-h-sm` / pad-x | 40px / 16px | 40px / 18px | 44px / 20px |
| 입력 필드 | `--input-h` | **52px** | 52px | 52px |
| 카드 패딩 | `--card-pad` | 20px | 24px | 32px |
| 히어로 패널 패딩 | `--hero-pad` | 28px | 48px | 72px |
| 히어로 최소 높이 | `--hero-min-h` | `100svh` | 85vh | 800px |
| 투어 카드 그리드 | — | 1열 | 2열 | 3열 |
| 후기 카드 그리드 | — | 1열 | 2열 | 3열 |
| 블로그 카드 그리드 | — | 1열 | 2열 | 3열 |
| 벤토(강점) 그리드 | — | 1열 | 2열 | 상단 3 / 하단 2 |
| FAQ 카테고리 탭 | — | 상단 가로 스크롤 | 상단 가로 스크롤 | 좌측 세로 1/3폭 |
| 후기 이미지 썸네일 | `--thumb` | 88px | 104px | 120px |
| 터치 타깃 최소 | `--tap-min` | **44×44px** | 44×44 | — |

### 7.6 구현 형태 (`src/styles/tokens.css`, 신규 1개 파일)

```css
:root {
  /* 7.3 레이아웃 */
  --container-max: 100%;
  --container-pad: 16px;
  --section-gap: 56px;
  --grid-gap: 16px;
  --header-h: 60px;
  --bottom-cta-h: 64px;

  /* 7.4 타이포 */
  --fs-hero: 32px;      --lh-hero: 1.25;
  --fs-hero-sub: 18px;
  --fs-h2: 24px;
  --fs-h3: 18px;
  --fs-body: 15px;
  --fs-sm: 13px;
  --fs-btn: 15px;

  /* 7.5 컴포넌트 */
  --btn-h: 52px;   --btn-pad-x: 24px;
  --input-h: 52px;
  --card-pad: 20px;
  --hero-pad: 28px;
  --thumb: 88px;
}

@media (min-width: 640px) {   /* Tablet */
  :root {
    --container-pad: 24px; --section-gap: 72px; --grid-gap: 20px; --header-h: 68px;
    --fs-hero: 44px; --lh-hero: 1.2; --fs-hero-sub: 24px; --fs-h2: 32px; --fs-h3: 20px;
    --fs-body: 16px; --fs-sm: 14px; --fs-btn: 16px;
    --btn-h: 52px; --btn-pad-x: 28px; --card-pad: 24px; --hero-pad: 48px; --thumb: 104px;
  }
}

@media (min-width: 1024px) {  /* Desktop */
  :root {
    --container-max: 1200px; --container-pad: 32px; --section-gap: 96px;
    --grid-gap: 24px; --header-h: 76px;
    --fs-hero: 60px; --lh-hero: 1.15; --fs-hero-sub: 30px; --fs-h2: 42px; --fs-h3: 22px;
    --fs-body: 17px;
    --btn-h: 56px; --btn-pad-x: 32px; --card-pad: 32px; --hero-pad: 72px; --thumb: 120px;
  }
}
```

사용 예:

```tsx
<h2 className="text-[length:var(--fs-h2)] font-black text-[var(--color-text-strong)]">
```

> 이 파일은 `globals.css`에서 `@import "./tokens.css";` 로 1회만 불러온다.

### 7.7 모바일 필수 규칙

1. 375px에서 **가로 스크롤 0** (모든 테이블/캐러셀은 자체 `overflow-x` 컨테이너 안에서만 스크롤)
2. 하단 고정 예약 CTA(`--bottom-cta-h`) 상시 노출. 예약 페이지에서는 "다음/결제" 버튼으로 치환
3. 하단 고정 요소와 겹치지 않도록 `body` 하단에 `padding-bottom: calc(var(--bottom-cta-h) + env(safe-area-inset-bottom))`
4. 카카오 챗 위젯은 하단 CTA 위쪽으로 오프셋
5. 모든 탭 가능한 요소 최소 44×44px
6. 히어로는 `100svh` 사용 (`100vh` 금지 — 모바일 주소창 점프 방지)

---

## 8. SEO · 리다이렉트 · 계측

### 8.1 리다이렉트 (필수)

| From | To | 코드 | 사유 |
|---|---|---|---|
| `/restaurants` | `/blog/hawaii-restaurants` | 301 | **현장 QR코드 배포 중** — 404 시 고객 이탈 |
| `/kr/restaurants` | `/kr/blog/hawaii-restaurants` | 301 | 동일 |

> ⚠️ 맛집 페이지에는 QR 모달이 있고, 고객이 투어 종료 후 현장에서 스캔한다. 이 리다이렉트는 협상 불가 항목이다.

### 8.2 페이지별 메타

- 모든 페이지에 고유 `title` / `description` / `canonical` / `alternates.languages`(ko-KR, en-US, x-default)
- OG 이미지: 페이지별 지정, 없으면 `/og-image.jpg` 폴백
- 구조화 데이터: Home `TouristAttraction`+`Offer`(기존 유지), FAQ `FAQPage`(신규), 블로그 상세 `Article`(신규), 후기 `AggregateRating`(신규 검토)

### 8.3 사이트맵

`src/app/sitemap.ts`를 정적 6개 → **정적 라우트 + 블로그 글 동적 생성**으로 교체.

### 8.4 계측 (기존 유지 + 추가)

- Google Ads gtag, HubSpot: 그대로
- 추가 이벤트: `booking_start`(예약 페이지 진입), `booking_step`(1~4), `booking_submit`, `review_write`, `blog_read`

---

## 9. 접근성 · 성능 기준

| 항목 | 기준 |
|---|---|
| 대비 | 본문 텍스트 WCAG **AA (4.5:1)** — 글래스 배경 위 텍스트 전수 검증 |
| 키보드 | 헤더 메뉴·드로어·모달 전부 Tab 이동 + Esc 닫힘 + 포커스 트랩 |
| 이미지 | 전부 `next/image`, 의미 있는 `alt` (현재 `<img>` 직접 사용 구간 교체) |
| 모션 | `prefers-reduced-motion` 존중 (`Reveal` 애니메이션 비활성화 경로) |
| LCP | 모바일 4G 기준 **2.5초 이하** — 히어로 이미지 `priority`, 폰트 `display: swap` |
| CLS | **0.1 이하** — 이미지/영상 영역 사전 크기 지정 |
| blur 사용 | 뷰포트당 `backdrop-blur` 요소 8개 이하 (모바일 스크롤 성능) |

---

## 10. 데이터 · 백엔드 영향

| API / 테이블 | 변경 |
|---|---|
| `/api/settings`, `/api/pickup`, `/api/availability` | 변경 없음 |
| `/api/reviews` | 페이지네이션 파라미터 추가 검토 (§12-4) |
| `/api/google-reviews` | 변경 없음 |
| `/api/stripe/*`, `/api/cancel`, `/api/reschedule` | **변경 없음** |
| `blog_posts` (신규 테이블 후보) | `id, slug, lang, title, summary, body, thumbnail_url, category, published_at, is_published` |
| 어드민 `website-settings` | 블로그 작성 메뉴 추가 (§12-1 채택 시) |

---

## 11. 구현 단계

| Phase | 내용 | 산출물 |
|---|---|---|
| **P0** | 디자인 토큰 확정 | `tokens.css`, 컬러/타이포 표 확정 |
| **P1** | 공통 셸 | `SiteHeader`, `SiteFooter`, 언어전환 로직, 모바일 드로어 + 하단 CTA |
| **P2** | 페이지 분해 | `ReservationClientPage.tsx` 1,884줄 → 섹션 컴포넌트 분리 (`components/home/*`) |
| **P3** | 후기 · FAQ 페이지 | 라우트 생성 + 문구 이관 + JSON-LD |
| **P4** | 예약 페이지 | 모달 → `/booking` 페이지 이식 (결제 로직 무손실 검증 필수) |
| **P5** | 블로그 | 스키마 + 목록·상세 + 맛집 글 이관 + 301 리다이렉트 |
| **P6** | EN 동기화 | EN 라우트 전체 + FAQ 2문항 보강 + hreflang |
| **P7** | QA | §4 문구 전수 대조 · 375/768/1440 3폭 검수 · 결제 E2E 1건 실결제 테스트 |

> P4는 돈이 걸린 구간이다. 이식 후 **실제 소액 결제 → 환불 1사이클**을 반드시 통과시킨다.

---

## 12. 결정 필요 (착수 전)

| # | 항목 | 선택지 | 권장 |
|---|---|---|---|
| 1 | 블로그 글 저장 방식 | (A) 리포지토리 내 MDX 파일 (B) Supabase 테이블 + 어드민 작성 화면 | **B** — 이미 Supabase·어드민이 있고, 코드 배포 없이 직접 글을 올려야 하므로 |
| 2 | 예약 방식 | (A) 현행 모달 유지 (B) `/booking` 독립 페이지 | **B** — 헤더 CTA가 전 페이지에 있고 광고 랜딩 URL이 필요 |
| 3 | 글래스모피즘 유지 강도 | (A) 현행 전면 유지 (B) 히어로·핵심 카드만 (C) 전면 제거 | **B** — 브랜드 인상 유지 + 모바일 성능/대비 확보 |
| 4 | 후기 페이지 로딩 | (A) 전체 로드 (B) 페이지네이션(API 수정 필요) | 리뷰 200건 초과 시 **B**, 이하면 A로 시작 |
| 5 | 블로그 초기 카테고리 | 맛집 / 여행 팁 / 투어 후기 / 공지 | 확정 필요 |
| 6 | Wanted DS 토큰 실제 값 | §6.2 "원티드 DS 매핑" 칸 | 설치본에서 추출해 기입 필요 |
| 7 | 영어권 상담 채널 | (A) 카카오톡 유지 (B) WhatsApp 추가 (C) 이메일/폼만 | EN FAQ에 이미 "KakaoTalk/WhatsApp"으로 써 있어 **확정 필요** |
| 8 | KO/EN 리뷰 수 표기 | 14,000+ vs 13,000+ | 실제 수치로 통일 |

---

## 13. Claude Design 아트보드 구성

> 목적: 한국어·영어 사이트를 **각각 데스크탑/모바일로 동시에 눈으로 비교**하며 수정할 수 있게 한다.
> 캔버스 1개에 아래 아트보드를 격자로 배치한다.

### 13.1 아트보드 캔버스 사이즈

| 뷰 | 캔버스 폭 | 콘텐츠 폭 | 비고 |
|---|---|---|---|
| Desktop | **1440px** | 1200px (`--container-max`) + 좌우 32px 패딩 | 1440 기준으로 그리면 1920에서도 중앙 정렬로 안전 |
| Mobile | **375px** | 375 − 좌우 16px = 343px | iPhone SE/13 mini. 393(iPhone 15)에서 자동 확장 확인만 |

> 태블릿(768)은 시안 없이 **데스크탑 시안에서 자동 축소 규칙(§7)으로 처리**한다. 아트보드로 그리면 유지보수 대상이 3배가 된다.

### 13.2 아트보드 매트릭스 (4종 뷰 × 페이지)

명명 규칙: `{page}--{lang}--{viewport}` (예: `home--ko--desktop`, `faq--en--mobile`)

| # | 페이지 | ko/desktop | ko/mobile | en/desktop | en/mobile | 우선순위 |
|---|---|---|---|---|---|---|
| 1 | Home | ✅ | ✅ | ✅ | ✅ | **1차** |
| 2 | 고객후기 | ✅ | ✅ | ✅ | ✅ | **1차** |
| 3 | FAQ | ✅ | ✅ | ✅ | ✅ | **1차** |
| 4 | 블로그 목록 | ✅ | ✅ | ✅ | ✅ | **1차** |
| 5 | 블로그 상세 | ✅ | ✅ | ✅ | ✅ | 2차 |
| 6 | 예약하기 (4단계) | ✅ | ✅ | ✅ | ✅ | 2차 |
| 7 | 내 예약 관리 | ✅ | ✅ | ✅ | ✅ | 2차 |

- **1차 = 16장** (Home·후기·FAQ·블로그목록 × 4뷰) → 여기서 톤앤매너를 확정한다
- **전체 = 28장**
- 예약하기는 단계가 4개라 아트보드 1장에 **4단계를 세로로 이어 붙여** 그린다 (단계별 분리 시 16장 추가 발생)

### 13.3 캔버스 배치

```
        ko/desktop      ko/mobile      en/desktop      en/mobile
Home    [1440×~7800]    [375×~9600]    [1440×~8400]    [375×~10400]
후기     [1440×~3200]    [375×~4800]    [1440×~3400]    [375×~5000]
FAQ     [1440×~2600]    [375×~3600]    [1440×~2800]    [375×~3800]
블로그   [1440×~2400]    [375×~3400]    [1440×~2400]    [375×~3400]
```

- **행 = 페이지, 열 = 언어×뷰포트.** 좌우로 훑으면 KO/EN 대조가, 위아래로 훑으면 페이지 흐름이 보인다
- 세로 길이는 콘텐츠에 따라 늘어나는 추정치. EN은 문구가 길어 **KO 대비 5~10% 더 길게** 잡았다 (§5.8.3)
- 각 아트보드 상단에 라벨 표기: `Home / 한국어 / Desktop 1440`

### 13.4 아트보드 제작 규칙

1. **문구는 지어내지 않는다.** §4·§5.8.2 표에 적힌 실제 locale 값·FAQ 원문을 그대로 넣는다. 시안용 lorem ipsum 금지 — 실제 한국어/영어 길이가 레이아웃을 결정한다
2. **사이즈는 §7 표 값을 그대로 쓴다.** 시안에서 임의 사이즈를 쓰면 코드와 어긋난다
3. **컬러는 §6.2 토큰명으로 관리**한다. Wanted DS 값이 확정되면 토큰만 갈아끼우면 전 아트보드가 갱신되게
4. KO/EN 아트보드는 **같은 레이아웃 그리드를 공유**한다. EN에서 깨지면 그건 EN 디자인 문제가 아니라 **레이아웃이 텍스트 길이에 취약한 것** → KO 쪽도 같이 고친다
5. 모바일 아트보드에는 **하단 고정 CTA(64px)를 반드시 포함**하고, 그만큼 콘텐츠 하단 여백을 확보한다
6. 상태 변형(빈 상태, 로딩, 에러, 리뷰 0건, 블로그 0건)은 별도 아트보드 대신 **1차 아트보드 옆에 작은 변형 카드**로 붙인다

### 13.5 검수 체크리스트 (아트보드 완성 시)

- [ ] 같은 페이지의 ko/en 아트보드에서 섹션 개수·순서가 완전히 동일한가
- [ ] EN 히어로 CTA("Book Now & Get Best Rate Guarantee")가 375px에서 버튼 밖으로 넘치지 않는가
- [ ] EN 벤토 카드 제목("13,000+ Reviews ★Most in the Industry★")이 카드 안에서 2줄 이내인가
- [ ] 모바일 375px에서 가로로 삐져나오는 요소가 없는가
- [ ] 헤더 우측 3요소(EN·내 예약 관리·예약하기)가 데스크탑 1440에서 메뉴와 겹치지 않는가 (현행 사이트의 알려진 문제)
- [ ] 글래스 배경 위 본문 텍스트 대비가 4.5:1 이상인가

---

## 부록 A. 신규/변경 파일 목록 (예상)

```
신규
  src/styles/tokens.css
  src/components/site/SiteHeader.tsx
  src/components/site/SiteFooter.tsx
  src/components/site/MobileDrawer.tsx
  src/components/site/BottomCta.tsx
  src/components/home/{Hero,Bento,TourCards,ReviewsPreview,FaqPreview,BottomBanner}.tsx
  src/app/(ko)/kr/{reviews,faq,blog,booking}/page.tsx
  src/app/(ko)/kr/blog/[slug]/page.tsx
  src/app/(en)/{reviews,faq,blog,booking}/page.tsx
  src/app/(en)/blog/[slug]/page.tsx
  src/app/(ko)/(admin)/dashboard/blog/page.tsx        (§12-1 B 채택 시)

변경
  src/app/globals.css                (tokens.css import, break-keep 전역)
  src/app/(ko)/layout.tsx            (헤더/푸터 삽입)
  src/app/(en)/layout.tsx            (동일)
  src/app/sitemap.ts                 (동적 생성)
  next.config.ts                     (301 리다이렉트 2건)
  src/locales/{ko,en}.ts             (하드코딩 문구 이관, EN FAQ 2문항 추가)
  src/components/landing/*           (섹션 컴포넌트로 분해)

이동
  src/app/(ko)/kr/restaurants/*  →  블로그 1호 글 (KO)
  src/app/(en)/restaurants/*     →  블로그 1호 글 (EN)
```
