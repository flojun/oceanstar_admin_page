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
import io, os, re
import _detail_ko as C

HERE = os.path.dirname(os.path.abspath(__file__))

# 특장점 칸에 들어가는 실촬영본. 저장소 public/ 에 있던 것을 잘라 담았다.
FEAT_IMG = {"01": ("hero_waikiki.jpg", "와이키키 앞바다의 오션스타 보트와 다이아몬드헤드"),
            "02": ("feat_roof.webp",   "와이키키 앞바다의 오션스타 루프탑 보트"),
            "03": ("feat_marine.webp", "패들보드 위의 손님과 물에서 스노클링하는 일행"),
            "04": ("feat_turtle.webp", "모래바닥에 모여 있는 푸른바다거북")}


def fonts():
    s = io.open(os.path.join(HERE, "SianB.dc.html"), encoding="utf-8").read()
    return re.search(r'/\*__FONTS__\*/.*?/\*__FONTS_END__\*/', s, re.S).group(0)


def icon(path, size=18, sw=1.7, fill="none"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{path}</svg>')


I_ARROW = icon('<path d="M7 17L17 7M17 7H9M17 7v8"></path>', 15)
I_PLUS  = icon('<path d="M12 5v14M5 12h14"></path>', 13)
I_CLOCK = icon('<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.3V12l3.2 1.9"></path>')
I_STAR  = icon('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 '
               '5.8-.8z" fill="currentColor" stroke="none"></path>', 15)
I_PIN   = icon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>'
               '<circle cx="12" cy="10" r="2.6"></circle>', 20)
I_HOTEL = icon('<path d="M5 20V5.6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20"></path>'
               '<path d="M15 11.2h3.4a1 1 0 0 1 1 1V20"></path><path d="M3 20h18"></path>'
               '<path d="M8.4 8.2h1M11.4 8.2h1M8.4 11.6h1M11.4 11.6h1M8.4 15h1M11.4 15h1"></path>', 20)
I_IG    = icon('<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5"></rect>'
               '<circle cx="12" cy="12" r="4.1"></circle>'
               '<circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"></circle>', 26)
I_PH    = icon('<rect x="3.5" y="5" width="17" height="14" rx="2.4"></rect>'
               '<circle cx="9" cy="10.4" r="1.5"></circle>'
               '<path d="M4.6 17.2l4.1-4.1 3 3 3-2.6 4.7 4.2"></path>', 22, 1.5)
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

/* 6가지 특장점 — 폭이 다른 여섯 칸. 줄마다 3+3 / 2+4 / 4+2 로 갈라 같은
   리듬이 반복되지 않게 했다. 사진 셋과 진한 칸 둘이 흰 칸 사이에 섞인다. */
.feats{margin-top:40px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.ft{position:relative;display:flex;flex-direction:column;background:#fff;
  border:1px solid var(--line);border-radius:22px;overflow:hidden}
.ft.w3{grid-column:span 3} .ft.w4{grid-column:span 4} .ft.w2{grid-column:span 2}
.ft.key::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;
  z-index:2;background:var(--sea-d)}
.ft img{width:100%;object-fit:cover}
.ft.w2 img{aspect-ratio:1.41 / 1}
.ft.w3 img{aspect-ratio:2.15 / 1}
.ft.w4 img{aspect-ratio:2.88 / 1}
.ft-b{padding:30px 32px 32px}
.ft .no{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;
  padding:0 10px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:15px;font-weight:800;color:var(--deep)}

.ft h3{margin-top:16px;font-size:25px;line-height:1.3}
.ft .sub{margin-top:8px;font-size:16.5px;font-weight:700;color:var(--deep)}
.ft p{margin-top:16px;font-size:16.5px;line-height:1.8;color:var(--text)}
.ft .em{margin-top:16px;font-size:16.5px;line-height:1.8;font-weight:700;color:var(--deep)}
.ft.key .sub{color:var(--sea-d)}

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

/* 일정 — 단계 흐름. 픽업 안내는 카드를 걷고 실선 두 줄로 둔다. */
.flow{margin-top:44px;display:flex;align-items:center;justify-content:space-between;gap:0}
.step{display:flex;align-items:center;justify-content:center;width:126px;height:126px;
  border-radius:50%;text-align:center;font-size:15.5px;font-weight:700;line-height:1.35;
  background:#fff;border:1px solid var(--line);color:var(--ink)}
.step.on{background:var(--deep);border-color:var(--deep);color:#fff}
.flow span.sp{flex:1;height:1px;background:var(--line);min-width:10px}
.fnotes{margin-top:52px;border-top:1px solid var(--line);
  display:grid;grid-template-columns:1fr 1fr;gap:0}
.fc{display:flex;gap:18px;align-items:flex-start;padding:28px 0}
.fc + .fc{padding-left:44px;border-left:1px solid var(--line)}
.fc .ic{display:flex;align-items:center;justify-content:center;width:44px;height:44px;
  border-radius:13px;background:var(--soft);color:var(--sea);flex:none}
.fc.back .ic{color:var(--food-d)}
.fc h3{font-size:19px}
.fc p{margin-top:8px;font-size:16px;line-height:1.75;color:var(--text)}
.fnote{margin-top:26px;padding-top:24px;border-top:1px solid var(--line);
  font-size:16.5px;font-weight:700;color:var(--ink)}

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

/* 맺음 */
.end{margin:112px 0 0;padding:76px var(--pad);background:var(--ink);color:#fff;text-align:center}
.end h2{font-size:42px;color:#fff}
.end p{margin-top:14px;font-size:18px;line-height:1.8;color:rgba(255,255,255,.76)}
.end .book-pill{margin-top:26px}

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

/* 375px 에서는 폭을 나눌 수 없다. 한 줄로 쌓되 사진 칸이 리듬을 만든다. */
.feats{margin-top:28px;display:grid;grid-template-columns:1fr;gap:14px}
.ft{position:relative;display:flex;flex-direction:column;background:#fff;
  border:1px solid var(--line);border-radius:20px;overflow:hidden}
.ft.key::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;
  z-index:2;background:var(--sea-d)}
.ft img{width:100%;aspect-ratio:16 / 10;object-fit:cover}
.ft-b{padding:24px 22px 28px}
.ft .no{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;
  padding:0 10px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:14.5px;font-weight:800;color:var(--deep)}

.ft h3{margin-top:16px;font-size:24px;line-height:1.32}
.ft .sub{margin-top:8px;font-size:16px;font-weight:700;color:var(--deep)}
.ft p{margin-top:14px;font-size:16px;line-height:1.85;color:var(--text)}
.ft .em{margin-top:14px;font-size:16px;line-height:1.8;font-weight:700;color:var(--deep)}
.ft.key .sub{color:var(--sea-d)}

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

/* 375px 에 원 일곱 개는 못 넣는다. 세로로 세운다. */
.flow{margin-top:28px;display:grid;grid-template-columns:1fr;gap:0}
.step{display:flex;align-items:center;gap:15px;min-height:56px;font-size:16.5px;font-weight:700;
  color:var(--ink);line-height:1.4}
.step::before{content:"";width:12px;height:12px;border-radius:50%;background:#fff;
  border:3px solid var(--line);flex:none;margin-left:5px}
.step.on::before{background:var(--deep);border-color:var(--deep)}
.flow span.sp{width:1px;height:16px;margin-left:10.5px;background:var(--line)}
.fnotes{margin-top:34px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr}
.fc{display:flex;gap:15px;align-items:flex-start;padding:24px 0}
.fc + .fc{border-top:1px solid var(--line)}
.fc .ic{display:flex;align-items:center;justify-content:center;width:48px;height:48px;
  border-radius:14px;background:var(--soft);color:var(--sea-d);flex:none}
.fc.back .ic{color:var(--food-d)}
.fc h3{font-size:18px}
.fc p{margin-top:8px;font-size:15px;line-height:1.75;color:var(--text)}
.fnote{margin-top:24px;padding-top:22px;border-top:1px solid var(--line);
  font-size:15.5px;font-weight:700;color:var(--ink);line-height:1.7}

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
.mc .tx{padding:24px 22px 26px}
.mc h3{font-size:23px;line-height:1.35}
.mc p{margin-top:10px;font-size:16px;line-height:1.75;color:var(--text)}
.mc .go{margin-top:8px;display:inline-flex;align-items:center;min-height:48px;gap:7px;
  font-size:15px;font-weight:700;color:var(--deep)}

.end{margin-top:72px;padding:60px var(--pad) 66px;background:var(--ink);color:#fff;
  text-align:center}
.end h2{font-size:30px;color:#fff;line-height:1.32}
.end p{margin-top:14px;font-size:16px;line-height:1.8;color:rgba(255,255,255,.76)}
.end .book-pill{margin-top:24px;height:58px;padding:0 10px 0 24px;font-size:16.5px}

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
    return f"""<section class="hero">
  <img src="hero_turtle.webp" alt="와이키키 앞바다 산호 위의 푸른바다거북" class="hero-img">
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
    cells = "".join(
        f'<div class="inc-c"><div class="inc-h"><span class="ic">{PERK_ICONS[k]}</span>'
        f'<h3>{t}</h3></div><p>{b}</p></div>' for k, t, b in C.PERKS)
    return (f'<section class="sect">{sh(C.PERKS_H2)}'
            f'<div class="inc rise">{cells}</div></section>')


def features(mobile):
    # 줄마다 폭을 달리한다. 3+3 / 2+4 / 4+2.
    SPAN = {"01": "w3", "02": "w3", "03": "w2", "04": "w4", "05": "w3", "06": "w3"}
    out = []
    for no, t, sub, paras, em, key in C.FEATURES:
        img = ""
        if no in FEAT_IMG:
            src, alt = FEAT_IMG[no]
            img = f'<img src="{src}" alt="{alt}">'
        body = "".join(f'<p>{x}</p>' for x in paras)
        emx = f'<p class="em">{em}</p>' if em else ""
        out.append(f'<div class="ft {SPAN[no]}{" key" if key else ""} rise">{img}'
                   f'<div class="ft-b"><span class="no">{no}</span>'
                   f'<h3>{t}</h3><span class="sub">{sub}</span>{body}{emx}</div></div>')
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
        rest = (f'<span class="rest" style="grid-column:{span+1} / -1">휴무</span>'
                if span < 7 else "")
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


def flow(mobile):
    steps = []
    for i, x in enumerate(C.FLOW):
        if i:
            steps.append('<span class="sp"></span>')
        steps.append(f'<div class="step{" on" if i % 2 == 0 else ""}">{x}</div>')
    ic = {"pickup": PERK_ICONS["van"], "back": I_HOTEL}
    cards = "".join(
        f'<div class="fc{" back" if k == "back" else ""}"><span class="ic">{ic[k]}</span>'
        f'<div><h3>{t}</h3><p>{b}</p></div></div>' for k, t, b in C.FLOW_CARDS)
    return (f'<section class="sect">{sh(C.FLOW_H2)}'
            f'<div class="flow rise">{"".join(steps)}</div>'
            f'<div class="fnotes rise">{cards}</div>'
            f'<p class="fnote">{C.FLOW_NOTE}</p></section>')


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


def end():
    return (f'<section class="end"><h2>{C.END_H2}</h2><p>{C.END_SUB}</p>'
            f'<a href="#" class="book-pill light">예약하기 {I_ARROW}</a></section>')


def dock():
    return (f'<div class="dock"><span class="d-l"><b class="n">{C.HERO["price"]}</b>'
            f'<span>성인 1인 · 4시간</span></span>'
            f'<a href="#" class="book-pill">예약하기 {I_ARROW}</a></div>')


def build(mobile):
    w, css = (375, CSS_M) if mobile else (1440, CSS_D)
    title = ("상세페이지 · 거북이 스노클링 — 모바일" if mobile
             else "상세페이지 · 거북이 스노클링 — 데스크탑")
    body = (hero(mobile) + perks(mobile) + features(mobile) + times(mobile)
            + flow(mobile) + stars(mobile) + more(mobile) + end())
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
    name = "DetailKo_M.dc.html" if mobile else "DetailKo.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")


build(False)
build(True)
