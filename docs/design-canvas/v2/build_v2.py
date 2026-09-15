# -*- coding: utf-8 -*-
"""2차 시안 2가지. 문구는 src/locales/ko.ts 그대로, 서체는 운영 중인 SUIT + Pretendard,
히어로는 Higgsfield로 만든 모션(애니메이션 WebP).
상품은 1부/2부를 합친 '와이키키 거북이 스노클링' 포함 5가지."""
import io

FONT_SLOT = "/*__FONTS__*//*__FONTS_END__*/"

TOKENS = FONT_SLOT + """
:root{
  --navy:#0a3f66; --primary:#0077a8; --primary-hover:#00648f;
  --cyan:#00a0d0; --sky:#6fd0ee; --badge:#e4f3fa;
  --surface:#ffffff; --soft:#f4fafd;
  --text:#44586a; --soft-text:#52697c; --muted:#7b8fa0; --on-navy:#a8cee2;
  --border:#e3edf4; --inner:#eef4f8; --outline:#bcdcec;
  /* 깊이 단계. 광원은 위에서 하나만 온다는 전제로, 모든 면이
     · 위쪽 1px 하이라이트 (빛 받는 모서리)
     · 가까운 접지 그림자 + 멀리 퍼지는 환경 그림자 2겹
     을 같이 갖는다. 한 겹짜리 그림자는 스티커처럼 납작해 보인다.
     그림자 색은 검정이 아니라 브랜드 파랑을 섞는다. */
  --lift:inset 0 1px 0 rgba(255,255,255,.92);
  --e1:0 1px 2px rgba(0,119,168,.06), 0 2px 6px rgba(0,119,168,.05);
  --e2:0 1px 2px rgba(0,119,168,.07), 0 8px 20px rgba(0,119,168,.10);
  --e3:0 2px 6px rgba(0,119,168,.09), 0 22px 44px rgba(0,119,168,.16);
  --e-navy:0 2px 6px rgba(10,63,102,.20), 0 22px 44px rgba(10,63,102,.28);
  /* 위가 밝고 아래가 살짝 가라앉는 면. 평평한 흰색은 종이, 이건 빛 받는 물체다. */
  --surface-lit:linear-gradient(180deg,#ffffff 0%,#f8fcfe 100%);
  --plane:linear-gradient(180deg,#ffffff 0%,#fbfdfe 6%,#f4fafd 16%,#f4fafd 100%);
  --sh-card:var(--e2);
  --sh-cta:0 2px 4px rgba(0,119,168,.24), 0 10px 22px rgba(0,119,168,.30);
  --sh-float:var(--e3);
  --sh-navy:var(--e-navy);
  --font-sans:'Pretendard', system-ui, sans-serif;
  --font-heading:'SUIT', system-ui, sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--surface);font-family:var(--font-sans);color:var(--text);
     word-break:keep-all;-webkit-font-smoothing:antialiased}
a{color:var(--primary);text-decoration:none}
a:hover{color:var(--primary-hover)}
h1,h2,h3,h4{margin:0;font-family:var(--font-heading);color:var(--navy);text-wrap:balance}
p{margin:0;text-wrap:pretty}
.hd{font-family:var(--font-heading)}
.num{font-variant-numeric:tabular-nums}
.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:12px;
     font-family:var(--font-sans);font-weight:700;cursor:pointer}
/* 채움 버튼은 눌리는 물건처럼 보이게: 위 하이라이트 + 아래 립 + 색 그림자 */
.btn-fill{background:var(--primary);color:#fff;
  box-shadow:var(--sh-cta), inset 0 1px 0 rgba(255,255,255,.26),
             inset 0 -2px 0 rgba(0,0,0,.16)}
.btn-fill:hover{background:var(--primary-hover)}
.btn-fill:active{transform:translateY(1px);
  box-shadow:0 1px 3px rgba(0,119,168,.28), inset 0 1px 0 rgba(255,255,255,.2)}
/* 테두리를 --outline(#bcdcec)으로 두면 흰 바탕에서 대비 1.3:1 이라 버튼이 글자만 떠
   있는 것처럼 보인다. 흰 배경 + 파랑 테두리로 윤곽을 세운다. */
.btn-line{background:#ffffff;color:var(--primary);border:1.5px solid var(--primary)}
.btn-line:hover{background:var(--badge)}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
"""

# ko.ts 문구
NAV = ["Home", "고객후기", "FAQ", "블로그"]
HERO = dict(
    badge="Hawaii's Best Tour",
    t1="평생토록 기억에 남을 스노클링",
    t2="지금, 오션스타에서",
    desc="함께 즐기는 그룹 스노클링부터 우리 가족만의 프라이빗 투어까지, 오션스타와 함께하세요.",
    cta="바로 예약하기", cta2="자세히 보기")
STATS = [("Since 2019", "최초"), ("14,000+", "리뷰"), ("100%", "거북이 보장"),
         ("51인승", "루프탑 보트")]
TOUR = dict(title="오션스타 추천 프로그램",
            subtitle="당신의 완벽한 하와이 여행을 위한 최고의 선택",
            book="예약하기", more="자세히 보기")

# 1부/2부를 하나로 합친 5가지.
# desc 와 feats 는 운영 중인 사이트의 카드 내용 그대로. feats 문구는 ko.ts
# tour.features / tour.details 에 들어 있는 문자열이다.
ADULT = "성인가 기준 (24개월 미만 무료)"
TOURS = [
    dict(img="turtle.jpg", badge="🌊 가장 인기있는 상품", hot=True,
         name="와이키키 거북이 스노클링",
         desc="와이키키 최고의 투어를 오션스타와 함께하세요. "
              "전문가의 안내로 안전하고 즐거운 시간을 보장합니다.",
         feats=["거북이 스노클링 + 해양 4종", "스노클 장비/구명조끼, 음료/간식",
                "1부 08:00 - 11:00", "2부 11:00 - 14:00"],
         price="₩151,570", sub=ADULT),
    dict(img="sunset.jpg", badge="🌅 로맨틱 선셋 뷰",
         name="선셋·와인 & 와이키키 거북이 스노클링",
         desc="와이키키 최고의 투어를 오션스타와 함께하세요. "
              "전문가의 안내로 안전하고 즐거운 시간을 보장합니다.",
         feats=["거북이 스노클링 + 해양 4종", "스노클 장비/구명조끼, 음료/간식",
                "치즈보드와 와인 제공", "시즌별 시간 변동"],
         price="₩206,690", sub=ADULT),
    dict(img="kayak.jpg", badge="✨ 프리미엄 투어",
         name="거북이 스노클링 + 패러세일링 / 제트스키",
         desc="거북이 스노클링과 함께 패러세일링 또는 제트스키를 짜릿하게 즐겨보세요.",
         feats=["거북이 스노클링 + 해양 4종", "스노클 장비/구명조끼, 음료/간식",
                "07:30 - 14:30"],
         price="₩289,360", sub=ADULT),
    dict(img="board.jpg", badge="🛥️ VVIP 단독 보트 대관", navy=True,
         name="[단독] 프라이빗 와이키키 거북이 스노클링",
         desc="배를 통째로 대여하여 프라이빗 하게 즐기는 스노클링 투어. "
              "우리끼리 즐기는 여유로운 시간과 특별한 추억.",
         feats=["우리 일행 단독 탑승 (최대 30인)", "원하는 옵션 커스터마이징 가능",
                "인원수 연동 맞춤형 요금 적용"],
         price="₩2,066,850 ~", sub="1~4인 기준 (인원별 상이) / 팀"),
    dict(img="surf.jpg", badge="커플/신혼 여행객 추천!",
         name="거북이 스노클링 + 서핑",
         desc="거북이 스노클링에 와이키키 명물 서핑 강습까지 한번에 즐기는 구성입니다.",
         feats=["거북이 스노클링 + 서핑 강습", "스노클 장비/구명조끼, 음료/간식",
                "[운영 시간 확정 필요]"],
         price="₩261,018", sub="[원화 정가 확정 필요]"),
]


def page(title, style, body):
    return """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>%s</title>
  <style>%s%s</style>
</helmet>
%s
</x-dc>
</body>
</html>
""" % (title, TOKENS, style, body)
