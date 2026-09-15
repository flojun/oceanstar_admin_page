# -*- coding: utf-8 -*-
"""새-7 · 차터. 보내주신 요트 렌탈 디자인의 어법을 참고했다.

가져온 구조
· 헤더 가운데에 로고 배지가 바 아래로 살짝 내려앉는다
· 히어로 아래쪽 경계에 흰 예약 바가 걸쳐 떠 있다 (이 디자인의 핵심)
· 상품 카드는 가운데 정렬 제목 + 작은 스펙 칩 + 가격 칩 + 아웃라인 버튼
· 목록 위에 '몇 개 / 정렬' 줄과 헤어라인

색은 브랜드에 맞게 바꿨다. 딥 마린 네이비에 골드 하나. 네이비는 로고에서 온 색이고
골드는 아이콘과 가격에만 쓴다. 원본의 청록 바다는 우리 보트 영상이 대신한다.

배와 제목이 겹치지 않는 이유
영상에서 배는 가로 33~97% 자리에 있다. 활자는 왼쪽 열에만 두고, 예약 바가 히어로
아래를 덮으므로 배의 아래쪽은 어차피 바에 가려진다. 겹치는 자리가 없다.
"""
import io
from build_v2 import HERO, STATS, TOUR, TOURS

T = TOURS
W, PAD = 1440, 120
IMG, ALT = "hero_boat.webp", "와이키키 앞바다의 오션스타 51인승 루프탑 보트"

NAVY, INK, GOLD = "#0B2A4A", "#14202B", "#C9913D"
PAPER, SOFT, MUTED, RULE = "#FFFFFF", "#F4F7F9", "#6B7A87", "#E4E9ED"

from build_v2 import NAV  # noqa: E402  헤더 항목은 오션스타 홈과 동일


def ico(path, color=GOLD, size=15):
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="%s" '
            'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" '
            'style="flex:none" aria-hidden="true">%s</svg>') % (size, size, color, path)


BOAT = '<path d="M3 17.5h18l-2 3.5H5l-2-3.5Z"/><path d="M5 17.5V9l7-4 7 4v8.5"/>'
CAL = '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>'
CLOCK = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'
USERS = ('<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>'
         '<path d="M16 5.4a3.4 3.4 0 0 1 0 5.2M17.5 14.4A6 6 0 0 1 21.5 20"/>')
PIN = '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'
CHEV = ('<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%s" '
        'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" '
        'aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>') % MUTED


def plain(badge):
    out = "".join(c for c in badge if ord(c) < 0x2000 or 0xAC00 <= ord(c) <= 0xD7A3)
    return out.replace("!", "").strip()


def field(label, icon, value, last=False):
    bd = "" if last else "border-right:1px solid %s;" % RULE
    return """
<div style="flex:1;padding:0 22px;%s">
  <div style="font-size:11.5px;color:%s;letter-spacing:.02em">%s</div>
  <div style="display:flex;align-items:center;gap:9px;margin-top:9px">
    %s<span style="font-size:14.5px;font-weight:700;color:%s;flex:1;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">%s</span>%s
  </div>
</div>""" % (bd, MUTED, label, icon, INK, value, CHEV)


def booking_bar():
    return """
<div style="display:flex;align-items:center;background:%s;border:1px solid %s;
  border-radius:6px;box-shadow:0 2px 6px rgba(11,42,74,.07),0 20px 46px rgba(11,42,74,.16);
  padding:22px 20px">
  %s%s%s%s
  <button style="flex:none;margin-left:18px;background:%s;color:#fff;border:0;
    border-radius:4px;height:56px;padding:0 30px;font-size:15px;font-weight:700;
    cursor:pointer;font-family:inherit">예약 가능 확인</button>
</div>""" % (PAPER, RULE,
             field("투어", ico(BOAT), "와이키키 거북이 스노클링"),
             field("날짜", ico(CAL), "2026. 09. 10"),
             field("출발", ico(CLOCK), "1부 08:00"),
             field("인원", ico(USERS), "성인 2명", last=True),
             NAVY)


def chip(text, icon=None):
    return ('<span style="display:inline-flex;align-items:center;gap:7px;background:%s;'
            'border:1px solid %s;border-radius:4px;padding:7px 11px;font-size:12px;'
            'color:%s;line-height:1.3">%s%s</span>'
            ) % (SOFT, RULE, INK, (icon + " ") if icon else "", text)


def card(t, wide=False):
    hot = t.get("hot")
    navy = t.get("navy")
    border = ("2px solid %s" % GOLD) if hot else ("1px solid %s" % RULE)
    sh = ("0 2px 6px rgba(11,42,74,.07),0 22px 48px rgba(11,42,74,.16)" if hot
          else "0 1px 3px rgba(11,42,74,.05),0 10px 24px rgba(11,42,74,.08)")
    price_chip = ('<span style="display:inline-flex;align-items:center;gap:6px;'
                  'background:%s;border-radius:4px;padding:9px 14px;white-space:nowrap">'
                  '<span style="font-size:13px;font-weight:700;color:%s">₩</span>'
                  '<span class="n" style="font-size:15px;font-weight:700;color:%s">%s</span>'
                  '<span style="font-size:11.5px;color:%s">%s</span></span>'
                  ) % (NAVY if hot else SOFT, GOLD, "#fff" if hot else INK,
                       t["price"].replace("₩", ""),
                       "rgba(255,255,255,.72)" if hot else MUTED, "/ 1인")
    chips = "".join(chip(f) for f in t["feats"]) + chip("와이키키, 하와이", ico(PIN, GOLD, 13))
    body = """
  <div style="padding:20px 20px 22px;display:flex;flex-direction:column;flex:1">
    <div style="text-align:center">
      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;color:%s">%s</div>
      <h3 style="font-size:17px;font-weight:700;line-height:1.45;color:%s;
        margin-top:9px">%s</h3>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:15px;
      justify-content:center">%s</div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;
      margin-top:auto;padding-top:18px">
      %s
      <button style="background:#fff;color:%s;border:1px solid %s;border-radius:4px;
        height:38px;padding:0 18px;font-size:13px;font-weight:700;cursor:pointer;
        font-family:inherit;white-space:nowrap;flex:none">%s</button>
    </div>
  </div>""" % (GOLD, plain(t["badge"]), INK, t["name"], chips, price_chip,
               NAVY, RULE, TOUR["more"])
    img = ('<div style="%s"><img src="%s" alt="%s" style="width:100%%;height:100%%;'
           'object-fit:cover"></div>') % (
        "height:100%" if wide else "height:186px;flex:none", t["img"], t["name"])
    shell = ("display:grid;grid-template-columns:206px 1fr" if wide
             else "display:flex;flex-direction:column")
    return ('<article style="%s;background:%s;border:%s;border-radius:6px;box-shadow:%s;'
            'overflow:hidden">%s%s</article>') % (shell, PAPER, border, sh, img, body)


def charter():
    stats = "".join(
        '<div style="flex:1;text-align:center">'
        '<div class="d n" style="font-size:30px;font-weight:700;color:%s">%s</div>'
        '<div style="font-size:12px;color:%s;margin-top:7px;letter-spacing:.04em">%s</div>'
        '</div>' % (NAVY, n, MUTED, l) for n, l in STATS)
    grid = ('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px">'
            '%s</div>'
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));'
            'gap:22px;margin-top:22px">%s</div>') % (
        "".join(card(t) for t in T[:3]),
        "".join(card(t, wide=True) for t in T[3:]))
    body = """
<div style="width:%dpx;background:%s;color:%s">
  <header style="position:relative;display:flex;align-items:center;
    justify-content:space-between;height:70px;padding:0 %dpx;background:%s;z-index:8">
    <nav style="display:flex;gap:26px;align-items:center">%s</nav>
    <div style="display:flex;gap:10px;align-items:center">
      <a href="#" style="font-size:13px;color:%s;border:1px solid %s;border-radius:4px;padding:9px 13px">EN</a>
      <a href="#" style="font-size:13px;color:%s;border:1px solid %s;border-radius:4px;padding:9px 13px">내 예약 관리</a>
      <button style="background:%s;color:#fff;border:0;border-radius:4px;height:40px;padding:0 20px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit">투어 예약하기</button>
    </div>
    <a href="#" aria-label="오션스타 홈" style="position:absolute;left:50%%;top:12px;
      transform:translateX(-50%%);background:#fff;border-radius:0 0 60px 60px;
      padding:10px 30px 16px;box-shadow:0 10px 22px rgba(11,42,74,.12)">
      <img src="logo_full.png" alt="오션스타" style="height:56px;width:auto">
    </a>
  </header>
  <section style="position:relative;height:590px;overflow:hidden;margin-top:-70px">
    <img src="%s" alt="%s" style="position:absolute;inset:0;width:100%%;height:100%%;
      object-fit:cover">
    <div style="position:absolute;inset:0;background:linear-gradient(100deg,
      rgba(11,42,74,.80) 0%%,rgba(11,42,74,.52) 44%%,rgba(11,42,74,.12) 76%%,
      rgba(11,42,74,.06) 100%%)"></div>
    <div style="position:absolute;left:%dpx;top:150px;width:560px;z-index:3;color:#fff">
      <div style="display:flex;align-items:center;gap:14px">
        <span style="width:46px;height:1px;background:%s"></span>
        <span style="font-size:11.5px;font-weight:700;letter-spacing:.22em;
          color:%s">%s</span>
      </div>
      <h1 class="d" style="font-size:42px;line-height:1.38;margin-top:18px;
        font-weight:800">%s<br>%s</h1>
      <p style="font-size:14.5px;line-height:1.85;color:rgba(255,255,255,.82);
        margin-top:16px;max-width:420px">%s</p>
      <div style="display:flex;align-items:center;gap:26px;margin-top:26px">
        <button style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.65);
          border-radius:4px;height:48px;padding:0 26px;font-size:14px;font-weight:600;
          cursor:pointer;font-family:inherit">%s</button>
        <a href="#" style="font-size:14px;color:#fff;border-bottom:1px solid
          rgba(255,255,255,.6);padding-bottom:3px">%s</a>
      </div>
    </div>
  </section>
  <div style="padding:0 %dpx;margin-top:-62px;position:relative;z-index:6">%s</div>
  <div style="display:flex;padding:52px %dpx 46px">%s</div>
  <section style="padding:0 %dpx 100px">
    <div style="display:flex;align-items:center;gap:20px;padding-bottom:20px;
      border-bottom:1px solid %s">
      <div style="font-size:14px;color:%s">
        <b style="color:%s;font-size:15px">%d가지</b> 프로그램이 예약 가능합니다</div>
      <div style="flex:1;height:1px;background:%s"></div>
      <div style="display:flex;align-items:center;gap:9px;font-size:13px;color:%s">
        <span>정렬</span>
        <span style="display:inline-flex;align-items:center;gap:8px;background:#fff;
          border:1px solid %s;border-radius:4px;padding:8px 12px;color:%s;
          font-weight:700">인기순%s</span>
      </div>
    </div>
    <div style="margin-top:28px">%s</div>
  </section>
</div>""" % (W, PAPER, INK, PAD, PAPER,
             "".join('<a href="#" style="font-size:13.5px;color:%s;font-weight:%d">%s</a>'
                     % (INK if i == 0 else MUTED, 700 if i == 0 else 400, n)
                     for i, n in enumerate(NAV)),
             INK, RULE, INK, RULE, NAVY,
             IMG, ALT, PAD, GOLD, GOLD, HERO["badge"], HERO["t1"], HERO["t2"],
             HERO["desc"], HERO["cta"], HERO["cta2"],
             PAD, booking_bar(), PAD, stats, PAD, RULE, MUTED, INK, len(T), RULE,
             MUTED, RULE, INK, CHEV, grid)
    css = """/*__FONTS__*//*__FONTS_END__*/
body{background:%s;color:%s;font-family:'Pretendard','Poppins',sans-serif;
     word-break:keep-all}
.d{font-family:'SUIT',sans-serif;letter-spacing:-.015em}
.n{font-variant-numeric:tabular-nums}
""" % (PAPER, INK)
    return """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>새-7 · 차터</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap">
  <style>
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,p{margin:0;padding:0}
a{text-decoration:none}
img{display:block;max-width:100%%}
%s
  </style>
</helmet>
%s
</x-dc>
</body>
</html>
""" % (css, body)


if __name__ == "__main__":
    io.open("New7.dc.html", "w", encoding="utf-8").write(charter())
    print("New7.dc.html ok")
