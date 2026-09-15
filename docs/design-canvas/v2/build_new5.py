# -*- coding: utf-8 -*-
"""백지에서 다시 짠 5가지. 남긴 것은 로고·보트 영상·상품 사진·ko.ts 문구뿐이다.

색·서체·라운드·그림자·레이아웃 언어를 방향마다 따로 정한다. 그래서 이 다섯은
한 시스템의 변형이 아니라 서로 다른 미감 계열이다.

새-1 저널   : 여행 잡지. 명조 대제목, 헤어라인, 번호 매긴 목록. 카드 없음.
새-2 심해   : 전면 다크. 발광하는 시안 하나. 사진이 빛나 보인다.
새-3 선샤인 : 크림 + 딥티크 + 선옐로. 큰 곡선과 색면. 가장 에너지가 높다.
새-4 그리드 : 스위스. 라운드 0, 모노 레이블, 상품은 비교 표로.
새-5 씨글래스: 유기적 곡선 마스크와 물결. 테라코타 강조. 가장 부드럽다.
"""
import io
from build_v2 import HERO, NAV, STATS, TOUR, TOURS

T = TOURS
W, PAD = 1440, 120
BOOK, MORE = TOUR["book"], TOUR["more"]
HBOOK = "투어 예약하기"  # 헤더 CTA
IMG = "hero_boat.webp"
ALT = "와이키키 앞바다의 오션스타 51인승 루프탑 보트"


def doc(title, fonts, css, body):
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?%s&display=swap">
  <style>
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,h4,p,ul,li{margin:0;padding:0}
li{list-style:none}
a{text-decoration:none}
button{border:0;cursor:pointer;font:inherit}
img{display:block;max-width:100%%}
.n{font-variant-numeric:tabular-nums}
%s
  </style>
</helmet>
%s
</x-dc>
</body>
</html>
""" % (title, fonts, css, body)


def check(color, size=14):
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="%s" '
            'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" '
            'style="flex:none" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>'
            ) % (size, size, color)


def plain(badge):
    out = "".join(c for c in badge if ord(c) < 0x2000 or 0xAC00 <= ord(c) <= 0xD7A3)
    return out.replace("!", "").strip()


# ==========================================================  새-1 · 저널
def journal():
    fonts = "family=Song+Myung&family=IBM+Plex+Sans+KR:wght@400;500;600"
    css = """
body{background:#FCFCFB;color:#14181C;font-family:'IBM Plex Sans KR',sans-serif;
     word-break:keep-all}
.d{font-family:'Song Myung',serif;font-weight:400}
.rule{height:1px;background:#E1E1DD}
.lab{font-size:11px;letter-spacing:.22em;color:#8C8C86;font-weight:500}
.lnk{color:#14181C;border-bottom:1px solid #14181C;padding-bottom:2px;font-size:14px}
.cta{background:#14181C;color:#FCFCFB;height:52px;padding:0 30px;font-size:15px;
     font-weight:500;letter-spacing:.02em}
"""
    rows = ""
    for i, t in enumerate(T):
        rows += """
<article style="display:grid;grid-template-columns:66px 1fr 300px 200px;gap:36px;
  align-items:start;padding:38px 0;border-top:1px solid #E1E1DD">
  <div class="d n" style="font-size:34px;color:#C9C9C2;line-height:1">%02d</div>
  <div>
    <div class="lab">%s</div>
    <h3 class="d" style="font-size:29px;line-height:1.35;margin-top:12px">%s</h3>
    <p style="font-size:14px;line-height:1.85;color:#5F6670;margin-top:12px;
      max-width:440px">%s</p>
    <ul style="display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:16px">%s</ul>
  </div>
  <img src="%s" alt="%s" style="width:300px;height:198px;object-fit:cover">
  <div style="text-align:right">
    <div class="n" style="font-size:12px;color:#8C8C86">%s</div>
    <div class="d n" style="font-size:27px;margin-top:5px">%s</div>
    <button class="cta" style="margin-top:18px;height:46px;padding:0 24px;
      font-size:14px">%s</button>
  </div>
</article>""" % (i + 1, plain(t["badge"]), t["name"], t["desc"],
                 "".join('<li style="display:flex;align-items:center;gap:8px;font-size:13px;'
                         'color:#5F6670">%s%s</li>' % (check("#1E5BFF", 13), f)
                         for f in t["feats"]),
                 t["img"], t["name"], t["sub"], t["price"], BOOK)
    stats = "".join(
        '<div style="flex:1"><div class="d n" style="font-size:30px">%s</div>'
        '<div class="lab" style="margin-top:8px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:#FCFCFB">
  <header style="display:flex;align-items:center;justify-content:space-between;
    padding:26px %dpx;border-bottom:1px solid #E1E1DD">
    <img src="logo_full.png" alt="오션스타" style="height:46px;width:auto">
    <nav style="display:flex;gap:30px">%s</nav>
    <div style="display:flex;align-items:center;gap:18px">
      <a href="#" style="font-size:14px;color:#5F6670">EN</a>
      <a href="#" style="font-size:14px;color:#5F6670">내 예약 관리</a>
      <a href="#" class="lnk">%s</a>
    </div>
  </header>
  <section style="padding:82px %dpx 0">
    <div class="lab">%s</div>
    <h1 class="d" style="font-size:78px;line-height:1.14;margin-top:20px;max-width:1000px">
      %s<br>%s</h1>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:60px;
      margin-top:30px">
      <p style="font-size:17px;line-height:1.9;color:#5F6670;max-width:520px">%s</p>
      <button class="cta">%s</button>
    </div>
  </section>
  <div style="margin-top:56px;height:470px;overflow:hidden">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover">
  </div>
  <div style="display:flex;gap:40px;padding:34px %dpx;border-bottom:1px solid #E1E1DD">%s</div>
  <section style="padding:88px %dpx 100px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;
      margin-bottom:8px">
      <h2 class="d" style="font-size:44px;line-height:1.25">%s</h2>
      <a href="#" class="lnk">%s</a>
    </div>
    <p style="font-size:15px;color:#5F6670;margin-bottom:26px">%s</p>
    %s
  </section>
</div>""" % (W, PAD, "".join('<a href="#" style="font-size:14px;color:#5F6670">%s</a>' % n
                            for n in NAV), HBOOK, PAD,
             HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"], HERO["cta"],
             IMG, ALT, PAD, stats, PAD, TOUR["title"], MORE, TOUR["subtitle"], rows)
    return doc("새-1 · 저널", fonts, css, body)


# ==========================================================  새-2 · 심해
def deepsea_dark():
    fonts = "family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700"
    css = """
body{background:#060E16;color:#E8F1F5;font-family:'Noto Sans KR',sans-serif;
     word-break:keep-all}
.d{font-family:'Black Han Sans',sans-serif;font-weight:400;letter-spacing:-.01em}
.lab{font-size:11px;letter-spacing:.24em;color:#3DE0E8;font-weight:700}
.card{background:#0D1926;border-top:2px solid #3DE0E8;overflow:hidden;
      box-shadow:0 24px 60px rgba(0,0,0,.5)}
.cta{background:#3DE0E8;color:#052029;height:54px;padding:0 32px;font-size:16px;
     font-weight:700}
.ghost{background:transparent;color:#E8F1F5;border:1px solid rgba(232,241,245,.34);
       height:54px;padding:0 28px;font-size:16px;font-weight:500}
"""
    cards = ""
    for t in T:
        cards += """
<article class="card" style="display:flex;flex-direction:column">
  <div style="height:172px;position:relative">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;opacity:.88">
  </div>
  <div style="padding:22px;display:flex;flex-direction:column;flex:1">
    <div class="lab">%s</div>
    <h3 class="d" style="font-size:21px;line-height:1.4;margin-top:11px">%s</h3>
    <ul style="display:grid;gap:8px;margin-top:14px">%s</ul>
    <div style="margin-top:auto;padding-top:20px">
      <div class="n" style="font-size:12px;color:#7E95A5">%s</div>
      <div class="d n" style="font-size:25px;color:#3DE0E8;margin-top:3px">%s</div>
      <button class="ghost" style="width:100%%;height:44px;margin-top:14px;
        font-size:14px;padding:0">%s</button>
    </div>
  </div>
</article>""" % (t["img"], t["name"], plain(t["badge"]), t["name"],
                 "".join('<li style="display:flex;align-items:flex-start;gap:8px;'
                         'font-size:13px;line-height:1.5;color:#9DB2C0">%s<span>%s</span></li>'
                         % (check("#3DE0E8", 13), f) for f in t["feats"]),
                 t["sub"], t["price"], BOOK)
    stats = "".join(
        '<div style="flex:1;padding-right:30px">'
        '<div class="d n" style="font-size:32px;color:#3DE0E8">%s</div>'
        '<div style="font-size:13px;color:#7E95A5;margin-top:6px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:#060E16">
  <section style="position:relative;height:800px;overflow:hidden">
    <img src="%s" alt="%s" style="position:absolute;inset:0;width:100%%;height:100%%;
      object-fit:cover">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,
      rgba(6,14,22,.72) 0%%,rgba(6,14,22,.28) 34%%,rgba(6,14,22,.86) 76%%,#060E16 100%%)"></div>
    <header style="position:absolute;left:0;right:0;top:0;z-index:3;display:flex;
      align-items:center;justify-content:space-between;padding:26px %dpx">
      <img src="logo_full.png" alt="오션스타"
        style="height:48px;width:auto;filter:brightness(0) invert(1)">
      <nav style="display:flex;gap:32px">%s</nav>
      <div style="display:flex;align-items:center;gap:12px">
        <a href="#" style="font-size:13.5px;color:#C4D2DB;border:1px solid rgba(232,241,245,.3);border-radius:4px;padding:9px 13px">EN</a>
        <a href="#" style="font-size:13.5px;color:#C4D2DB;border:1px solid rgba(232,241,245,.3);border-radius:4px;padding:9px 13px">내 예약 관리</a>
        <button class="cta" style="height:44px;padding:0 22px;font-size:14px">%s</button>
      </div>
    </header>
    <div style="position:absolute;left:%dpx;right:%dpx;bottom:78px;z-index:3">
      <div class="lab">%s</div>
      <h1 class="d" style="font-size:84px;line-height:1.1;margin-top:18px">%s<br>%s</h1>
      <p style="font-size:18px;line-height:1.85;color:#A9BECB;max-width:560px;
        margin-top:20px">%s</p>
      <div style="display:flex;gap:12px;margin-top:30px">
        <button class="cta">%s</button><button class="ghost">%s</button>
      </div>
    </div>
  </section>
  <div style="display:flex;padding:36px %dpx;border-top:1px solid rgba(61,224,232,.22);
    border-bottom:1px solid rgba(61,224,232,.22)">%s</div>
  <section style="padding:92px %dpx 104px">
    <h2 class="d" style="font-size:46px;line-height:1.25">%s</h2>
    <p style="font-size:16px;color:#7E95A5;margin-top:12px;margin-bottom:38px">%s</p>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px">%s</div>
  </section>
</div>""" % (W, IMG, ALT, PAD,
             "".join('<a href="#" style="font-size:15px;color:%s">%s</a>'
                     % ("#E8F1F5" if i == 0 else "#8FA6B4", n) for i, n in enumerate(NAV)),
             HBOOK, PAD, PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
             HERO["cta"], HERO["cta2"], PAD, stats, PAD,
             TOUR["title"], TOUR["subtitle"], cards)
    return doc("새-2 · 심해 (다크, 보관용)", fonts, css, body)


# ==========================================================  새-3 · 선샤인
def sunshine():
    fonts = "family=Do+Hyeon&family=Gothic+A1:wght@400;500;700"
    css = """
body{background:#FFFBF2;color:#123B34;font-family:'Gothic A1',sans-serif;word-break:keep-all}
.d{font-family:'Do Hyeon',sans-serif;font-weight:400}
.pill{background:#123B34;color:#FFFBF2;border-radius:999px;height:52px;padding:0 30px;
      font-size:16px;font-weight:700}
.pill-y{background:#FFC53D;color:#123B34;border-radius:999px;height:52px;padding:0 30px;
        font-size:16px;font-weight:700}
.chip{background:#FFF3D6;color:#8A6A16;border-radius:999px;padding:7px 15px;
      font-size:12px;font-weight:700}
"""
    tiles = ""
    for i, t in enumerate(T):
        dark = i % 2 == 1
        bg = "#123B34" if dark else "#FFFFFF"
        ink = "#FFFBF2" if dark else "#123B34"
        sub = "#9DC0B7" if dark else "#5C7A73"
        tiles += """
<article style="background:%s;border-radius:30px;overflow:hidden;display:flex;
  flex-direction:column;box-shadow:0 16px 40px rgba(18,59,52,.10)">
  <img src="%s" alt="%s" style="width:100%%;height:192px;object-fit:cover">
  <div style="padding:26px;display:flex;flex-direction:column;flex:1">
    <span class="chip" style="align-self:flex-start;%s">%s</span>
    <h3 class="d" style="font-size:24px;line-height:1.35;color:%s;margin-top:14px">%s</h3>
    <ul style="display:grid;gap:9px;margin-top:14px">%s</ul>
    <div style="margin-top:auto;padding-top:22px">
      <div class="n" style="font-size:12px;color:%s">%s</div>
      <div class="d n" style="font-size:28px;color:%s;margin-top:2px">%s</div>
      <button class="%s" style="width:100%%;height:48px;margin-top:16px;
        font-size:15px;padding:0">%s</button>
    </div>
  </div>
</article>""" % (bg, t["img"], t["name"],
                 "background:rgba(255,197,61,.2);color:#FFC53D" if dark else "",
                 plain(t["badge"]), ink, t["name"],
                 "".join('<li style="display:flex;align-items:flex-start;gap:8px;'
                         'font-size:13.5px;line-height:1.55;color:%s">%s<span>%s</span></li>'
                         % (sub, check("#FFC53D" if dark else "#2F8C7A", 14), f)
                         for f in t["feats"]),
                 sub, t["sub"], ink, t["price"],
                 "pill-y" if dark else "pill", BOOK)
    stats = "".join(
        '<div style="flex:1"><div class="d n" style="font-size:34px;color:#123B34">%s</div>'
        '<div style="font-size:13px;color:#5C7A73;margin-top:5px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:#FFFBF2">
  <header style="display:flex;align-items:center;justify-content:space-between;
    padding:24px %dpx">
    <img src="logo_full.png" alt="오션스타" style="height:50px;width:auto">
    <nav style="display:flex;gap:8px;background:#FFFFFF;border-radius:999px;padding:7px;
      box-shadow:0 6px 18px rgba(18,59,52,.08)">%s</nav>
<div style="display:flex;align-items:center;gap:10px">
      <a href="#" style="font-size:13.5px;font-weight:700;color:#123B34;background:#FFFFFF;border-radius:999px;padding:11px 17px;box-shadow:0 6px 18px rgba(18,59,52,.08)">EN</a>
      <a href="#" style="font-size:13.5px;font-weight:700;color:#123B34;background:#FFFFFF;border-radius:999px;padding:11px 17px;box-shadow:0 6px 18px rgba(18,59,52,.08)">내 예약 관리</a>
      <button class="pill" style="height:46px;padding:0 24px;font-size:15px">%s</button>
    </div>
  </header>
  <section style="position:relative;padding:52px %dpx 0">
    <div style="position:absolute;right:0;top:120px;width:520px;height:520px;
      border-radius:50%%;background:#FFC53D;opacity:.9"></div>
    <div style="position:relative;z-index:2;max-width:760px">
      <span class="chip">%s</span>
      <h1 class="d" style="font-size:76px;line-height:1.12;margin-top:20px">%s<br>%s</h1>
      <p style="font-size:18px;line-height:1.85;color:#3F6259;max-width:520px;
        margin-top:20px">%s</p>
      <div style="display:flex;gap:12px;margin-top:30px">
        <button class="pill">%s</button>
        <button class="pill" style="background:transparent;color:#123B34;
          border:2px solid #123B34">%s</button>
      </div>
    </div>
    <div style="position:relative;z-index:2;margin-top:44px;border-radius:40px;
      overflow:hidden;height:430px;box-shadow:0 30px 70px rgba(18,59,52,.22)">
      <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover">
    </div>
  </section>
  <div style="display:flex;gap:30px;padding:44px %dpx 0">%s</div>
  <section style="padding:70px %dpx 100px">
    <h2 class="d" style="font-size:48px;line-height:1.22">%s</h2>
    <p style="font-size:16px;color:#5C7A73;margin-top:12px;margin-bottom:34px">%s</p>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px">%s</div>
  </section>
</div>""" % (W, PAD,
             "".join('<a href="#" style="font-size:14px;font-weight:%d;padding:9px 17px;'
                     'border-radius:999px;background:%s;color:%s">%s</a>'
                     % (700 if i == 0 else 500, "#123B34" if i == 0 else "transparent",
                        "#FFFBF2" if i == 0 else "#5C7A73", n)
                     for i, n in enumerate(NAV)),
             HBOOK, PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
             HERO["cta"], HERO["cta2"], IMG, ALT, PAD, stats, PAD,
             TOUR["title"], TOUR["subtitle"], tiles)
    return doc("새-3 · 선샤인", fonts, css, body)


# ==========================================================  새-4 · 그리드
def grid():
    fonts = ("family=IBM+Plex+Sans+KR:wght@400;500;600;700"
             "&family=IBM+Plex+Mono:wght@400;500")
    css = """
body{background:#FFFFFF;color:#0A0A0A;font-family:'IBM Plex Sans KR',sans-serif;
     word-break:keep-all}
.m{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.12em;
   text-transform:uppercase;color:#767676}
.hair{border-top:1px solid #DDDDDD}
.cta{background:#0057FF;color:#fff;height:52px;padding:0 28px;font-size:15px;font-weight:600}
.gh{background:#fff;color:#0A0A0A;border:1px solid #0A0A0A;height:52px;padding:0 26px;
    font-size:15px;font-weight:500}
td,th{text-align:left;vertical-align:top;padding:22px 20px;border-top:1px solid #DDDDDD}
"""
    rows = ""
    for i, t in enumerate(T):
        rows += """
<tr>
  <td style="width:56px"><span class="m">%02d</span></td>
  <td style="width:188px"><img src="%s" alt="%s"
    style="width:168px;height:112px;object-fit:cover"></td>
  <td>
    <div class="m">%s</div>
    <div style="font-size:17px;font-weight:600;line-height:1.45;margin-top:8px">%s</div>
    <p style="font-size:13px;line-height:1.7;color:#767676;margin-top:7px;
      max-width:330px">%s</p>
  </td>
  <td style="width:262px">
    <ul style="display:grid;gap:7px">%s</ul>
  </td>
  <td style="width:214px;text-align:right">
    <div class="m n" style="letter-spacing:.06em">%s</div>
    <div class="n" style="font-size:21px;font-weight:600;margin-top:6px;
      white-space:nowrap">%s</div>
  </td>
  <td style="width:130px;text-align:right">
    <button class="%s" style="height:42px;padding:0 20px;font-size:14px">%s</button>
  </td>
</tr>""" % (i + 1, t["img"], t["name"], plain(t["badge"]), t["name"], t["desc"],
            "".join('<li style="display:flex;align-items:flex-start;gap:7px;font-size:12.5px;'
                    'line-height:1.5;color:#3D3D3D">%s<span>%s</span></li>'
                    % (check("#0057FF", 12), f) for f in t["feats"]),
            t["sub"], t["price"], "cta" if t.get("hot") else "gh", BOOK)
    stats = "".join(
        '<div style="flex:1;border-left:1px solid #DDDDDD;padding:0 0 0 22px">'
        '<div class="n" style="font-size:30px;font-weight:600">%s</div>'
        '<div class="m" style="margin-top:8px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:#FFFFFF">
  <header style="display:flex;align-items:center;justify-content:space-between;
    padding:20px %dpx;border-bottom:1px solid #DDDDDD">
    <img src="logo_full.png" alt="오션스타" style="height:44px;width:auto">
    <nav style="display:flex;gap:28px">%s</nav>
<div style="display:flex;align-items:center;gap:10px">
      <a href="#" style="font-size:13px;color:#0A0A0A;border:1px solid #DDDDDD;padding:9px 13px">EN</a>
      <a href="#" style="font-size:13px;color:#0A0A0A;border:1px solid #DDDDDD;padding:9px 13px">내 예약 관리</a>
      <button class="cta" style="height:40px;padding:0 20px;font-size:14px">%s</button>
    </div>
  </header>
  <section style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #DDDDDD">
    <div style="padding:76px %dpx 76px %dpx;display:flex;flex-direction:column;
      justify-content:center">
      <div class="m">%s</div>
      <h1 style="font-size:56px;font-weight:600;line-height:1.16;letter-spacing:-.02em;
        margin-top:22px">%s<br>%s</h1>
      <p style="font-size:16px;line-height:1.85;color:#767676;margin-top:20px;
        max-width:430px">%s</p>
      <div style="display:flex;gap:10px;margin-top:32px">
        <button class="cta">%s</button><button class="gh">%s</button>
      </div>
    </div>
    <div style="height:100%%;min-height:560px;border-left:1px solid #DDDDDD">
      <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover">
    </div>
  </section>
  <div style="display:flex;padding:34px %dpx;border-bottom:1px solid #DDDDDD">%s</div>
  <section style="padding:78px %dpx 96px">
    <div class="m">%s</div>
    <h2 style="font-size:38px;font-weight:600;letter-spacing:-.02em;line-height:1.28;
      margin-top:12px">%s</h2>
    <table style="width:100%%;border-collapse:collapse;margin-top:32px">
      <tbody>%s</tbody>
    </table>
  </section>
</div>""" % (W, PAD,
             "".join('<a href="#" style="font-size:14px;font-weight:%d;color:%s">%s</a>'
                     % (600 if i == 0 else 400, "#0A0A0A" if i == 0 else "#767676", n)
                     for i, n in enumerate(NAV)),
             HBOOK, PAD, PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
             HERO["cta"], HERO["cta2"], IMG, ALT, PAD, stats, PAD,
             TOUR["subtitle"], TOUR["title"], rows)
    return doc("새-4 · 그리드", fonts, css, body)


# ==========================================================  새-5 · 씨글래스
def seaglass():
    fonts = "family=Gowun+Dodum&family=Noto+Sans+KR:wght@400;500;700"
    css = """
body{background:#EEF4F1;color:#1F3A34;font-family:'Noto Sans KR',sans-serif;
     word-break:keep-all}
.d{font-family:'Gowun Dodum',sans-serif;font-weight:400}
.tag{font-size:11.5px;font-weight:700;letter-spacing:.14em;color:#C4643C}
.btn-t{background:#C4643C;color:#FFF7F3;border-radius:999px;height:52px;padding:0 30px;
       font-size:16px;font-weight:700}
.btn-o{background:transparent;color:#2F6B5F;border:1.5px solid #9CBDB3;border-radius:999px;
       height:52px;padding:0 28px;font-size:16px;font-weight:700}
.blob{border-radius:180px 28px 180px 28px;overflow:hidden}
"""
    rows = ""
    for i, t in enumerate(T):
        left = i % 2 == 0
        shape = ("border-radius:150px 24px 150px 24px" if left
                 else "border-radius:24px 150px 24px 150px")
        img = ('<div style="%s;overflow:hidden;height:250px"><img src="%s" alt="%s" '
               'style="width:100%%;height:100%%;object-fit:cover"></div>'
               ) % (shape, t["img"], t["name"])
        txt = """
<div style="padding:%s">
  <div class="tag">%s</div>
  <h3 class="d" style="font-size:28px;line-height:1.4;margin-top:12px">%s</h3>
  <p style="font-size:14.5px;line-height:1.9;color:#5C7A72;margin-top:12px">%s</p>
  <ul style="display:grid;gap:9px;margin-top:16px">%s</ul>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:18px;
    margin-top:22px">
    <div><div class="n" style="font-size:12px;color:#7E9990">%s</div>
      <div class="d n" style="font-size:28px;margin-top:2px">%s</div></div>
    <button class="%s" style="height:46px;padding:0 24px;font-size:15px">%s</button>
  </div>
</div>""" % ("0 46px 0 0" if left else "0 0 0 46px", plain(t["badge"]), t["name"], t["desc"],
             "".join('<li style="display:flex;align-items:flex-start;gap:9px;font-size:14px;'
                     'line-height:1.6;color:#5C7A72">%s<span>%s</span></li>'
                     % (check("#2F8C7A", 15), f) for f in t["feats"]),
             t["sub"], t["price"], "btn-t" if t.get("hot") else "btn-o", BOOK)
        a, b = (img, txt) if left else (txt, img)
        rows += ('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;'
                 'align-items:center;padding:46px 0;border-bottom:1px solid #D8E4DF">'
                 '%s%s</div>') % (a, b)
    stats = "".join(
        '<div style="flex:1"><div class="d n" style="font-size:32px;color:#2F6B5F">%s</div>'
        '<div style="font-size:13px;color:#7E9990;margin-top:6px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:#EEF4F1">
  <header style="display:flex;align-items:center;justify-content:space-between;
    padding:26px %dpx">
    <img src="logo_full.png" alt="오션스타" style="height:48px;width:auto">
    <nav style="display:flex;gap:30px">%s</nav>
<div style="display:flex;align-items:center;gap:10px">
      <a href="#" style="font-size:13.5px;font-weight:700;color:#2F6B5F;border:1.5px solid #A9C6BC;border-radius:999px;padding:10px 16px">EN</a>
      <a href="#" style="font-size:13.5px;font-weight:700;color:#2F6B5F;border:1.5px solid #A9C6BC;border-radius:999px;padding:10px 16px">내 예약 관리</a>
      <button class="btn-t" style="height:44px;padding:0 22px;font-size:14px">%s</button>
    </div>
  </header>
  <section style="display:grid;grid-template-columns:1fr 660px;gap:48px;align-items:center;
    padding:44px %dpx 0">
    <div>
      <div class="tag">%s</div>
      <h1 class="d" style="font-size:62px;line-height:1.28;margin-top:18px">%s<br>%s</h1>
      <p style="font-size:17px;line-height:1.95;color:#5C7A72;max-width:470px;
        margin-top:20px">%s</p>
      <div style="display:flex;gap:12px;margin-top:32px">
        <button class="btn-t">%s</button><button class="btn-o">%s</button>
      </div>
    </div>
    <div class="blob" style="height:520px"><img src="%s" alt="%s"
      style="width:100%%;height:100%%;object-fit:cover"></div>
  </section>
  <svg viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"
    style="width:100%%;height:90px;margin-top:46px;display:block">
    <path fill="#FFFFFF" d="M0 46c220-40 420 26 720 26s500-66 720-26v44H0Z"/>
  </svg>
  <div style="background:#FFFFFF;padding:0 %dpx 42px">
    <div style="display:flex;gap:34px">%s</div>
  </div>
  <section style="background:#FFFFFF;padding:34px %dpx 96px">
    <h2 class="d" style="font-size:44px;line-height:1.32">%s</h2>
    <p style="font-size:16px;color:#5C7A72;margin-top:12px">%s</p>
    <div style="margin-top:18px">%s</div>
  </section>
</div>""" % (W, PAD,
             "".join('<a href="#" style="font-size:15px;color:%s">%s</a>'
                     % ("#1F3A34" if i == 0 else "#7E9990", n) for i, n in enumerate(NAV)),
             HBOOK, PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
             HERO["cta"], HERO["cta2"], IMG, ALT, PAD, stats, PAD,
             TOUR["title"], TOUR["subtitle"], rows)
    return doc("새-5 · 씨글래스", fonts, css, body)



# ==========================================================  새-2 · 심해 (밝은판)
def deepsea_light():
    """심해안을 밝은 색으로 다시 짠 것.

    정체성은 그대로 둔다 - Black Han Sans 대제목, 발광하는 시안 하나,
    카드 윗변 2px 강조선, 3+2 배치.

    히어로만 구조를 바꿨다. 전면 영상 위에 큰 활자를 얹으면 제목이 배를 가린다.
    배는 영상 가로의 33~97% 자리를 차지해서 활자가 피할 여백이 왼쪽 3할뿐인데,
    68px 두 줄이 들어갈 폭이 안 나온다. 그래서 좌 활자 / 우 영상으로 갈랐다.
    영상 블록은 오른쪽 화면 밖으로 흘러나가고 초점을 오른쪽에 맞춰,
    배 전체와 맨 뒤에 선 사람까지 온전히 들어온다.
    """
    fonts = "family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;500;700"
    css = """
body{background:#F4FAFB;color:#082733;font-family:'Noto Sans KR',sans-serif;
     word-break:keep-all}
.d{font-family:'Black Han Sans',sans-serif;font-weight:400;letter-spacing:-.01em}
.lab{font-size:11px;letter-spacing:.24em;color:#00849A;font-weight:700}
.card{background:#FFFFFF;border:1px solid #DCEAEE;border-top:2px solid #21C8DC;
      overflow:hidden;box-shadow:0 1px 2px rgba(8,39,51,.05),
      0 10px 26px rgba(8,39,51,.08)}
.cta{background:#007A8C;color:#FFFFFF;height:54px;padding:0 32px;font-size:16px;
     font-weight:700;box-shadow:0 2px 4px rgba(0,122,140,.22),
     0 10px 22px rgba(0,122,140,.26)}
.ghost{background:#FFFFFF;color:#00707F;border:1.5px solid #9FD5DE;height:54px;
       padding:0 28px;font-size:16px;font-weight:700}
"""
    cards = ""
    for t in T:
        cards += """
<article class="card" style="display:flex;flex-direction:column">
  <div style="height:172px">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover">
  </div>
  <div style="padding:22px;display:flex;flex-direction:column;flex:1">
    <div class="lab">%s</div>
    <h3 class="d" style="font-size:21px;line-height:1.4;margin-top:11px">%s</h3>
    <ul style="display:grid;gap:8px;margin-top:14px">%s</ul>
    <div style="margin-top:auto;padding-top:20px">
      <div class="n" style="font-size:12px;color:#5C7A87">%s</div>
      <div class="d n" style="font-size:25px;color:#00707F;margin-top:3px">%s</div>
      <button class="ghost" style="width:100%%;height:44px;margin-top:14px;
        font-size:14px;padding:0">%s</button>
    </div>
  </div>
</article>""" % (t["img"], t["name"], plain(t["badge"]), t["name"],
                 "".join('<li style="display:flex;align-items:flex-start;gap:8px;'
                         'font-size:13px;line-height:1.5;color:#5C7A87">%s<span>%s</span></li>'
                         % (check("#21C8DC", 13), f) for f in t["feats"]),
                 t["sub"], t["price"], BOOK)
    stats = "".join(
        '<div style="flex:1;padding-right:30px">'
        '<div class="d n" style="font-size:32px;color:#00707F">%s</div>'
        '<div style="font-size:13px;color:#5C7A87;margin-top:6px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:#F4FAFB">
  <header style="display:flex;align-items:center;justify-content:space-between;
    padding:22px %dpx;background:#FFFFFF;border-bottom:1px solid #DCEAEE">
    <img src="logo_full.png" alt="오션스타" style="height:50px;width:auto">
    <nav style="display:flex;gap:32px">%s</nav>
    <div style="display:flex;align-items:center;gap:12px">
      <a href="#" style="font-size:13.5px;color:#4E7383;border:1px solid #D7E7EC;border-radius:4px;padding:9px 13px">EN</a>
      <a href="#" style="font-size:13.5px;color:#4E7383;border:1px solid #D7E7EC;border-radius:4px;padding:9px 13px">내 예약 관리</a>
      <button class="cta" style="height:44px;padding:0 22px;font-size:14px">%s</button>
    </div>
  </header>
  <section style="display:grid;grid-template-columns:1fr 800px;gap:56px;align-items:center;
    min-height:632px;padding:0 0 0 %dpx;background:#FFFFFF">
    <div style="padding:64px 0">
      <div class="lab">%s</div>
      <h1 class="d" style="font-size:54px;line-height:1.2;margin-top:18px">%s<br>%s</h1>
      <p style="font-size:18px;line-height:1.85;color:#5C7A87;max-width:500px;
        margin-top:20px">%s</p>
      <div style="display:flex;gap:12px;margin-top:32px">
        <button class="cta">%s</button><button class="ghost">%s</button>
      </div>
    </div>
    <div style="height:560px;border-radius:28px 0 0 28px;overflow:hidden;background:#DCEAEE">
      <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;
        object-position:right center">
    </div>
  </section>
  <div style="display:flex;padding:36px %dpx;background:#FFFFFF;
    border-top:1px solid #DCEAEE;border-bottom:1px solid #DCEAEE">%s</div>
  <section style="padding:92px %dpx 104px">
    <h2 class="d" style="font-size:46px;line-height:1.25">%s</h2>
    <p style="font-size:16px;color:#5C7A87;margin-top:12px;margin-bottom:38px">%s</p>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px">%s</div>
  </section>
</div>""" % (W, PAD,
             "".join('<a href="#" style="font-size:15px;font-weight:%d;color:%s">%s</a>'
                     % (700 if i == 0 else 400, "#082733" if i == 0 else "#5C7A87", n)
                     for i, n in enumerate(NAV)),
             HBOOK, PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
             HERO["cta"], HERO["cta2"], IMG, ALT, PAD, stats, PAD,
             TOUR["title"], TOUR["subtitle"], cards)
    return doc("새-2 · 심해 (밝은판)", fonts, css, body)

if __name__ == "__main__":
    for name, fn in [("New1.dc.html", journal), ("New2_dark.dc.html", deepsea_dark),
                     ("New2.dc.html", deepsea_light),
                     ("New3.dc.html", sunshine), ("New4.dc.html", grid),
                     ("New5.dc.html", seaglass)]:
        io.open(name, "w", encoding="utf-8").write(fn())
        print(name, "ok")
