# -*- coding: utf-8 -*-
"""상세페이지(한국어) 보드. 데스크탑 1440 · 모바일 375.

문안은 _detail_ko.py 에 모아 두었다(운영 중인 OTA 상세페이지에서 그대로 옮김).
꼴은 시안 B 와 같은 토큰·활자·모서리 값을 쓴다.

2차 정리에서 고친 것 (taste 점검)
  1. 여덟 섹션이 전부 가운데 정렬이라 결이 하나였다. 머리를 왼쪽으로 내리고,
     인증샷과 맺음만 가운데로 남겨 대비를 만들었다.
  2. 알약(눈썹)이 히어로 포함 넷이었다. 히어로 하나만 남겼다.
  3. '2단 카드 줄'이 특장점·일정·다른 상품 세 번 나왔다. 특장점은 폭이 다른
     여섯 칸 벤토로, 일정의 픽업 안내는 카드를 걷고 실선 두 줄로 바꿨다.
  4. 사진이 히어로 하나뿐이었다. 저장소에 있던 실촬영본을 찾아 히어로를 바꾸고
     특장점 세 칸에 넣었다.
  5. 움직임이 없었다. 랜딩과 같은 .rise 스크롤 연출을 넣었다(감속 선호 시 정지).
"""
import importlib, io, os, re
import _detail_ko as C   # build 루프에서 상품마다 바꿔 끼운다

HERE = os.path.dirname(os.path.abspath(__file__))

# 사진은 코스 소개에만 쓴다. 특장점과 일정 안내는 글만 남는다 — 같은 사진을
# 여러 곳에 두면 아래로 내려갈수록 본 것을 또 보게 된다.
# key -> ("img", [(파일, 대체문안), ...]) 또는 ("icon", 아이콘 이름)
# 출처가 섞여 있어 적어 둔다.
#   course_van.webp   힉스필드(GPT Image 2.5)로 만든 이미지다. 실제 차량
#                     사진이 아니고, public/logo.png 를 참조로 넣어 로고를
#                     입혔다. 원본 로고와 대조해 글자·거북이·불가사리가
#                     맞는 것을 골랐다. 실사진이 생기면 바꿔야 한다.
#   course_snack.webp 운영자가 보낸 실사진(200px)을 힉스필드 outpaint 로
#                     16:9 까지 좌우를 늘렸다. 원본 영역 평균 오차 8/255,
#                     포장지 큰 글자는 원본과 같다.
CS_MEDIA = {
    "van":    ("img", [("course_van.webp",
                        "측면에 오션스타 로고를 붙인 흰색 포드 15인승 밴")]),
    "bowl":   ("img", [("course_snack.webp",
                        "와이키키 바다를 배경으로 든 컵라면과 팝타르트")]),
    "boat":   ("img", [("act_roof.webp",
                        "와이키키 앞바다에 정박한 오션스타 보트와 나무 루프탑")]),
    "turtle": ("img", [("turtle.jpg",
                        "모래바닥 산호 위에 모여 있는 푸른바다거북 무리")]),
    "sup2":   ("img", [("act_sup.webp",
                        "다이아몬드헤드를 배경으로 패들보드 위에 올라선 손님"),
                       ("act_kayak.webp",
                        "씨카약을 탄 두 사람 앞으로 지나가는 푸른바다거북")]),
    "dive":   ("img", [("act_dive.webp", "보트 위에서 바다로 뛰어드는 손님")]),
    # 선셋 상세
    "sup":    ("img", [("act_sup.webp",
                        "다이아몬드헤드를 배경으로 패들보드 위에 올라선 손님")]),
    "kayak":  ("img", [("act_kayak.webp",
                        "씨카약을 탄 두 사람 앞으로 지나가는 푸른바다거북")]),
    "sup_sunset": ("img", [("course_sup_sunset.webp",
                        "노을 진 바다 위 패들보드에 올라 두 팔을 든 손님")]),
    "wine":   ("img", [("course_wine.webp",
                        "체크 식탁보 위에 차린 살라미·치즈 보드와 과일, 케이크, 와인")]),
    # public/images/timeline/scooter.png. 저장소에 있던 파일인데 산호초 배경이라
    # 와이키키 실촬영본이 아니다. 실사진을 받으면 바꿔야 한다.
    "scooter": ("img", [("course_scooter.webp",
                         "씨두 스쿠터를 잡고 물속을 나아가는 스노클러")]),
    "photo":  ("img", [("act_photo.webp",
                        "다이아몬드헤드를 배경으로 뱃머리에 앉은 두 사람")]),
}


def fonts():
    s = io.open(os.path.join(HERE, "SianB.dc.html"), encoding="utf-8").read()
    return re.search(r'/\*__FONTS__\*/.*?/\*__FONTS_END__\*/', s, re.S).group(0)


def icon(path, size=18, sw=1.7, fill="none"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{path}</svg>')


I_ARROW = icon('<path d="M7 17L17 7M17 7H9M17 7v8"></path>', 15)
I_CLOCK = icon('<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.3V12l3.2 1.9"></path>')
I_STAR  = icon('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 '
               '5.8-.8z" fill="currentColor" stroke="none"></path>', 15)
I_PIN   = icon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>'
               '<circle cx="12" cy="10" r="2.6"></circle>', 20)
I_CHEV  = icon('<path d="M6 9.5l6 6 6-6"></path>', 20, 2)
I_SWIPE = icon('<path d="M4 12h15M14 7l5 5-5 5"></path>', 16, 2)
I_IG    = icon('<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"></rect>'
               '<circle cx="12" cy="12" r="4.1"></circle>'
               '<circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"></circle>', 26)
PERK_ICONS = {
    "van":    icon('<path d="M2.6 16.4V8.6a1 1 0 0 1 1-1h9.9v8.8H2.6z"></path>'
                   '<path d="M13.5 11h3.6l3.3 3.4v2h-6.9z"></path>'
                   '<circle cx="7" cy="16.6" r="2"></circle>'
                   '<circle cx="16.8" cy="16.6" r="2"></circle>', 24),
    "gear":   icon('<circle cx="7.8" cy="12" r="3.7"></circle>'
                   '<circle cx="16.2" cy="12" r="3.7"></circle>'
                   '<path d="M11.5 12h1M4.1 12H2.2M19.9 12h1.9"></path>', 24),
    "bowl":   icon('<path d="M3.4 10.6h17.2a8.6 8.6 0 0 1-17.2 0z"></path>'
                   '<path d="M8 7.6c0-1.2 1-1.6 1-2.7M12 7.3c0-1.4 1-1.8 1-3M16 7.6c0-1.2 1-1.6 1-2.7"></path>', 24),
    "turtle": icon('<path d="M4.6 13.4a6.6 5 0 0 1 13.2 0z"></path>'
                   '<path d="M3.4 13.4h15.6"></path><circle cx="19.6" cy="11.2" r="1.7"></circle>'
                   '<path d="M6.4 13.6l-1.6 3.2M15.8 13.6l1.6 3.2M9.2 8.9l1.9 4.5M13.3 8.9l-1.9 4.5"></path>', 24),
    "wine":   icon('<path d="M7.6 3.6h8.8l-.5 5.6a3.9 3.9 0 0 1-7.8 0z"></path>'
                   '<path d="M8 7.6h8"></path><path d="M12 13.1v6.9M8.6 20.4h6.8"></path>', 24),
    "sup":    icon('<path d="M3 18.6c4.4 1.5 13.6 1.5 18 0"></path><circle cx="11" cy="4.8" r="1.7"></circle>'
                   '<path d="M11 7.2v5.4l-2.6 4.4M11 12.6l2.6 4.4M8.6 9.6h4.8"></path>'
                   '<path d="M17.4 3.4l-2.6 14.2"></path>', 24),
    "guide":  icon('<circle cx="9" cy="7.4" r="3.2"></circle><path d="M3 20.2a6 6 0 0 1 12 0"></path>'
                   '<path d="M17.6 3.6v9.4M17.6 3.6h3.6l-1.2 2.1 1.2 2.1h-3.6"></path>', 24),
    "camera": icon('<path d="M3.6 8.6h3l1.5-2.1h5.8l1.5 2.1h3a1 1 0 0 1 1 1v7.8a1 1 0 0 1-1 1'
                   'h-14.8a1 1 0 0 1-1-1V9.6a1 1 0 0 1 1-1z"></path>'
                   '<circle cx="12" cy="13.2" r="3.4"></circle>', 24),
}


# ── 꼴 ────────────────────────────────────────────────────────────────
BASE = """
:root{
  --ink:#101418; --paper:#F6F5F2; --soft:#EFEDE8; --sky:#7FD4E8; --sea:#1E9DC4;
  --deep:#0D5C7A; --food:#D2591A;
  /* 흰 글씨를 얹는 색 띠용. --sea 위 흰 글씨는 3.15:1, --food 위는 4.05:1 로
     둘 다 AA 미달이라 같은 계열에서 한 단계씩 눌러 둔 값이다(4.83 / 4.66). */
  --sea-d:#177B9C; --food-d:#C45014;
  --sky-2:#A8E5F2;
  --text:#4A4F55; --muted:#646A70; --line:#E2E0DA;
  --e1:0 2px 8px rgba(16,20,24,.05), 0 16px 40px rgba(16,20,24,.08);
  --e2:0 8px 22px rgba(16,20,24,.10), 0 30px 70px rgba(16,20,24,.16);
}
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,h4,p,dl,dt,dd,figure,blockquote,ul,li{margin:0;padding:0}
ul{list-style:none}
a{text-decoration:none;color:inherit}
img{display:block;max-width:100%}
svg{flex:none}
.n{font-variant-numeric:tabular-nums}
.page{background:var(--paper);color:var(--text);
  font-family:'Pretendard',system-ui,sans-serif;word-break:keep-all;
  -webkit-font-smoothing:antialiased}
h1,h2,h3,h4{font-family:'SUIT',system-ui,sans-serif;color:var(--ink);letter-spacing:-.035em}
.hl{color:var(--sea-d)}

/* 알약 */
.pill{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 16px;
  border-radius:999px;background:#fff;border:1px solid var(--line);
  font-size:14.5px;font-weight:700;color:var(--ink)}
.book-pill{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 10px 0 22px;
  border-radius:999px;background:var(--ink);color:#fff;font-size:15.5px;font-weight:700}
.book-pill svg{width:30px;height:30px;padding:7px;border-radius:50%;background:#fff;
  color:var(--ink);box-sizing:border-box}
.book-pill.light{background:#fff;color:var(--ink)}
.book-pill.light svg{background:var(--ink);color:#fff}

"""

CSS_D = BASE + """
.page{width:1440px;--pad:76px}
.sect{padding:112px var(--pad) 0}
.center{text-align:center}

/* 섹션 머리. 왼쪽에 놓는다. 여덟 섹션이 모두 가운데였을 때는 어느 섹션을
   보고 있는지 결이 구분되지 않았다. 가운데는 인증샷과 맺음에만 남겼다. */
.sh{max-width:760px}
.sh h2{font-size:46px;line-height:1.24}
.sh .lede{margin-top:16px;font-size:18px;line-height:1.8;color:var(--text);max-width:52ch}
.center .sh{max-width:none}
.center .sh .lede{margin-left:auto;margin-right:auto}

/* 히어로 — 사진 띠 위에 내비, 글은 왼쪽 아래. 그 아래로 예약 패널이 걸친다.
   랜딩 히어로가 가운데 정렬이라 상세까지 같으면 두 장이 똑같아 보인다. */
.hero{position:relative;height:620px;overflow:hidden;background:var(--ink)}
.hero-img{position:absolute;left:0;right:0;top:-6%;width:100%;height:112%;object-fit:cover}
.veil{position:absolute;inset:0;background:linear-gradient(104deg,
  rgba(9,16,22,.80) 0%,rgba(9,16,22,.58) 34%,rgba(9,16,22,.24) 62%,rgba(9,16,22,.42) 100%)}
.nav{position:absolute;left:var(--pad);right:var(--pad);top:26px;z-index:5;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
.logo{height:44px;width:auto;filter:brightness(0) invert(1)}
.menu{display:flex;gap:4px;align-items:center;background:rgba(255,255,255,.16);
  border-radius:999px;padding:5px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.menu a{display:inline-flex;align-items:center;height:36px;padding:0 17px;border-radius:999px;
  font-size:14.5px;font-weight:600;color:rgba(255,255,255,.88)}
.menu a.on{background:#fff;color:var(--ink);font-weight:700}
.nav-r{display:flex;gap:10px;align-items:center;justify-self:end}
.lang-pill{display:inline-flex;align-items:center;height:46px;padding:0 20px;border-radius:999px;
  border:1px solid rgba(255,255,255,.44);color:#fff;font-size:14px;font-weight:700;letter-spacing:.06em}
.nav-r .book-pill{background:#fff;color:var(--ink)}
.nav-r .book-pill svg{background:var(--ink);color:#fff}
.hero-in{position:absolute;left:var(--pad);top:196px;z-index:3;color:#fff;max-width:720px}
.eyebrow{display:inline-flex;align-items:center;height:32px;padding:0 18px;border-radius:999px;
  background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.34);
  font-size:14px;font-weight:600;color:#fff;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in h1{margin-top:22px;font-size:68px;line-height:1.14;color:#fff;font-weight:800}
.hero-in h1 .hl{color:var(--sky)}
.hero-in .rev{display:inline-flex;align-items:center;gap:9px;margin-top:24px;height:38px;
  padding:0 18px;border-radius:999px;background:rgba(16,20,24,.5);color:#fff;
  font-size:15px;font-weight:700;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in .rev svg{color:var(--sky)}

/* 예약 패널 */
.buy{position:relative;z-index:6;margin:-104px var(--pad) 0;padding:34px 38px;
  background:#fff;border-radius:22px;box-shadow:var(--e2);
  display:grid;grid-template-columns:1fr 344px;gap:0 44px;align-items:center}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:18px 34px}
.facts div{display:flex;flex-direction:column;gap:4px}
.facts dt{font-size:13px;font-weight:800;letter-spacing:.05em;color:var(--muted)}
.facts dd{font-size:17px;font-weight:700;color:var(--ink);line-height:1.45}
.buy-r{padding-left:38px;border-left:1px solid var(--line)}
.buy-r .amt{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:42px;
  font-weight:800;color:var(--ink);line-height:1;letter-spacing:-.03em}
.buy-r .amt-s{display:block;margin-top:8px;font-size:14.5px;color:var(--text)}
.buy-r .book-pill{margin-top:18px;width:100%;justify-content:space-between;height:54px;
  padding:0 10px 0 24px;font-size:16.5px}
.pure{grid-column:1 / -1;margin-top:26px;padding-top:20px;border-top:1px solid var(--line);
  display:flex;align-items:flex-start;gap:9px;font-size:15px;line-height:1.75;color:var(--text)}
.pure svg{color:var(--sea);margin-top:1px}

/* 포함 사항 — 한 장짜리 띠를 칸으로 나눈다. 카드로 띄울 위계가 아니다. */
.inc{margin-top:40px;display:grid;grid-template-columns:repeat(4,1fr);
  background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden}
.inc-c{padding:34px 30px}
.inc-c + .inc-c{border-left:1px solid var(--line)}
.inc-c .ic{display:flex;align-items:center;justify-content:center;width:50px;height:50px;
  border-radius:14px;background:var(--soft);color:var(--sea)}
.inc-h{display:flex;flex-direction:column;align-items:flex-start;gap:18px}
.inc-c h3{font-size:21px;line-height:1.35}
.inc-c p{margin-top:12px;font-size:16px;line-height:1.8;color:var(--text)}

/* 선셋 — 상품 소개 글과 사진을 나란히, 하이라이트 여섯 칸은 3열 두 줄. */
.intro{display:grid;grid-template-columns:1fr 460px;gap:0 64px;align-items:center}
.intro .sh{max-width:none}
.intro-ph img{display:block;width:100%;aspect-ratio:4 / 3;object-fit:cover;border-radius:22px}
.hl-h{margin-top:56px;font-size:26px;line-height:1.3}
.hl-h + .inc{margin-top:22px}
.inc.n6{grid-template-columns:repeat(3,1fr)}
.inc.n6 .inc-c{border-left:1px solid var(--line);border-top:1px solid var(--line)}
.inc.n6 .inc-c:nth-child(3n+1){border-left:0}
.inc.n6 .inc-c:nth-child(-n+3){border-top:0}
.pnotes{margin-top:26px;display:grid;gap:10px}
.pnotes li{font-size:16px;line-height:1.75;color:var(--ink);font-weight:600}
.hero.sunset .hero-in h1 .hl{color:#FFC08A}

/* 6가지 특장점 — 폭이 다른 여섯 칸. 줄마다 3+3 / 6 / 4+2 / 6 으로 갈라 같은
   리듬이 반복되지 않게 했다. 칸 꼴은 여섯이 같고, 리듬은 폭과 사진 유무로
   만든다(진한 채움과 강조선은 운영자 의견으로 뺐다). */
.feats{margin-top:40px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.ft{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);
  border-radius:22px;overflow:hidden}
.ft.w2{grid-column:span 2} .ft.w3{grid-column:span 3}
.ft.w4{grid-column:span 4} .ft.w6{grid-column:span 6}
/* 좁은 칸은 옆의 사진 칸 높이까지 늘리지 않는다. 늘리면 글 아래가 300px
   가까이 비어 버린다. 높이를 달리 두는 것이 벤토의 결이기도 하다. */
.ft.w2{align-self:start}
.ft-b{padding:30px 32px 32px}
/* 폭을 다 쓰는 칸은 글줄이 1,200px 를 넘어 읽기 어렵다. 머리와 본문을
   두 기둥으로 갈라 글줄을 잡아 준다. */
.ft.w6 .ft-b{display:grid;grid-template-columns:360px 1fr;gap:0 60px;align-items:start}
.ft.w6 .ft-t > p:first-child{margin-top:5px}
.ft .no{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;
  padding:0 10px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:15px;font-weight:800;color:var(--deep)}

.ft h3{margin-top:16px;font-size:25px;line-height:1.3}
.ft .sub{margin-top:8px;font-size:16.5px;font-weight:700;color:var(--deep)}
.ft p{margin-top:16px;font-size:16.5px;line-height:1.8;color:var(--text)}
.ft .em{margin-top:16px;font-size:16.5px;line-height:1.8;font-weight:700;color:var(--deep)}

/* 투어 시간 — 머리를 왼쪽에 세우고 표를 오른쪽에 둔다. 오른쪽 칸이 실제
   내용(주간 표)이라 머리와 설명만 갈라놓는 짜임이 아니다. */
.time{display:grid;grid-template-columns:340px 1fr;gap:72px;align-items:start}
.week{border-radius:18px;overflow:hidden;border:1px solid var(--line);background:#fff}
.wrow{display:grid;grid-template-columns:repeat(7,1fr)}
.whead span{padding:16px 0;text-align:center;font-size:15.5px;font-weight:700;color:var(--ink);
  background:var(--soft)}
.whead span:last-child{color:var(--muted)}
.slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  min-height:74px;color:#fff;text-align:center}
.slot b{font-size:15px;font-weight:700}
.slot em{font-style:normal;font-size:17.5px;font-weight:800;letter-spacing:-.01em;
  font-variant-numeric:tabular-nums}
.slot.sea{background:var(--sea-d)}
.slot.deep{background:var(--deep)}
.slot.food{background:var(--food-d)}
.rest{display:flex;align-items:center;justify-content:center;font-size:14px;
  font-weight:700;color:var(--muted);background:var(--soft)}
.tnote{margin-top:22px;display:flex;align-items:flex-start;gap:10px;padding:18px 22px;
  border-radius:14px;background:#fff;border:1px solid var(--line);
  font-size:15.5px;line-height:1.8;color:var(--text)}
.tnote svg{color:var(--sea);margin-top:2px}
.tlist{margin-top:34px}
.tlist li{position:relative;padding-left:17px;font-size:15.5px;line-height:1.9;color:var(--muted)}
.tlist li::before{content:"";position:absolute;left:2px;top:12px;width:4px;height:4px;
  border-radius:50%;background:var(--muted)}

/* 일정 — 차례만 한 줄에 둔다. 앞 판은 단계마다 사진이 있거나 없어 결이
   어긋났다. 사진과 설명은 바로 아래 코스 소개로 옮기고 여기는 한눈에 보는
   차례만 남긴다.
   알약을 흘려 두면 1,288px 에서 여덟 개 + 한 개로 끊겨 '호텔 복귀'가 다음
   줄에 홀로 떨어졌다. 아홉 칸 격자라 늘 한 줄이고, 긴 이름은 칸 안에서
   두 줄로 접힌다. 양 끝(픽업·복귀)만 채워 뭍과 바다를 가른다. */
.hops{position:relative;margin-top:44px;display:grid;grid-template-columns:repeat(9,1fr)}
/* 첫 점 중심(1/18)에서 끝 점 중심(17/18)까지 */
.hops::before{content:"";position:absolute;left:5.56%;right:5.56%;top:14px;height:2px;
  background:var(--line)}
.hop{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;
  padding:0 6px;text-align:center}
.hop-d{display:flex;align-items:center;justify-content:center;width:30px;height:30px;
  border-radius:50%;background:#fff;border:3px solid var(--line)}
.hop.anchor .hop-d{background:var(--deep);border-color:var(--deep);color:#fff}
.hop.anchor .hop-d svg{width:14px;height:14px}
.hop-l{font-size:16px;font-weight:700;line-height:1.45;color:var(--ink)}
.hnote{margin-top:34px;padding-top:22px;border-top:1px solid var(--line);
  font-size:16px;line-height:1.75;font-weight:700;color:var(--ink)}

/* 코스 소개 — 운영 중인 OTA 의 코스 소개를 옮겼다. 번호·글·사진 세 칸이고
   줄은 실선으로만 가른다(카드로 띄울 위계가 아니다).
   사진 칸은 모든 단계가 300x169 로 같다. 사진이 없는 단계(밴·간식)는 빈칸
   대신 같은 크기의 아이콘 타일이 들어가, 어떤 줄은 있고 어떤 줄은 없는 결이
   생기지 않는다. 실사진을 받으면 그 자리에 바꿔 넣으면 된다. */
.cs{margin-top:40px;border-top:1px solid var(--line)}
.cs-s{display:grid;grid-template-columns:38px 1fr 300px;gap:0 32px;align-items:start;
  padding:34px 0;border-bottom:1px solid var(--line)}
.cs-h{display:contents}
.cs-n{display:inline-flex;align-items:center;justify-content:center;
  width:38px;height:38px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:14.5px;font-weight:800;color:var(--deep)}
.cs-ht{grid-column:2;grid-row:1}
.cs-ht h3{display:inline;font-size:22px;line-height:1.4}
.cs-t{display:inline-flex;align-items:center;vertical-align:4px;margin-left:12px;height:30px;
  padding:0 12px;border-radius:999px;background:var(--soft);
  font-size:14px;font-weight:700;color:var(--deep)}
.cs-b{grid-column:2;grid-row:2}
.cs-b p{margin-top:14px;font-size:16.5px;line-height:1.85;color:var(--text)}
.cs-note{margin-top:16px;padding-left:14px;border-left:3px solid var(--sky);
  font-size:15.5px;line-height:1.8;color:var(--muted)}
.cs-m{grid-column:3;grid-row:1 / span 2;width:300px;aspect-ratio:16 / 9;
  border-radius:14px;overflow:hidden;background:var(--soft)}
.cs-m img{width:100%;height:100%;object-fit:cover}
.cs-m.two{display:grid;grid-template-columns:1fr 1fr;gap:3px;background:var(--line)}
.cs-m.ic{display:flex;align-items:center;justify-content:center;color:var(--deep);
  border:1px solid var(--line)}
.cs-m.ic svg{width:48px;height:48px}

/* 인증샷 — 이 섹션과 맺음만 가운데다. 계속 왼쪽이면 결이 또 하나가 된다. */
.stars{margin-top:40px;display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.star-c{border-radius:18px;overflow:hidden;background:#fff;border:1px solid var(--line)}
.star-c img{width:100%;aspect-ratio:132 / 137;object-fit:cover}
.star-c b{display:block;padding:15px 14px;font-size:15px;font-weight:700;color:var(--ink);
  text-align:center;line-height:1.4}
.ig{margin-top:26px;text-align:center;font-size:15px;font-weight:700;color:var(--muted)}

/* 다른 상품 */
.more{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mc{display:grid;grid-template-columns:250px 1fr;background:#fff;border:1px solid var(--line);
  border-radius:22px;overflow:hidden}
.mc img{width:100%;height:100%;object-fit:cover}
.mc .tx{padding:32px 34px;display:flex;flex-direction:column;justify-content:center}
.mc h3{font-size:26px;line-height:1.3}
.mc p{margin-top:11px;font-size:16.5px;line-height:1.75;color:var(--text)}
.mc .go{margin-top:12px;display:inline-flex;align-items:center;min-height:44px;gap:7px;
  font-size:15px;font-weight:700;color:var(--deep)}

/* 맺음 + 푸터 — 랜딩(SianB)과 같은 한 덩어리다. 맺음 띠가 곧 푸터의 머리라
   어두운 면이 둘로 끊기지 않는다.
   어두운 면의 밝은 글자는 얇게 보여서 굵기를 600 으로 올려 둔다(랜딩과 동일). */
.foot{margin-top:112px;background:var(--ink);color:#fff;padding:76px var(--pad) 40px;
  -webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}
.end{text-align:center}
.end h2{font-size:42px;color:#fff}
.end p{margin-top:14px;font-size:18px;line-height:1.8;color:rgba(255,255,255,.76)}
.end .book-pill{margin-top:26px}
.cols{display:grid;grid-template-columns:1.5fr 1fr 1fr 1.1fr;gap:40px;
  margin-top:72px;padding:48px 0 40px;border-top:1px solid rgba(255,255,255,.18)}
.f-logo{height:42px;width:auto;filter:brightness(0) invert(1)}
.c-brand p{margin-top:16px;max-width:330px;font-size:15.5px;font-weight:600;line-height:1.85}
.c-h{display:flex;align-items:center;gap:8px;margin-bottom:16px;
  font-size:15px;font-weight:700;color:#fff}
.c-h svg{color:var(--sky)}
.cols p{font-size:15.5px;font-weight:600;line-height:1.9}
.f-more{display:inline-flex;align-items:center;gap:7px;margin-top:16px;min-height:44px;
  font-size:14.5px;font-weight:700;color:#fff}
.f-bot{display:flex;align-items:center;gap:20px;padding-top:26px;
  border-top:1px solid rgba(255,255,255,.18);
  font-size:14px;font-weight:600;color:rgba(255,255,255,.9)}

/* ── 스크롤 연출. 랜딩과 같은 값이다. 긴 페이지에서 섹션이 차례로 놓이는
   것을 알리는 목적이고, 감속을 선호하면 전부 정지한다. ───────────── */
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    .rise{animation-name:rise;animation-timeline:view();animation-fill-mode:both;
      animation-timing-function:cubic-bezier(.22,.61,.36,1);
      animation-range:entry 6% cover 30%}
    @keyframes rise{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
    .hero-img{animation:pan linear both;animation-timeline:view();
      animation-range:cover 0% cover 100%}
    @keyframes pan{from{transform:translateY(2.4%)}
                   to{transform:translateY(-2.4%)}}
  }
}
"""

CSS_M = BASE + """
/* 375 폭을 기준으로 다시 짰다. 본문 16px 아래로는 내려가지 않는다.
   앞 판은 데스크탑 값을 줄여 온 것이라 본문이 13.5px, 이름표가 10.5px 까지
   내려가 손에 들고는 읽히지 않았다. 여기서는 읽히는 크기를 먼저 정하고
   그 크기가 들어가도록 짜임을 바꿨다(주간 표·인증샷·포함사항). */
.page{width:375px;--pad:22px}
.sect{padding:72px var(--pad) 0}
.center{text-align:center}
.sh h2{font-size:32px;line-height:1.28}
.sh .lede{margin-top:14px;font-size:16.5px;line-height:1.78;color:var(--text)}

.hero{position:relative;height:524px;overflow:hidden;background:var(--ink)}
.hero-img{position:absolute;left:0;right:0;top:-6%;width:100%;height:112%;object-fit:cover}
.veil{position:absolute;inset:0;background:linear-gradient(170deg,
  rgba(9,16,22,.60) 0%,rgba(9,16,22,.36) 32%,rgba(9,16,22,.50) 64%,rgba(9,16,22,.80) 100%)}
.nav{position:absolute;left:var(--pad);right:var(--pad);top:16px;z-index:5;
  display:flex;align-items:center;justify-content:space-between}
.logo{height:36px;width:auto;filter:brightness(0) invert(1)}
.nav-r{display:flex;gap:8px;align-items:center}
.lang{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;
  border-radius:50%;background:rgba(255,255,255,.92);color:var(--ink);font-size:13.5px;
  font-weight:800;letter-spacing:.04em}
.burger{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;
  border-radius:50%;background:rgba(255,255,255,.22);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in{position:absolute;left:var(--pad);right:var(--pad);top:146px;z-index:3;color:#fff}
.eyebrow{display:inline-flex;align-items:center;min-height:34px;padding:6px 15px;
  border-radius:999px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.34);
  font-size:13.5px;font-weight:600;color:#fff;line-height:1.45;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in h1{margin-top:16px;font-size:40px;line-height:1.2;color:#fff;font-weight:800}
.hero-in h1 .hl{color:var(--sky)}
.hero-in .rev{display:inline-flex;align-items:center;gap:8px;margin-top:18px;min-height:40px;
  padding:7px 16px;border-radius:999px;background:rgba(16,20,24,.52);color:#fff;
  font-size:13.5px;font-weight:700;line-height:1.45;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in .rev svg{color:var(--sky)}

/* 값과 버튼이 먼저다. 마크업은 데스크탑 순서로 두고 여기서만 뒤집는다. */
.buy{position:relative;z-index:6;margin:-62px var(--pad) 0;padding:26px 22px;background:#fff;
  border-radius:22px;box-shadow:var(--e2);display:flex;flex-direction:column}
.buy-r{order:1}
.facts{order:2}
.pure{order:3}
.buy-r .amt{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:38px;font-weight:800;
  color:var(--ink);line-height:1;letter-spacing:-.03em}
.buy-r .amt-s{display:block;margin-top:9px;font-size:14.5px;color:var(--text)}
.buy-r .book-pill{margin-top:18px;width:100%;justify-content:space-between;height:58px;
  padding:0 10px 0 24px;font-size:16.5px}
.buy-r .book-pill svg,.end .book-pill svg{width:36px;height:36px;padding:9px}
.facts{margin-top:24px;padding-top:22px;border-top:1px solid var(--line);
  display:grid;grid-template-columns:1fr;gap:15px}
.facts div{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
.facts dt{font-size:14px;font-weight:700;color:var(--muted);flex:none}
.facts dd{font-size:15.5px;font-weight:700;color:var(--ink);line-height:1.5;text-align:right}
.pure{margin-top:20px;padding-top:18px;border-top:1px solid var(--line);display:flex;
  align-items:flex-start;gap:9px;font-size:14.5px;line-height:1.75;color:var(--text)}
.pure svg{color:var(--sea-d);margin-top:2px}

/* 포함 사항 — 아이콘을 제목 옆으로 옮겨 한 줄을 벌었다. 글자를 키우면
   아이콘 밑에 제목을 두는 앞 판은 칸마다 세로로 더 길어지기만 한다. */
.inc{margin-top:28px;display:grid;grid-template-columns:1fr;
  background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden}
.inc-c{padding:24px 22px 26px}
.inc-c + .inc-c{border-top:1px solid var(--line)}
.inc-h{display:flex;align-items:center;gap:14px}
.inc-c .ic{display:flex;align-items:center;justify-content:center;width:48px;height:48px;
  border-radius:14px;background:var(--soft);color:var(--sea-d);flex:none}
.inc-c h3{font-size:20.5px;line-height:1.35}
.inc-c p{margin-top:14px;font-size:16px;line-height:1.8;color:var(--text)}

/* 선셋 — 소개 사진은 글 아래로, 하이라이트는 짧은 글이라 2열로 접는다. */
.intro-ph{margin-top:22px}
.intro-ph img{display:block;width:100%;aspect-ratio:3 / 2;object-fit:cover;border-radius:18px}
.hl-h{margin-top:40px;font-size:22px;line-height:1.3}
.hl-h + .inc{margin-top:16px}
.inc.n6{grid-template-columns:1fr 1fr}
.inc.n6 .inc-c{padding:20px 16px 22px;border-top:1px solid var(--line);border-left:1px solid var(--line)}
.inc.n6 .inc-c:nth-child(2n+1){border-left:0}
.inc.n6 .inc-c:nth-child(-n+2){border-top:0}
.inc.n6 .inc-h{flex-direction:column;align-items:flex-start;gap:12px}
.inc.n6 .inc-c .ic{width:42px;height:42px;border-radius:12px}
.inc.n6 .inc-c h3{font-size:17.5px}
.inc.n6 .inc-c p{margin-top:8px;font-size:15px;line-height:1.65}
.pnotes{margin-top:20px;display:grid;gap:10px}
.pnotes li{font-size:15px;line-height:1.75;color:var(--ink);font-weight:600}
.hero.sunset .hero-in h1 .hl{color:#FFC08A}
/* 모바일 히어로 — 제목 묶음을 가운데로 모아 위로 올리고, 그 아래 빈 띠에
   사진의 주인공(선셋은 잔, 오전은 거북이 머리)이 가리지 않고 보이게 한다.
   덮개도 제목 뒤만 어둡고 그 아래는 옅다. */
.hero .hero-in{top:84px;text-align:center}
.hero .hero-in h1{margin-top:14px;font-size:36px}
.hero .hero-in .rev{margin-top:14px}
.hero .veil{background:linear-gradient(180deg,
  rgba(9,16,22,.66) 0%,rgba(9,16,22,.50) 40%,rgba(9,16,22,.30) 54%,rgba(9,16,22,.04) 66%,rgba(9,16,22,.24) 100%)}
/* 오전 사진(1440x617)은 세로가 모자라 그냥 덮으면 거북이 머리가 제목 뒤에 온다.
   사진을 조금 키워 머리(원본 y 360)를 제목 아래 띠(약 380px)로 내린다. */
.hero.turtle .hero-img{top:-3%;height:130%}

/* 375px 에 카드 여섯 장을 그대로 쌓으면 3,310px — 페이지의 31% 가 이 한
   섹션이고 넉 화면을 넘긴다. 제목 여섯 줄을 먼저 보이고 본문은 펼쳐 읽게
   바꿨다. <details> 라 스크립트 없이 열리고 키보드로도 다뤄진다.
   폭이 남는 데스크탑은 벤토 그대로다. */
.accs{margin-top:26px;background:#fff;border:1px solid var(--line);
  border-radius:20px;overflow:hidden}
.acc + .acc{border-top:1px solid var(--line)}
.acc > summary{display:flex;align-items:center;gap:14px;padding:20px;min-height:68px;
  cursor:pointer;list-style:none}
.acc > summary::-webkit-details-marker{display:none}
.acc .no{display:inline-flex;align-items:center;justify-content:center;
  width:36px;height:36px;border-radius:999px;background:var(--soft);flex:none;
  font-family:'SUIT',system-ui,sans-serif;font-size:14.5px;font-weight:800;color:var(--deep)}
.ac-t{flex:1;display:flex;flex-direction:column;gap:5px}
.ac-t b{font-family:'SUIT',system-ui,sans-serif;font-size:19px;font-weight:800;
  color:var(--ink);line-height:1.35;letter-spacing:-.035em}
.ac-t i{font-style:normal;font-size:14.5px;font-weight:700;color:var(--deep);line-height:1.45}
.acc .chev{display:flex;color:var(--muted);flex:none}
.acc[open] .chev{transform:rotate(180deg)}
.ac-b{padding:0 20px 24px}
.ac-b p{font-size:16px;line-height:1.85;color:var(--text)}
.ac-b p + p{margin-top:14px}
.ac-b .em{font-weight:700;color:var(--deep)}

/* 주간 표 — 375px 에 7칸 표를 밀어 넣으면 시각이 12.5px 까지 내려간다.
   회차를 줄로 세우고 요일은 알약 일곱 개로 옮겨, 읽을 값(시각)에 19px 를
   주고도 폭이 남는다. 데스크탑은 그대로 7칸 표다. */
.tdays{margin-top:26px;display:grid;gap:12px}
.trow{position:relative;overflow:hidden;background:#fff;border:1px solid var(--line);
  border-radius:18px;padding:20px 20px 18px 24px}
.trow::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px}
.trow.sea::before{background:var(--sea-d)}
.trow.deep::before{background:var(--deep)}
.trow.food::before{background:var(--food-d)}
.trow .th{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.trow b{font-family:'SUIT',system-ui,sans-serif;font-size:17.5px;font-weight:800;
  color:var(--ink);letter-spacing:-.03em}
.trow .tt{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.trow em{font-style:normal;font-size:19px;font-weight:800;color:var(--ink);
  letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.dchips{margin-top:16px;display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.dchips span{display:flex;align-items:center;justify-content:center;height:34px;
  border-radius:10px;background:var(--soft);color:var(--muted);font-size:14px;font-weight:700}
.dchips span.on{background:var(--ink);color:#fff}
.tnote{margin-top:18px;display:flex;align-items:flex-start;gap:10px;padding:18px 20px;
  border-radius:16px;background:#fff;border:1px solid var(--line);
  font-size:14.5px;line-height:1.8;color:var(--text)}
.tnote svg{color:var(--sea-d);margin-top:2px}
.tlist{margin-top:18px}
.tlist li{position:relative;padding-left:17px;font-size:14.5px;line-height:1.9;color:var(--muted)}
.tlist li::before{content:"";position:absolute;left:2px;top:12px;width:4px;height:4px;
  border-radius:50%;background:var(--muted)}

/* 일정 — 데스크탑의 가로 레일을 세로로 세운다. 알약을 흘려 두면 다섯 줄로
   접히면서 화살표가 줄 끝과 줄 머리에 걸려 차례가 흐려졌다. 사진이 없으니
   한 단계가 44px 한 줄이다. */
.hops{position:relative;margin-top:24px;display:grid}
.hops::before{content:"";position:absolute;left:12px;top:22px;bottom:22px;width:2px;
  background:var(--line)}
.hop{position:relative;display:flex;align-items:center;gap:14px;min-height:44px}
.hop-d{display:flex;align-items:center;justify-content:center;flex:none;
  width:26px;height:26px;border-radius:50%;background:#fff;border:3px solid var(--line)}
.hop.anchor .hop-d{background:var(--deep);border-color:var(--deep);color:#fff}
.hop.anchor .hop-d svg{width:12px;height:12px}
.hop-l{font-size:16px;font-weight:700;color:var(--ink)}
.hnote{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);
  font-size:15px;line-height:1.75;font-weight:700;color:var(--ink)}

/* 코스 소개 — 폰에서는 가로로 넘기는 카드다. 여덟 단계를 세로로 쌓으면
   이 섹션 하나가 3,276px 였다. 한 장은 292px 라 다음 카드가 45px 보여 옆으로
   넘길 수 있다는 것이 드러나고, 넘기면 카드 머리에 맞춰 멈춘다.
   카드가 넓어져 사진은 다시 위로 올리고(16:9), 04 의 두 장도 둘 다 보인다.
   아래 얇은 막대가 스크롤 위치를 보여 준다(iOS 는 넘길 때만 보인다). */
.cs-hint{display:flex;align-items:center;gap:6px;margin-top:10px;
  font-size:14px;font-weight:700;color:var(--muted)}
.cs-hint svg{width:16px;height:16px}
/* 카드 크기는 모두 같다(운영자 요청). 가로 그리드에 카드마다 subgrid 로 세 줄
   (사진 · 제목 · 본문)을 공유시켜, 폭·높이는 물론 제목 줄과 본문 시작점까지
   아홉 장이 같은 선에 선다. 제목이 두 줄인 카드가 있으면 그 줄이 다 같이 늘어난다. */
.cs{margin:22px calc(var(--pad) * -1) 0;padding:2px var(--pad) 16px;display:grid;
  grid-auto-flow:column;grid-auto-columns:292px;grid-template-rows:auto auto 1fr;gap:0 12px;
  overflow-x:auto;overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory;scroll-padding:0 var(--pad);
  -webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--deep) var(--line)}
.cs::-webkit-scrollbar{height:4px}
.cs::-webkit-scrollbar-track{margin:0 var(--pad);border-radius:4px;background:var(--line)}
.cs::-webkit-scrollbar-thumb{border-radius:4px;background:var(--deep)}
.cs-s{grid-row:span 3;display:grid;grid-template-rows:subgrid;scroll-snap-align:start;
  background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden}
/* 사진은 마크업상 제목 뒤에 있지만 카드 맨 위 줄에 놓는다. 높이는 못 박는다
   (292 x 9/16 = 164). */
.cs-m{grid-row:1;width:100%;height:164px;overflow:hidden;background:var(--soft)}
.cs-h{grid-row:2}
.cs-b{grid-row:3}
.cs-m img{display:block;width:100%;height:100%;object-fit:cover}
.cs-m.two{display:grid;grid-template-columns:1fr 1fr;gap:3px;background:var(--line)}
.cs-h{padding:18px 20px 0}
.cs-n{display:inline-flex;align-items:center;justify-content:center;
  width:32px;height:32px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:13px;font-weight:800;color:var(--deep)}
.cs-ht h3{margin-top:10px;font-size:18px;line-height:1.42}
.cs-t{display:inline-flex;align-items:center;margin-top:8px;height:28px;padding:0 11px;
  border-radius:999px;background:var(--soft);font-size:13.5px;font-weight:700;color:var(--deep)}
.cs-b{padding:0 20px 22px}
.cs-b p{margin-top:12px;font-size:15.5px;line-height:1.8;color:var(--text)}
.cs-note{margin-top:12px;padding-left:12px;border-left:3px solid var(--sky);
  font-size:14.5px;line-height:1.75;color:var(--muted)}

/* 인증샷 — 세 칸이면 이름표가 10.5px 여야 들어간다. 두 칸으로 줄이면 14px 가
   들어가고 얼굴도 알아볼 만해진다(사진 원본이 315px 라 두 칸이 제 크기다).
   열다섯이 두 칸에 홀로 남으므로 열여섯째를 인스타 칸으로 두었다. */
.stars{margin-top:26px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.star-c{border-radius:16px;overflow:hidden;background:#fff;border:1px solid var(--line)}
.star-c img{width:100%;aspect-ratio:132 / 137;object-fit:cover}
.star-c b{display:flex;align-items:center;justify-content:center;height:62px;padding:0 10px;
  font-size:14px;font-weight:700;color:var(--ink);text-align:center;line-height:1.45;
  text-wrap:balance}
.ig-c{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;
  padding:22px 14px;background:var(--deep);border-color:var(--deep);color:#fff;text-align:center}
.ig-c svg{color:#fff}
.ig-c b{display:block;height:auto;padding:0;font-size:14px;color:#fff;line-height:1.45;
  word-break:normal;overflow-wrap:break-word;letter-spacing:-.01em}
.ig-c span{font-size:14px;font-weight:700;color:var(--sky-2)}

.more{margin-top:26px;display:grid;grid-template-columns:1fr;gap:14px}
.mc{background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden}
.mc img{width:100%;height:196px;object-fit:cover}
.mc .tx{display:block;padding:24px 22px 26px}
.mc h3{font-size:23px;line-height:1.35}
.mc p{margin-top:10px;font-size:16px;line-height:1.75;color:var(--text)}
.mc .go{margin-top:8px;display:inline-flex;align-items:center;min-height:48px;gap:7px;
  font-size:15px;font-weight:700;color:var(--deep)}

.foot{margin-top:72px;background:var(--ink);color:#fff;padding:60px var(--pad) 30px;
  -webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}
.end{text-align:center}
.end h2{font-size:30px;color:#fff;line-height:1.32}
.end p{margin-top:14px;font-size:16px;line-height:1.8;color:rgba(255,255,255,.76)}
.end .book-pill{margin-top:24px;height:58px;padding:0 10px 0 24px;font-size:16.5px}
.cols{display:grid;gap:28px;margin-top:44px;padding-top:30px;
  border-top:1px solid rgba(255,255,255,.18)}
.f-logo{height:38px;width:auto;filter:brightness(0) invert(1)}
.c-brand p{margin-top:14px;font-size:15px;font-weight:600;line-height:1.85}
.c-h{display:flex;align-items:center;gap:8px;margin-bottom:12px;
  font-size:15.5px;font-weight:700;color:#fff}
.c-h svg{color:var(--sky)}
.cols p{font-size:15px;font-weight:600;line-height:1.9}
.f-more{display:inline-flex;align-items:center;gap:7px;margin-top:10px;min-height:44px;
  font-size:14.5px;font-weight:700;color:#fff}
.f-bot{margin-top:30px;padding-top:20px;border-top:1px solid rgba(255,255,255,.18);
  font-size:13.5px;font-weight:600;color:rgba(255,255,255,.88)}

/* 엄지가 닿는 자리에 값과 버튼을 붙여 둔다. 7,000px 가 넘는 페이지에서
   예약 버튼이 맨 위 카드와 맨 아래에만 있으면 중간에서는 닿을 곳이 없다. */
.dock{position:sticky;bottom:0;z-index:20;display:flex;align-items:center;
  justify-content:space-between;gap:14px;padding:12px 16px 14px;
  background:rgba(255,255,255,.95);border-top:1px solid var(--line);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
  box-shadow:0 -6px 24px rgba(16,20,24,.09)}
.dock .d-l{display:flex;flex-direction:column;gap:3px}
.dock .d-l b{font-family:'SUIT',system-ui,sans-serif;font-size:21px;font-weight:800;
  color:var(--ink);letter-spacing:-.03em;line-height:1}
.dock .d-l span{font-size:13px;font-weight:600;color:var(--muted)}
.dock .book-pill{height:52px;padding:0 8px 0 20px;font-size:15.5px}

@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    .rise{animation-name:rise;animation-timeline:view();animation-fill-mode:both;
      animation-timing-function:cubic-bezier(.22,.61,.36,1);
      animation-range:entry 4% cover 26%}
    @keyframes rise{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
    .hero-img{animation:pan linear both;animation-timeline:view();
      animation-range:cover 0% cover 100%}
    @keyframes pan{from{transform:translateY(2.2%)}to{transform:translateY(-2.2%)}}
  }
}
"""


# ── 조각 ─────────────────────────────────────────────────────────────
def nav(mobile):
    if mobile:
        return ('<header class="nav">'
                '<img src="logo_full.png" alt="오션스타" class="logo">'
                '<div class="nav-r"><a href="#" class="lang">EN</a>'
                '<a href="#" class="burger"><svg width="22" height="22" viewBox="0 0 24 24" '
                'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">'
                '<path d="M4 7h16M4 12h16M4 17h16"/></svg></a></div></header>')
    return ('<header class="nav">'
            '<img src="logo_full.png" alt="오션스타" class="logo">'
            '<div class="menu"><a href="#">Home</a><a href="#" class="on">투어</a>'
            '<a href="#">고객후기</a><a href="#">FAQ</a></div>'
            '<div class="nav-r"><a href="#" class="lang-pill">EN</a>'
            f'<a href="#" class="book-pill">투어 예약하기 {I_ARROW}</a></div></header>')


def sh(h2, lede=None, cls=""):
    """섹션 머리. 왼쪽 정렬이 기본이고, 가운데는 부모가 .center 일 때만."""
    l = f'<p class="lede">{lede}</p>' if lede else ""
    c = f" {cls}" if cls else ""
    return f'<header class="sh{c} rise"><h2>{h2}</h2>{l}</header>'


def hero(mobile):
    h = C.HERO
    src, alt = getattr(C, "HERO_IMG", ("hero_turtle.webp", "와이키키 앞바다 산호 위의 푸른바다거북"))
    if mobile and hasattr(C, "HERO_IMG_M"):
        src, alt = C.HERO_IMG_M
    theme = f" {C.THEME}" if hasattr(C, "THEME") else ""
    return f"""<section class="hero{theme}">
  <img src="{src}" alt="{alt}" class="hero-img">
  <span class="veil"></span>
  {nav(mobile)}
  <div class="hero-in">
    <span class="eyebrow">{h['eyebrow']}</span>
    <h1>{h['h1']}</h1>
    <span class="rev">{I_STAR} {h['badge']}</span>
  </div>
</section>
<section class="buy rise">
  <dl class="facts">{''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in h['facts'])}</dl>
  <div class="buy-r">
    <b class="amt n">{h['price']}</b>
    <span class="amt-s">{h['price_sub']}</span>
    <a href="#" class="book-pill">예약하기 {I_ARROW}</a>
  </div>
  <p class="pure">{I_CLOCK}<span>{h['pure']}</span></p>
</section>"""


def perks(mobile):
    """오전: 포함 사항 네 칸. 선셋: 상품 소개(글+사진) + 하이라이트 여섯 칸 + 안내 줄."""
    cells = "".join(
        f'<div class="inc-c"><div class="inc-h"><span class="ic">{PERK_ICONS[k]}</span>'
        f'<h3>{t}</h3></div><p>{b}</p></div>' for k, t, b in C.PERKS)
    grid = f'<div class="inc{" n6" if len(C.PERKS) == 6 else ""} rise">{cells}</div>'
    if not hasattr(C, "PERK_PHOTO"):
        return f'<section class="sect">{sh(C.PERKS_H2)}{grid}</section>'
    src, alt = C.PERK_PHOTO
    notes = "".join(f"<li>{x}</li>" for x in getattr(C, "PERK_NOTES", []))
    return (f'<section class="sect"><div class="intro">{sh(C.PERKS_H2, C.PERKS_LEDE)}'
            f'<figure class="intro-ph rise"><img src="{src}" alt="{alt}"></figure></div>'
            f'<h3 class="hl-h rise">{C.PERKS_SUB_H}</h3>{grid}'
            f'<ul class="pnotes rise">{notes}</ul></section>')


def features_m():
    """모바일 특장점. 제목 여섯 줄을 먼저 보이고 본문은 접는다.
    사진은 전부 일정으로 옮겼으므로 여기는 글만 남는다."""
    out = []
    for i, (no, t, sub, paras, em) in enumerate(C.FEATURES):
        body = "".join(f'<p>{x}</p>' for x in paras)
        if em:
            body += f'<p class="em">{em}</p>'
        out.append(
            f'<details class="acc"{" open" if i == 0 else ""}>'
            f'<summary><span class="no">{no}</span>'
            f'<span class="ac-t"><b>{t}</b><i>{sub}</i></span>'
            f'<span class="chev">{I_CHEV}</span></summary>'
            f'<div class="ac-b">{body}</div></details>')
    return (f'<section class="sect">{sh(C.FEAT_H2)}'
            f'<div class="accs rise">{"".join(out)}</div></section>')


def features(mobile):
    if mobile:
        return features_m()
    # 줄마다 폭을 달리한다. 3+3 / 6 / 4+2 / 6.
    SPAN = {"01": "w3", "02": "w3", "03": "w6", "04": "w4", "05": "w2", "06": "w6"}
    out = []
    for no, t, sub, paras, em in C.FEATURES:
        body = "".join(f'<p>{x}</p>' for x in paras)
        emx = f'<p class="em">{em}</p>' if em else ""
        out.append(f'<div class="ft {SPAN[no]} rise">'
                   f'<div class="ft-b">'
                   f'<div class="ft-h"><span class="no">{no}</span>'
                   f'<h3>{t}</h3><span class="sub">{sub}</span></div>'
                   f'<div class="ft-t">{body}{emx}</div></div></div>')
    return (f'<section class="sect">{sh(C.FEAT_H2)}'
            f'<div class="feats">{"".join(out)}</div></section>')


def week_m():
    """모바일 주간 표. 7칸 격자를 버리고 회차 한 줄 + 요일 알약 일곱 개로 둔다."""
    rows = []
    for name, lines, span, col in C.SLOTS:
        tm = "".join(f"<em>{x}</em>" for x in lines)
        chips = "".join(f'<span class="on">{d}</span>' if i < span else f"<span>{d}</span>"
                        for i, d in enumerate(C.DAYS))
        rows.append(f'<div class="trow {col}"><div class="th"><b>{name}</b>'
                    f'<span class="tt">{tm}</span></div>'
                    f'<div class="dchips">{chips}</div></div>')
    return f'<div class="tdays rise">{"".join(rows)}</div>'


def times(mobile):
    head = "".join(f"<span>{d}</span>" for d in C.DAYS)
    rows = [f'<div class="wrow whead">{head}</div>']
    for name, lines, span, col in C.SLOTS:
        tm = "".join(f"<em>{x}</em>" for x in lines)
        rest = (f'<span class="rest" style="grid-column:{span+1} / -1">'
                f'{getattr(C, "REST_LABEL", "휴무")}</span>' if span < 7 else "")
        rows.append(f'<div class="wrow"><div class="slot {col}" '
                    f'style="grid-column:1 / span {span}"><b>{name}</b>{tm}</div>{rest}</div>')
    notes = "".join(f"<li>{x}</li>" for x in C.TIME_NOTES)
    table = (f'<div class="rise"><div class="week">{"".join(rows)}</div>'
             f'<p class="tnote">{I_CLOCK}<span>{C.TIME_PURE}</span></p></div>')
    if mobile:
        return (f'<section class="sect">{sh(C.TIME_H2, C.TIME_SUB)}{week_m()}'
                f'<p class="tnote rise">{I_CLOCK}<span>{C.TIME_PURE}</span></p>'
                f'<ul class="tlist">{notes}</ul></section>')
    # 유의사항은 왼쪽 기둥에 붙인다. 머리만 두면 표 옆이 500px 비어 버린다.
    left = (f'<div>{sh(C.TIME_H2, C.TIME_SUB)}'
            f'<ul class="tlist rise">{notes}</ul></div>')
    return f'<section class="sect"><div class="time">{left}{table}</div></section>'


ANCHOR_IC = {"van": icon('<path d="M2.6 16.4V8.6a1 1 0 0 1 1-1h9.9v8.8H2.6z"></path>'
                         '<path d="M13.5 11h3.6l3.3 3.4v2h-6.9z"></path>'
                         '<circle cx="7" cy="16.6" r="1.9"></circle>'
                         '<circle cx="16.8" cy="16.6" r="1.9"></circle>', 24, 2.2),
             "hotel": icon('<path d="M5 20V5.6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20"></path>'
                           '<path d="M15 11.2h3.4a1 1 0 0 1 1 1V20"></path>'
                           '<path d="M3 20h18"></path>', 24, 2.2)}


def flow(mobile):
    """일정 안내. 차례만 본다. 양 끝(픽업·복귀)만 채운다.
    데스크탑은 아홉 칸 가로 레일, 폰은 같은 마크업을 세로로 세운다."""
    hops = []
    for name, anchor in C.JOURNEY:
        ic = ANCHOR_IC[anchor] if anchor else ""
        hops.append(f'<span class="hop{" anchor" if anchor else ""}">'
                    f'<span class="hop-d">{ic}</span><span class="hop-l">{name}</span></span>')
    return (f'<section class="sect">{sh(C.FLOW_H2, C.FLOW_SUB)}'
            f'<div class="hops rise">{"".join(hops)}</div>'
            f'<p class="hnote">{C.FLOW_NOTE}</p></section>')


def cs_media(key):
    kind, v = CS_MEDIA[key]
    if kind == "icon":
        return f'<div class="cs-m ic" aria-hidden="true">{PERK_ICONS[v]}</div>'
    imgs = "".join(f'<img src="{src}" alt="{alt}">' for src, alt in v)
    return f'<div class="cs-m{" two" if len(v) == 2 else ""}">{imgs}</div>'


def course(mobile):
    """코스 소개. 운영 중인 OTA 의 코스 소개 여덟 단계."""
    rows = []
    for k, (title, dur, body, note, media) in enumerate(C.COURSE, 1):
        t = f'<span class="cs-t">{dur}</span>' if dur else ""
        n = f'<p class="cs-note">{note}</p>' if note else ""
        rows.append(
            f'<article class="cs-s rise">'
            f'<div class="cs-h"><span class="cs-n n">{k:02d}</span>'
            f'<div class="cs-ht"><h3>{title}</h3>{t}</div></div>'
            f'{cs_media(media)}'
            f'<div class="cs-b"><p>{body}</p>{n}</div></article>')
    hint = (f'<p class="cs-hint">{C.COURSE_HINT} {I_SWIPE}</p>' if mobile else "")
    return (f'<section class="sect">{sh(C.COURSE_H2)}{hint}'
            f'<div class="cs">{"".join(rows)}</div></section>')


def stars(mobile):
    tiles = "".join(
        f'<div class="star-c"><img src="star{i:02d}.webp" alt="{n}"><b>{n}</b></div>'
        for i, n in enumerate(C.STARS, 1))
    if mobile:
        # 두 칸 격자에 열다섯은 마지막 줄이 한 칸 빈다. 문안에 이미 있던
        # 계정을 열여섯째 칸으로 세워 격자를 닫고 다음 행동도 붙여 둔다.
        tail = (f'<a class="star-c ig-c" href="#">{I_IG}'
                f'<b>{C.STAR_TAG.replace("_", "_<wbr>")}</b>'
                f'<span>인증샷 더 보기</span></a>')
        return (f'<section class="sect center">{sh(C.STAR_H2, C.STAR_SUB)}'
                f'<span class="pill" style="margin-top:18px">{C.STAR_BADGE}</span>'
                f'<div class="stars rise">{tiles}{tail}</div></section>')
    return (f'<section class="sect center">{sh(C.STAR_H2, C.STAR_SUB)}'
            f'<span class="pill" style="margin-top:18px">{C.STAR_BADGE}</span>'
            f'<div class="stars rise">{tiles}</div>'
            f'<p class="ig">{C.STAR_TAG}</p></section>')


def more(mobile):
    cards = "".join(
        f'<a class="mc rise" href="#"><img src="{img}" alt="{t}">'
        f'<span class="tx"><h3>{t}</h3><p>{b}</p>'
        f'<span class="go">바로가기 {I_ARROW}</span></span></a>'
        for img, t, b in C.MORE)
    return (f'<section class="sect">{sh(C.MORE_H2)}'
            f'<div class="more">{cards}</div></section>')


def foot():
    """맺음 띠와 푸터를 한 덩어리로. 문안은 랜딩 보드(SianB)에서 그대로 옮겼다."""
    cols = "".join(f'<div>{x}</div>' for x in [
        (f'<img src="logo_full.png" alt="오션스타" class="f-logo">'
         f'<p>{C.FOOT_ABOUT}</p>'
         f'<a href="#" class="f-more">오션스타 소개 {I_ARROW}</a>'),
        (f'<span class="c-h">{I_CLOCK} 영업시간 · 연락처</span>'
         + "".join(f'<p>{x}</p>' for x in C.FOOT_HOURS)),
        (f'<span class="c-h">{I_PIN} 위치</span><p>{C.FOOT_ADDR}</p>'
         f'<a href="#" class="f-more">구글 지도로 바로보기 {I_ARROW}</a>'),
        (f'<span class="c-h">사업자 정보</span>'
         + "".join(f'<p>{x}</p>' for x in C.FOOT_BIZ)),
    ])
    return (f'<footer class="foot">'
            f'<div class="end rise"><h2>{C.END_H2}</h2><p>{C.END_SUB}</p>'
            f'<a href="#" class="book-pill light">예약하기 {I_ARROW}</a></div>'
            f'<div class="cols rise">{cols}</div>'
            f'<div class="f-bot"><span>{C.FOOT_COPY}</span></div></footer>')


def dock():
    return (f'<div class="dock"><span class="d-l"><b class="n">{C.HERO["price"]}</b>'
            f'<span>성인 1인 · 4시간</span></span>'
            f'<a href="#" class="book-pill">예약하기 {I_ARROW}</a></div>')


def build(mobile):
    w, css = (375, CSS_M) if mobile else (1440, CSS_D)
    base = getattr(C, "BOARD_TITLE", "상세페이지 · 거북이 스노클링")
    title = f"{base} — 모바일" if mobile else f"{base} — 데스크탑"
    body = (hero(mobile) + perks(mobile) + features(mobile) + times(mobile)
            + flow(mobile) + course(mobile)
            + (stars(mobile) if getattr(C, "SHOW_STARS", True) else "") + more(mobile) + foot())
    if mobile:
        body += dock()
    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>{title}</title>
  <style>{fonts()}{css}
  </style>
</helmet>
<div class="page">
{body}
</div>
</x-dc>
</body>
</html>
"""
    stem = getattr(C, "STEM", "DetailKo")
    name = f"{stem}_M.dc.html" if mobile else f"{stem}.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")


# 상품마다 문안 모듈을 바꿔 끼워 같은 꼴로 찍는다.
for _mod in ("_detail_ko", "_detail_sunset_ko"):
    C = importlib.import_module(_mod)
    build(False)
    build(True)
