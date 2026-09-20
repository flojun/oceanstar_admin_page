# -*- coding: utf-8 -*-
"""SianB(한글판)에서 영문판 보드를 만든다.

한글판이 확정안이므로 구조는 한 글자도 건드리지 않는다. 바꾸는 것은 두 가지다.

1) 문안 - 한국어 투어라는 점을 내세우던 문장을 걷어내고, 여러 나라에서 오는
   손님에게 통하는 말로 바꾼다. 가격은 원화 대신 달러로 쓴다.
2) 조판 - 한글에 맞춰 둔 값(word-break:keep-all, 자간 -.035em, 행간 1.8~1.9)은
   라틴 문자에서 어긋난다. 기존 규칙은 그대로 두고 맨 뒤에 영문 레이어를
   덧붙여 덮어쓴다. 한글판과 나란히 놓고 비교하기 쉬우라고 이렇게 했다.

환율은 한글판 원화에서 역산한 1377.9 원이 정확히 떨어진다.
  110 x 1377.9 = 151,569 -> 151,570 (10원 반올림)
  150 x 1377.9 = 206,685 -> 206,690
  210 x 1377.9 = 289,359 -> 289,360   (콤보 1인 $210 은 lib/pricing.ts 상수)
  1500 x 1377.9 = 2,066,850           (프라이빗 시작가)
서핑만 189.43 이 나와 떨어지지 않는다. 한글판에서 [원화 정가 확정 필요] 로
표시해 둔 그 값이라, 영문판에서도 확정 전 표시로 남긴다.
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))

# ── 조판 레이어 ──────────────────────────────────────────────────────
EN_CSS_DESK = """
/* ── 영문 조판 레이어 ─────────────────────────────────────────────
   위 규칙은 한글판 그대로 두고 여기서만 덮어쓴다.
   1) word-break:keep-all 은 한글 규칙이다. 라틴에서는 "51-seat" 같은 하이픈
      낱말이 통째로 묶여 칸을 넘긴다.
   2) 자간 -.035em 은 네모틀 글자에 맞춘 값이다. 라틴은 크기별로 달리 준다.
      큰 글자일수록 조이고 본문 크기에서는 0 에 가깝게.
   3) 행간 1.8~1.9 는 한글 기준이다. 어센더·디센더가 오르내리는 라틴은
      1.6 안팎이 읽기 편하고, 그보다 벌리면 줄이 따로 논다. */
.page{word-break:normal;overflow-wrap:break-word;hyphens:none;-webkit-hyphens:none}
.page h1,.page h2,.page h3,.page h4{letter-spacing:-.021em;text-wrap:balance}
.hero-mid h1{font-size:64px;line-height:1.1;letter-spacing:-.032em}
.hero-mid .tag{letter-spacing:.01em}
.sect h2,.panel h2{font-size:44px;line-height:1.18;letter-spacing:-.028em}
.hf-t{letter-spacing:-.015em}
/* 본문 행간. text-wrap:pretty 가 마지막 줄에 한 낱말만 남는 것을 막는다. */
.hf-left p,.rv-head p,.faq-left p,.sub p,.c-brand p,.cols p,.rv-c blockquote{
  line-height:1.62;text-wrap:pretty}
.rv-head p{max-width:46ch}
.faq-left p{max-width:42ch}
.sub p{max-width:52ch}
/* 카드·표의 짧은 라틴 문구는 자간을 풀어 준다. 조이면 소문자가 붙어 보인다. */
.ac-in b,.cc b,.faq-list span,.fp,.pill,.book,.detail,.book-pill,.dark-pill,
.line-pill,.ghost-pill,.ct,.more,.c-h{letter-spacing:0}
.ac-in b,.cc b{line-height:1.3}
.cc.lead{letter-spacing:-.005em;line-height:1.45}
.ac-in em,.cc em,.cc i,.ac-p i{letter-spacing:0}
/* 숫자와 통화 기호는 폭이 고르게. $1,500 옆의 물결까지 같은 줄에 붙인다. */
.ac-p b,.cc em,.strip b,.rv-score b,.rv-n b{font-variant-numeric:tabular-nums;
  letter-spacing:-.01em}
.strip i{letter-spacing:.005em}
.lab{letter-spacing:.1em}
"""

EN_CSS_MOB = """
/* ── 영문 조판 레이어 ─────────────────────────────────────────────
   데스크탑 판과 같은 이유로 덮어쓴다. 375px 에서는 한 줄에 들어가는 글자 수가
   적어, 자간을 조이기보다 글자를 한 급 줄이는 편이 덜 답답하다. */
.page{word-break:normal;overflow-wrap:break-word;hyphens:none;-webkit-hyphens:none}
.page h1,.page h2,.page h3,.page h4{letter-spacing:-.018em;text-wrap:balance}
.hero-in h1{font-size:31px;line-height:1.16;letter-spacing:-.028em}
.sect h2,.panel h2{font-size:26px;line-height:1.2;letter-spacing:-.024em}
.foot h2{font-size:25px;line-height:1.2;letter-spacing:-.024em}
.hf-t{letter-spacing:-.012em}
.foot > p,.faq p,.rv-c blockquote,.cols p{line-height:1.62;text-wrap:pretty}
.tc-in b,.cc b,.faq-list span,.pill,.book,.detail,.book-pill,.dark-pill,
.line-pill,.ct,.c-h{letter-spacing:0}
.tc-in b,.cc b{line-height:1.3}
.cc.lead{letter-spacing:-.005em;line-height:1.4}
.tc-in em,.cc em,.cc i,.tc-p i{letter-spacing:0}
.tc-p b,.cc em,.strip b,.rv-score b,.rv-n b{font-variant-numeric:tabular-nums;
  letter-spacing:-.01em}
.strip i{letter-spacing:.005em}
"""

# ── 문안 ─────────────────────────────────────────────────────────────
# 긴 문자열이 먼저 와야 짧은 쪽이 안을 갉아먹지 않는다.
REPL = [
    # 히어로 제목 (데스크탑 / 모바일 줄바꿈이 다르다)
    ('<span class="thin">평생토록 기억에 남을 스노클링</span><br>지금, <em>오션스타</em>에서',
     '<span class="thin">Snorkel with wild sea turtles</span><br>off Waikiki, with <em>Oceanstar</em>'),
    ('평생토록 기억에<br>남을 스노클링<br>지금, <em>오션스타</em>에서',
     'Snorkel with wild sea<br>turtles off Waikiki,<br>with <em>Oceanstar</em>'),

    # 히어로 본문·신뢰 줄
    ('와이키키 앞바다에서 야생 바다거북을 만나는 한국어 스노클링 투어입니다. '
     '51인승 루프탑 보트로 이동하고 해양 전문 한국인 크루가 함께해, 수영을 못해도 '
     '참여할 수 있습니다. 거북이 관찰 100% 보장.',
     'Wild sea turtles off Waikiki, from a 51-seat rooftop boat. '
     'English-speaking crew swim beside you. Non-swimmers welcome.'),
    ('누적 리뷰 14,000+ · Since 2019 하와이 최초 개설',
     '14,000+ guest reviews. On the water since 2019.'),
    ('누적 리뷰 14,000+', '14,000+ guest reviews'),
    ('하와이 와이키키 거북이 스노클링 투어', 'Waikiki Turtle Snorkeling Tour'),

    (">Hawaii's Best Tour<", '>Hawaii\u2019s Best Tour<'),

    # 내비게이션
    ('class="lang-pill">EN<', 'class="lang-pill">KO<'),
    ('class="lang">EN<', 'class="lang">KO<'),
    ('고객후기', 'Reviews'),
    ('블로그', 'Blog'),
    ('내 예약 관리', 'Manage booking'),
    ('투어 예약하기', 'Book a tour'),
    ('바로 예약하기', 'Book a tour'),

    # 숫자 띠
    ('<i>하와이 최초 개설</i>', '<i>Running in Waikiki</i>'),
    ('<b>14,000+</b><i>누적 리뷰</i>', '<b>14,000+</b><i>Guest reviews</i>'),
    ('<i>거북이 관찰 보장</i>', '<i>Turtle sighting guarantee</i>'),
    ('<b>51인승</b><i>루프탑 보트</i>', '<b>51 seats</b><i>Rooftop boat</i>'),

    # 상품 섹션 머리
    ('투어 프로그램', 'Our tours'),
    ('오션스타 추천 프로그램', 'Tours we recommend'),
    ('당신의 완벽한 하와이 여행을 위한 최고의 선택', 'for your days in Hawaii'),
    ('>전체<', '>All<'),
    ('>콤보<', '>Combo<'),
    ('>프라이빗 단독<', '>Private charter<'),

    # 상품 이름 (긴 것부터)
    ('[단독] 프라이빗 와이키키 거북이 스노클링', '[Private] Waikiki Turtle Snorkeling'),
    ('선셋·와인 & 와이키키 거북이 스노클링', 'Sunset & Wine Turtle Snorkeling'),
    ('거북이 스노클링 + 패러세일링 / 제트스키', 'Turtle Snorkeling + Parasailing / Jet Ski'),
    ('거북이 스노클링 + 서핑', 'Turtle Snorkeling + Surf Lesson'),
    ('와이키키 거북이 스노클링', 'Waikiki Turtle Snorkeling'),
    ('>거북이 스노클링<', '>Turtle snorkeling<'),

    # 시간
    ('1부 07:30-11:30 · 2부 10:30-14:30', 'Session 1 07:30-11:30<br>Session 2 10:30-14:30'),
    ('픽업 포함 시간', 'Pickup included'),
    ('시즌별 시간 변동', 'Time varies by season'),
    ('패러/제트 9:30-2:00', 'Parasail / jet ski 09:30-14:00'),
    ('옵션·일정 커스터마이징', 'Options and schedule customizable'),
    ('[운영 시간 확정 필요]', '[operating hours to confirm]'),

    # 가격
    ('₩151,570', '$110'),
    ('₩206,690', '$150'),
    ('₩289,360', '$210'),
    ('₩2,066,850 ~', 'From $1,500'),
    # 서핑 원화값은 $190 을 환율로 환산한 것이라 끝자리가 계속 움직인다.
    # 달러로 쓰면 그 문제가 없으므로 영문판은 원값 $190 을 그대로 쓴다.
    ('₩261,018', '$190'),
    ('성인가 기준 (24개월 미만 무료)', 'Per adult. Under 24 months free.'),
    ('1~4인 기준 (인원별 상이) / 팀', 'Per team, 1-4 guests.'),
    ('[원화 정가 확정 필요]', '[child fare and capacity to confirm]'),
    ('진행 코스 보기', 'View details'),
    ('>예약하기 <', '>Book a tour <'),

    # 비교표
    ('상품 고르기', 'Compare'),
    ('다섯 가지 바다,', 'Five tours,'),
    ('당신에게 맞는 하나', 'one that fits your trip'),
    ('가장 많이 찾는', 'Most booked'),
    ('거북이 관찰 100% 보장', '100% turtle sighting guarantee'),
    ('해양 전문 한국인 크루', 'English-speaking ocean crew'),
    ('수영 못해도 참여 가능', 'Non-swimmers welcome'),
    ('해양 액티비티 4종', 'Four water activities'),
    ('선셋 크루즈 · 와인과 치즈보드', 'Sunset cruise with wine and cheese'),
    ('패러세일링 / 제트스키', 'Parasailing / jet ski'),
    ('서핑 강습', 'Surf lesson'),
    ('보트 단독 대관 · 옵션 커스터마이징', 'Whole boat to your group'),
    ('고르셨다면', 'Ready to book'),

    # 후기
    ('투어 리뷰', 'Reviews'),
    ('다녀오신 분들이', 'From the people'),
    ('직접 남긴 후기', 'who were on the boat'),
    ('구글에 남겨주신 후기에서 글과 별점을 그대로 옮겼습니다.\n        '
     '이름은 운영 중인 화면과 같은 규칙으로 가립니다.',
     'Star ratings and text are copied from Google exactly as written.\n        '
     'Names are masked the same way they are on the live site.'),
    ('Google 리뷰', 'Google reviews'),
    ('구글 맵 리뷰 <b>5,754</b>개 · 2026-09-16 기준',
     '<b>5,754</b> Google Maps reviews as of 2026-09-16'),
    ('구글 리뷰 전체 보기', 'Read all on Google'),
    ('웹사이트 리뷰 보기', 'Reviews on our site'),

    # 후기 본문. 원문은 그대로 두되 한국어 병기는 걷어낸다. 한국어로 쓰인 후기는
    # 옮기고 옮긴 글이라고 밝힌다.
    ("Amazing!! Didn't know it was a Korean boat experience and I wouldn't have had it "
     "any other way. The staff was so helpful with the dive! They took such good pictures "
     "and the ramen after was amazing 20/10 experience, Highly recommended. "
     "(스태프들이 너무 친절했고 사진도 잘 찍어주셨어요. 스노클링 후 먹은 컵라면은 정말 "
     "최고였습니다! 20/10점 만점!)",
     "Amazing!! The staff was so helpful with the dive! They took such good pictures "
     "and the ramen after was amazing. 20/10 experience, highly recommended."),
    ('Oceanstar boat and crew were great! Troy and Zoey were great with instructions! '
     'We saw lots of fishes and the turtles were huge! (오션스타 배와 크루들 모두 '
     '훌륭했습니다! 설명도 너무 잘해주셨고, 물고기도 많이 보고 거북이도 엄청 컸어요!)',
     'Oceanstar boat and crew were great! Troy and Zoey were great with instructions! '
     'We saw lots of fishes and the turtles were huge!'),
    ('가이드분이 너무 친절하셨고, 간식과 음료도 완벽하게 준비되어 있었어요. 거북이와 '
     '물고기들을 원 없이 보고 난 뒤 다같이 본 하와이의 일몰은 정말 최고였습니다. '
     '다음에도 무조건 다시 탈 거예요!',
     'Our guide was so kind, and the snacks and drinks were all ready for us. After '
     'seeing all the turtles and fish we could ask for, watching the sunset together '
     'was the best part. We will absolutely be back.'),
    ('Super fun time! The crew went above and beyond and made sure we had an incredible '
     'time... We saw so many turtles! 바다 위에서 먹은 간식도 정말 꿀맛이었습니다. 최고!',
     'Super fun time! The crew went above and beyond and made sure we had an incredible '
     'time... We saw so many turtles!'),
    ('<figcaption>지**********)<i>2026-03-28</i></figcaption>',
     '<figcaption>지**********<i>2026-03-28 · translated</i></figcaption>'),

    # 영상
    ('투어 영상', 'Video'),
    ('오션스타 투어를', 'See the tour'),
    ('영상으로 먼저 보기', 'before you book'),
    ('야노시호 · 추사랑 모녀가 다녀간 날', 'Shiho Yano and her daughter on board'),
    ('유튜브 야노시호 YanoShiho', 'YouTube · YanoShiho'),

    # FAQ
    ('가장 많이 주신 질문 여섯 가지입니다. 나머지도 FAQ 페이지에 전부 답해 뒀습니다.',
     'The six we are asked most. Everything else is answered in full on the FAQ page.'),
    ('자주 묻는 <span class="hl">질문</span>',
     'Questions we get <span class="hl">a lot</span>'),
    ('FAQ 전체 보기', 'See all FAQs'),
    ('수영을 전혀 못해도 참여할 수 있나요?', 'Can I join if I cannot swim at all?'),
    ('거북이를 정말 100% 볼 수 있나요?', 'What languages does the crew speak?'),
    ('아이들도 탈 수 있나요? 몇 살부터 가능한가요?',
     'Can children join? What is the minimum age?'),
    ('픽업은 어디서 하나요? 호텔까지 와주나요?',
     'Where is pickup? Do you come to my hotel?'),
    ('날씨가 나쁘면 어떻게 되나요?', 'What happens if the weather is bad?'),
    ('취소 및 환불 규정이 어떻게 되나요?', 'What is the cancellation and refund policy?'),

    # 푸터
    ('지금 바다로 나가 볼까요', 'Ready to get on the water?'),
    ('함께 즐기는 그룹 스노클링부터 우리 가족만의 프라이빗 투어까지, 오션스타와 함께하세요.',
     'From a shared boat with travelers from everywhere to a private charter '
     'for your family alone.'),
    ('인스타그램으로 문의하기', 'Ask us on Instagram'),
    ('카카오톡 채널로 문의하기', 'Ask us on KakaoTalk'),
    ('직접 방문한 하와이 맛집 추천', 'Where we eat in Honolulu'),
    ('하와이 한인 최초 거북이 스노클링 원조. 여행 플랫폼 8,000 리뷰 ·\n        '
     '구글 5,000 리뷰.',
     'Turtle snorkeling out of Kewalo Basin since 2019.\n        '
     '8,000 reviews across travel platforms, 5,000 on Google.'),
    ('오션스타 소개', 'About Oceanstar'),
    ('영업시간 · 연락처', 'Hours and contact'),
    ('하와이 현지 기준 월~토 09:00~17:00', 'Mon to Sat, 09:00-17:00 (HST)'),
    (' 위치</span>', ' Where to find us</span>'),
    ('구글 지도로 바로보기', 'Open in Google Maps'),
    ('사업자 정보', 'Business details'),
    ('상호명: Oceanview Activity LLC', 'Company: Oceanview Activity LLC'),
    ('사업장 소재지: 615 PIKOI ST. STE 811', 'Registered address: 615 Pikoi St, Ste 811'),
    ('사업자 전화번호: 8083081792', 'Phone: +1 808-308-1792'),
    ('<p>8083081792</p>', '<p>+1 808-308-1792</p>'),

    # 링크와 대체 텍스트
    ('/kr/faq', '/en/faq'),
    ('/kr/restaurants', '/en/restaurants'),
    ('alt="와이키키 앞바다의 오션스타 보트, 왼쪽으로 와이키키 스카이라인과 오른쪽으로 다이아몬드헤드"',
     'alt="The Oceanstar boat off Waikiki, with the Waikiki skyline to the left '
     'and Diamond Head to the right"'),
    ('alt="사춘기 딸 vs 갱년기 엄마 위기의 하와이 모녀 여행"',
     'alt="Shiho Yano and her daughter on the Oceanstar boat"'),
    ('alt="오션스타"', 'alt="Oceanstar"'),
    ('alt="구글"', 'alt="Google"'),
    ('alt="마이리얼트립"', 'alt="MyRealTrip"'),
]


def build(src_name, out_name, en_css, title):
    src = io.open(os.path.join(HERE, src_name), encoding="utf-8").read()
    head, tail = src.split("</style>", 1)

    hits = 0
    for old, new in REPL:
        n = tail.count(old)
        if n:
            tail = tail.replace(old, new)
            hits += 1
    # 보드 이름은 캔버스에서 한글로 읽는다.
    head = re.sub(r"<title>[^<]*</title>", "<title>%s</title>" % title, head, count=1)
    head = head + en_css

    out = head + "</style>" + tail

    # 마크업에 한글이 남으면 옮기다 만 것이다. 번역한 후기의 작성자 표기만 남긴다.
    body = out.split("</style>", 1)[1]
    left = set(re.findall(r"[가-힣]+", body)) - {"지"}
    assert not left, "안 옮긴 한글: %s" % sorted(left)
    for ch in ("—", "–"):
        assert ch not in body, "대시 금지 규칙 위반: %r" % ch

    io.open(os.path.join(HERE, out_name), "w", encoding="utf-8").write(out)
    print("%-22s %7d bytes  치환 %d/%d" % (out_name, len(out), hits, len(REPL)))


build("SianB.dc.html", "SianB_EN.dc.html", EN_CSS_DESK, "시안 B · 드론 뷰 · 영문")
build("SianB_M.dc.html", "SianB_EN_M.dc.html", EN_CSS_MOB, "시안 B · 드론 뷰 · 영문 모바일")
