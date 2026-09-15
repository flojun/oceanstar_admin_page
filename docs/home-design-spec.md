# 오션스타 Home 페이지 — 구현 스펙

- 문서 버전: v1.0
- 작성일: 2026-09-01
- 범위: **Home 페이지의 시각 스펙과 데이터 연동.** 라우트 구조·IA·SEO·다국어 정책은 [renewal-prd.md](renewal-prd.md)를 따른다. 감사 근거는 [design-audit.md](design-audit.md).
- 시안: [Claude Design 캔버스](https://claude.ai/code/artifact/2c5de1ed-54bc-4538-8135-fc4580b2aa0e) — `선택안 · 화이트+블루` 페이지
- 작업 파일: `docs/design-canvas/Main.dc.html`(데스크탑), `Chosen_Mobile.dc.html`(모바일)

---

## 0. 확정 / 미확정

### 확정

| 항목 | 결정 |
|---|---|
| 방향 | C안(트로피컬 볼드)의 **서체와 구성**을 채택, 색은 로고 기반 화이트+블루로 교체 |
| 대제목 서체 | **Do Hyeon** (Black Han Sans는 큰 크기에서 뭉개져 반려) |
| 팔레트 | 2안 **밝은 오션** 적용 중 |
| 추천 프로그램 | **6개 동일 크기** 카드. 3열 × 2행 (데스크탑) / 1열 (모바일) |
| 6번째 상품 | 거북이 스노클링 + 서핑 |
| 글래스모피즘 | 제거. 불투명 서피스로 전환 |

### 미확정 (착수 전 결정 필요)

| # | 항목 | 상태 |
|---|---|---|
| 1 | 팔레트 최종 | 1안(딥 네이비) / **2안(밝은 오션, 현재)** / 3안(시안 팝) 중 택일. 캔버스 `색상 3안` 아트보드 참조 |
| 2 | 프라이빗 차터 가격 표기 | DB의 `₩2,066,850` 노출 vs "인원별 상이"만 표기 |
| 3 | 서핑 상품 원화 정가 | 현재 `$190` 임시가를 환율 환산한 `₩261,018`. **원화로 고정 권장** |
| 4 | 서핑 상품 사진 | 현재 보드 사진으로 임시 대체 |
| 5 | 누적 리뷰 수 | KO 14,000+ / EN 13,000+ 불일치. 실제 수치로 통일 |
| 6 | 원티드 디자인 시스템 | 연결 시 §1 토큰을 원티드 값으로 치환 |

---

## 1. 디자인 토큰

로고(`public/logo.png`) 픽셀에서 추출한 파란색 램프 기반. **강조색은 이 파랑 계열 하나뿐이다.**

### 1.1 컬러

| 토큰 | 값 | 용도 |
|---|---|---|
| `--navy` | `#0a3f66` | 제목, 다크 블록 배경, 가격 |
| `--primary` | `#0077a8` | 예약 CTA, 링크, 아이콘 스트로크 |
| `--primary-hover` | `#00648f` | CTA hover |
| `--cyan` | `#00a0d0` | 별점, 체크 마크, 활성 밑줄 |
| `--cyan-light` | `#6fd0ee` | 네이비 위 뱃지·버튼 배경 |
| `--surface` | `#ffffff` | 페이지·카드 배경 |
| `--surface-soft` | `#f4fafd` | 보조 카드 배경 |
| `--surface-badge` | `#e4f3fa` | 히어로 뱃지 배경 |
| `--placeholder` | `#dcf0f9` | 이미지·아바타 자리 |
| `--text` | `#44586a` | 본문 |
| `--text-soft` | `#52697c` | 카드 본문 |
| `--text-muted` | `#7b8fa0` | 보조·메타 |
| `--text-meta` | `#9bafbf` | 날짜 |
| `--on-navy-muted` | `#a8cee2` | 네이비 위 보조 텍스트 |
| `--border` | `#e3edf4` | 카드·헤더 테두리 |
| `--border-inner` | `#eef4f8` | 카드 내부 구분선 |
| `--border-outline` | `#bcdcec` | 아웃라인 버튼 테두리 |

**대비 검증 (WCAG AA)**

| 조합 | 비율 | 판정 |
|---|---|---|
| `#0077a8` 배경 + 흰 글자 | **5.0 : 1** | ✅ 본문 기준 통과 |
| `#0a3f66` 배경 + 흰 글자 | 11.4 : 1 | ✅ |
| `#00a0d0` 배경 + 흰 글자 | 3.0 : 1 | ❌ **텍스트 배경으로 쓰지 말 것.** 아이콘·마크 전용 |

> `--cyan`을 버튼 배경으로 쓰려면 글자를 `--navy`로 둔다 (3안이 이 방식).

### 1.2 그림자

| 토큰 | 값 | 적용 |
|---|---|---|
| `--shadow-card` | `0 8px 24px rgba(0,119,168,.08)` | 투어·후기 카드 |
| `--shadow-cta` | `0 14px 30px rgba(0,119,168,.28)` | 히어로 CTA |
| `--shadow-cta-sm` | `0 10px 24px rgba(0,119,168,.24)` | 헤더 CTA |
| `--shadow-float` | `0 20px 44px rgba(0,119,168,.16)` | 히어로 숫자 바 |
| `--shadow-navy` | `0 12px 28px rgba(10,63,102,.22)` | 네이비 카드 |

**전부 파랑 틴트다.** 순수 검정 그림자를 쓰지 않는다 (감사 P1-5).

### 1.3 라운드

| 토큰 | 값 | 적용 |
|---|---|---|
| `--radius-card` | `20px` | 카드·패널 |
| `--radius-btn` | `12px` | 버튼 |
| `--radius-badge` | `8px` | 카드 뱃지 |
| `--radius-chip` | `10px` | 헤더 버튼 |
| `--radius-pill` | `9999px` | 히어로 뱃지 |
| `--radius-hero-img` | `28px 0 0 28px` | 히어로 사진 (좌측만) |

### 1.4 서체

| 역할 | 프로덕션 | 캔버스 시안 | 비고 |
|---|---|---|---|
| 대제목 (`.d`) | **Do Hyeon** | Do Hyeon | **신규 도입.** Google Fonts |
| 소제목 (`.h`) | **SUIT** | Gothic A1 | 현행 유지 |
| 본문 (`.b`) | **Pretendard** | Noto Sans KR | 현행 유지 |

- 굵기는 **3단만** 쓴다 — 400 본문 / 600 소제목 / 900 대제목 (감사 P1-1)
- 전역: `word-break: keep-all`
- 제목: `text-wrap: balance` / 본문: `text-wrap: pretty` (감사 P1-2)
- 가격·인원·날짜: `font-variant-numeric: tabular-nums` (감사 P1-3)
- Do Hyeon은 **웨이트가 1종뿐**이다. `font-weight`를 지정하지 말 것

---

## 2. 반응형 사이즈

브레이크포인트는 Tailwind v4 기본값(`sm:640 md:768 lg:1024`). 검증 폭 **375 / 768 / 1440**.

### 2.1 레이아웃

| 변수 | 모바일 | 태블릿 | 데스크탑 |
|---|---|---|---|
| `--container-max` | 100% | 100% | **1200px** |
| `--container-pad` | 16 | 24 | 32 |
| `--section-gap` | 56 | 72 | 96 |
| `--grid-gap` | 16 | 20 | 24 |
| `--header-h` | 60 | 68 | 76 |
| `--bottom-cta-h` | 64 | — | — |

### 2.2 타이포 스케일

| 변수 | 용도 | 모바일 | 태블릿 | 데스크탑 |
|---|---|---|---|---|
| `--fs-display` | 히어로 대제목 (Do Hyeon) | **46 / 1.06** | 64 / 1.08 | **88 / 1.08** |
| `--fs-h2` | 섹션 제목 (Do Hyeon) | 32 / 1.2 | 40 / 1.2 | **50 / 1.2** |
| `--fs-hero-sub` | 히어로 소제목 | 17 / 1.4 | 24 / 1.35 | 30 / 1.35 |
| `--fs-h3` | 카드 제목 | 19 / 1.35 | 20 / 1.35 | 21 / 1.35 |
| `--fs-h3-lg` | 강조 카드 제목 | — | 24 | 28 |
| `--fs-price` | 가격 (Do Hyeon) | 26 / 1.15 | 26 / 1.15 | 26 / 1.15 |
| `--fs-stat` | 숫자 바 (Do Hyeon) | 26 / 1.1 | 30 / 1.1 | 34 / 1.1 |
| `--fs-body` | 본문 | 15 / 1.7 | 16 / 1.7 | 17 / 1.75 |
| `--fs-lead` | 히어로 본문 | 15 / 1.75 | 17 / 1.8 | 18 / 1.8 |
| `--fs-sm` | 메타 | 14 / 1.6 | 14 / 1.6 | 14 / 1.6 |
| `--fs-xs` | 캡션 | 12 | 13 | 13 |

> 대제목만 [renewal-prd.md](renewal-prd.md) §7.4 기본값(60/32)보다 크다. Do Hyeon 채택에 따른 의도적 상향.

### 2.3 컴포넌트

| 항목 | 모바일 | 태블릿 | 데스크탑 |
|---|---|---|---|
| 히어로 CTA 높이 / 패딩 | 52 / full-width | 56 / 32 | **60 / 36** |
| 카드 CTA 높이 | 52 / full-width | 48 | **48 / full-width** |
| 헤더 CTA 높이 | — | 40 | 42 (`11px 22px`) |
| 아웃라인 버튼 높이 | 52 | 52 | 52 |
| 카드 패딩 | 20 | 22 | 24 |
| 강조 카드 패딩 | 20 | 28 | 32~36 |
| 투어 카드 이미지 높이 | 170 | 170 | 170 |
| 히어로 사진 | 375 × 240 (전폭) | 우측 480×420 | **우측 640×500** |
| 히어로 섹션 높이 | 내용 기준 | 620 | **700** |
| 터치 타깃 최소 | **44 × 44** | 44 × 44 | — |

### 2.4 그리드

| 섹션 | 모바일 | 태블릿 | 데스크탑 |
|---|---|---|---|
| 강점 (5개) | 1열 | 2열 | 상단 `1.6fr 1fr 1fr` + 하단 `1fr 1.6fr` |
| **추천 프로그램 (6개)** | **1열** | **2열** | **3열 × 2행 — 전부 동일 크기** |
| 후기 (3개) | 1열 | 2열 | 3열 |
| 히어로 숫자 | 2 × 2 | 4열 | 4열 가로 바 |

---

## 3. 섹션 스펙

### 3.1 헤더

```
[로고 46px]   Home  고객후기  FAQ  블로그   [EN] [내 예약 관리] [투어 예약하기]
```

- 높이 `--header-h`, 하단 `1px solid --border`, 배경 흰색 (반투명·blur 없음)
- 로고: `public/logo.png` 원본. 높이 46(D) / 36(M), `width: auto`
- 활성 메뉴: `--navy` + 700 + `2px solid --cyan` 하단 밑줄, `padding-bottom: 4px`
- `EN`·`내 예약 관리`: `--radius-chip` 아웃라인 칩
- `투어 예약하기`: `--primary` 배경 + 흰 글자 + `--shadow-cta-sm`
- 모바일: 로고 / `EN` 칩 / 햄버거(44×44, `--surface-soft` 배경) — 메뉴 4개는 드로어로

### 3.2 히어로

데스크탑은 **좌 활자 / 우 사진**, 하단에 숫자 바가 섹션 경계를 넘어 겹친다.

| 요소 | 스펙 |
|---|---|
| 섹션 배경 | `linear-gradient(180deg, #f4fafd 0%, #ffffff 100%)` |
| 사진 | 우측 상단 `top:56 right:0`, 640×500, `--radius-hero-img`, `object-fit: cover` |
| 텍스트 블록 | `left:120 top:88`, width 700 |
| 뱃지 | `SINCE 2019 · 하와이 한인 최초` — 12px/700/`0.18em`, `--surface-badge` 배경, pill |
| 소제목 | `--fs-hero-sub`, weight 600, `--text-muted` |
| 대제목 | `--fs-display`, Do Hyeon, `--navy`. "오션스타"만 `--primary` |
| 본문 | `--fs-lead`, `--text-soft`, `max-width: 490px` |
| CTA 2개 | `바로 예약하기`(채움) + `투어 코스 보기`(아웃라인), gap 14 |
| 숫자 바 | `left:120 bottom:-52`, 흰 배경 + `--border` + `--shadow-float`, 셀 패딩 `26px 40px`, 셀 사이 `1px solid --border` |

숫자 바 4칸: `14,000+ 누적 리뷰` / `100% 거북이 보장` / `51인승 루프탑 보트` / `4시간 넉넉한 운영`
첫 칸 숫자만 `--primary`, 나머지는 `--navy`.

> 숫자 바가 아래로 52px 튀어나오므로 **다음 섹션 상단 여백은 148px** (96 + 52).

모바일은 활자 → CTA → 사진(240px 전폭) → 네이비 숫자 밴드(2×2) 순서.

### 3.3 강점 5가지

- 섹션 제목: `왜 오션스타인가` — `--fs-h2`, Do Hyeon. "오션스타"만 `--primary`
- 카드 5장 중 **3번(100% 거북이 보장) 한 장만 `--navy` 반전**. 나머지는 `--surface-soft` + `--border`
- 각 카드: 아이콘(24×24 stroke, `--primary` / 반전 카드는 `--cyan-light`) → 제목 → 본문
- 크기 불균등: 1·5번이 넓은 칸(`1.6fr`), 제목 `--fs-h3-lg`, 패딩 36
- 모바일은 5장 중 3장만 노출 + `강점 5가지 모두 보기` 링크

### 3.4 추천 프로그램 (6개)

**여섯 칸 모두 동일한 크기·구조.** 카드 내부 순서 고정:

```
[이미지 170px + 좌상단 뱃지]
제목       --fs-h3 / 900 / --navy
메타       --fs-sm / --text-muted     (시간 · 정원 또는 한 줄 설명)
─────────  1px solid --border-inner
가격       --fs-price / Do Hyeon / tabular-nums
가격 보조  --fs-xs / --text-muted
[예약하기] 높이 48(D) / 52(M), 전폭, --primary
```

- 카드 높이는 그리드가 맞춘다. 가격 블록에 `margin-top: auto`
- 뱃지 기본은 흰 배경 + `--navy` 글자. **1번(가장 인기있는 상품)만** `--primary` 배경 + 흰 글자
- **5번 프라이빗 차터만 `--navy` 카드** — 버튼은 `--cyan-light` 배경 + `--navy` 글자

| # | tour_id | 이름 | 뱃지 | 메타 | 가격 |
|---|---|---|---|---|---|
| 1 | `morning1` | 1부 거북이 스노클링 | 가장 인기있는 상품 | 08:00 - 11:00 · 최대 45인 | ₩151,570 (아동 ₩106,100) |
| 2 | `morning2` | 2부 거북이 스노클링 | 여유로운 출발시간 | 11:00 - 14:00 · 최대 45인 | ₩151,570 (아동 ₩106,100) |
| 3 | `sunset` | 선셋 거북이 스노클링 | 로맨틱 선셋 뷰 | 15:00 - 18:00 · 최대 38인 | ₩206,690 (아동 ₩130,900) |
| 4 | `combo_marine` | 거북이 스노클링 + 패러세일링 / 제트스키 | 짜릿한 콤보 | 거북이 스노클링과 함께 짜릿하게 | ₩289,360 (아동 동일) |
| 5 | `private` | 프라이빗 차터 | VVIP 단독 대관 | 단독 대관 (2시간) · 최대 30인 | ₩2,066,850 ※미확정-2 |
| 6 | **미생성** | 거북이 스노클링 + 서핑 | 신규 | 와이키키 명물 서핑까지 한번에 | ₩261,018 ※미확정-3 |

> **이전 사이트는 1부·2부를 "와이키키 거북이 스노클링" 한 장으로 묶어 4장을 노출했다.** 이 스펙은 묶지 않고 6장을 펼친다. `ReservationClientPage.tsx`의 `combined_morning` 가상 카드 생성 로직을 제거해야 한다.

### 3.5 고객후기 발췌

- 제목 + `전체 후기 보기` 아웃라인 버튼(우측 정렬) → `/kr/reviews`
- 카드 3장, `--surface-soft` 배경
- 별 5개: 16×16, `fill="--cyan"`
- 본문 → (이미지 3장 그리드, 있을 때) → 하단 작성자·날짜
- **캐러셀 아님.** 그리드 고정 (감사 P1-6)

---

## 4. 데이터 연동

| 화면 요소 | 소스 | 필드 |
|---|---|---|
| 투어 카드 6장 | `GET /api/settings` → `tourSettings` | `tour_id, name, description, start_time, end_time, adult_price_krw, child_price_krw, max_capacity, is_active, display_order, is_flat_rate` |
| 카드 정렬 | 동일 | `display_order` 오름차순, `is_active !== false`만 |
| 후기 카드 | `GET /api/reviews` | `rating, content, content_en, image_urls, author_name, created_at` |
| 구글 리뷰 | `GET /api/google-reviews` | 변경 없음 |
| 문구 전반 | `src/locales/{ko,en}.ts` | 기존 키 그대로 |
| 로고 | `public/logo.png` | — |

### 4.1 서핑 상품 신규 등록 (필요 작업)

`tour_settings` 테이블에 행 추가:

```
tour_id:          surf_combo        (제안)
name:             거북이 스노클링 + 서핑
description:      와이키키 명물 서핑까지 한번에
adult_price_krw:  [원화 정가 확정 필요]
child_price_krw:  [확정 필요]
max_capacity:     [확정 필요]
display_order:    4                 (콤보 앞뒤 중 결정)
is_active:        true
is_flat_rate:     false
```

> 현재 시안의 `₩261,018`은 `$190 × 1,373.777338`(2026-09-01 `/api/exchange-rate` 실측) 환산값이다. **환율이 움직이면 끝자리가 계속 바뀌므로 원화로 고정할 것.**

---

## 5. 구현 노트

1. **토큰 파일 신설** — `src/styles/tokens.css` 하나에 §1·§2 값을 CSS 변수로 넣고 `globals.css`에서 `@import`. 컴포넌트에 `text-3xl` 같은 리터럴 사이즈 클래스를 쓰지 않는다
2. **폰트 로딩** — Do Hyeon만 신규. `next/font/google`로 불러 `--font-display`에 바인딩. Pretendard·SUIT는 현행 jsDelivr 유지
3. **컴포넌트 분해** — `ReservationClientPage.tsx`(1,884줄)에서 Home 섹션을 `src/components/home/{Hero,Bento,TourCards,ReviewsPreview}.tsx`로 분리
4. **접근성** — 모든 클릭 요소를 `<button>`/`<a>`로. 전역 `:focus-visible` 스타일 1개 정의. `skip-to-content` 링크 추가 (감사 P0-3)
5. **이미지** — 전부 `next/image`, 히어로만 `priority`. 현재 `<img>` 직접 사용 6곳 교체 (감사 P2-3)
6. **성능** — `backdrop-filter`를 쓰지 않는다. 이 디자인에는 필요 없다
7. **모바일** — 375px 가로 스크롤 0, 하단 고정 CTA 64px, `body`에 `padding-bottom: calc(64px + env(safe-area-inset-bottom))`

---

## 6. 영어판

레이아웃·토큰·사이즈 전부 동일. 문구만 교체하고 아래 4가지를 지킨다.

1. 제목 서체를 **Poppins**, 본문을 **Inter**로 전환 (`html[lang]` 분기, 현행 방식 유지). Do Hyeon은 한글 전용이므로 영어판 대제목은 Poppins 800
2. 히어로 CTA가 `Book Now & Get Best Rate Guarantee` — 한국어의 4배 길이다. **375px 버튼을 이 문자열 기준으로 설계**
3. `word-break: keep-all` → `overflow-wrap: break-word`
4. 통화 기본 USD, 날짜 `Wed, Sep 3, 2026`

영어판 아트보드는 아직 없다. 팔레트 확정 후 제작.
