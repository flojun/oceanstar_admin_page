# -*- coding: utf-8 -*-
"""새-6 · 에디토리얼 투어. Poveda 템플릿의 조판 어법 위에 투어 상품지의 골격을 얹었다.

유지한 것 — 좋다고 한 프로그램 소개 방식 그대로
· 사진과 활자가 좌우로 번갈아 앉는 전면 편집형 행
· 오버사이즈 대제목 + 아주 작고 자간 넓은 대문자 레이블
· 카드도 그림자도 라운드도 없이 헤어라인으로만 나눈다

투어형으로 바꾼 것
· 상세로 들어가기 전에 5가지를 한 화면에서 견주는 '투어 한눈에 보기' 표
· 각 행에 운영 시간 / 정원 / 요금 기준 스펙 스트립을 넣어 상품지의 정보 밀도를 만든다
· 요금 옆에 각진 예약 버튼을 두어 행마다 예약으로 빠질 수 있게 한다
· 끝에 전면 사진 예약 유도 띠

정보는 전부 기존 데이터에서 끌어왔다. 없는 값은 지어내지 않고
build_v2 가 쓰는 [확정 필요] 표기를 그대로 노출한다.

히어로에서 제목이 배를 가리지 않게 하는 방법은 그대로다.
영상이 2.076:1 이라 높이를 1440/2.076 = 694px 근처로 잡으면 가로가 잘리지 않고,
배는 y 171~483 에 온전히 들어온다. 활자를 그 아래 띠에 놓아 겹치지 않게 한다.
"""
import io
import re
from build_v2 import HERO, NAV, STATS, TOUR, TOURS

T = TOURS
W, PAD = 1440, 120
IMG, ALT = "hero_boat.webp", "와이키키 앞바다의 오션스타 51인승 루프탑 보트"
CLOSE_IMG = "turtle.jpg"

INK, PAPER, MUTED, ACCENT, RULE = "#10222B", "#FAFBFB", "#63757E", "#0A6E86", "#E2E6E7"

TIME = re.compile(r"\d{2}:\d{2}|시간")
# '인' 앞에 숫자가 있어야 인원이다. 그냥 '인'만 보면 '와인 제공'이 정원으로 잡힌다.
PARTY = re.compile(r"\d+\s*인")


def plain(badge):
    out = "".join(c for c in badge if ord(c) < 0x2000 or 0xAC00 <= ord(c) <= 0xD7A3)
    return out.replace("!", "").strip()


def party_feat(f):
    return bool(PARTY.search(f))


def spec(t):
    """운영 시간 / 정원 / 요금 기준. 전부 기존 feats·sub 에서 읽어온다."""
    times = [f for f in t["feats"] if TIME.search(f)]
    party = [f for f in t["feats"] if party_feat(f)]
    if times:
        when = " · ".join(f.replace(" - ", "–") for f in times)
    elif "커스터마이징" in " ".join(t["feats"]):
        when = "옵션·일정 커스터마이징"
    else:
        when = "[운영 시간 확정 필요]"
    who = party[0] if party else "51인승 루프탑 보트"
    unit = "팀 단위 대관" if "팀" in t["sub"] else "성인 1인 기준"
    return when, who, unit


def includes(t):
    """스펙으로 올라간 시간·정원 항목을 뺀 나머지가 포함 사항이다."""
    return [f for f in t["feats"] if not TIME.search(f) and not party_feat(f)]


COLS = "56px 1.9fr 1.35fr 1.15fr .95fr 84px"


def table():
    """상세를 보기 전에 5가지를 한 눈에 견주는 인덱스. 투어 상품지의 핵심 장치다."""
    head = "".join('<div class="lab">%s</div>' % h
                   for h in ["NO", "프로그램", "운영 시간", "정원", "성인 요금", ""])
    out = ('<div style="display:grid;grid-template-columns:%s;gap:24px;align-items:center;'
           'padding:0 0 16px;border-bottom:1px solid %s">%s</div>' % (COLS, INK, head))
    for i, t in enumerate(T):
        when, who, _ = spec(t)
        out += ('<a href="#t%d" style="display:grid;grid-template-columns:%s;gap:24px;'
                'align-items:center;padding:26px 0;border-bottom:1px solid %s;color:%s">'
                '<span class="d n" style="font-size:15px;color:%s">%02d</span>'
                '<span class="d" style="font-size:20px;line-height:1.35">%s</span>'
                '<span style="font-size:14px;color:%s">%s</span>'
                '<span style="font-size:14px;color:%s">%s</span>'
                '<span class="d n" style="font-size:19px">%s</span>'
                '<span class="lab" style="color:%s;text-align:right">보기</span></a>'
                ) % (i + 1, COLS, RULE, INK, ACCENT, i + 1, t["name"],
                     MUTED, when, MUTED, who, t["price"], ACCENT)
    return out


def rows():
    out = ""
    for i, t in enumerate(T):
        left = i % 2 == 0
        when, who, unit = spec(t)
        img = ('<img src="%s" alt="%s" style="width:100%%;height:470px;'
               'object-fit:cover">') % (t["img"], t["name"])
        cells = "".join(
            '<div><div class="lab">%s</div>'
            '<div style="font-size:15px;line-height:1.5;margin-top:9px">%s</div></div>'
            % (k, v) for k, v in (("운영 시간", when), ("정원", who), ("요금 기준", unit)))
        feats = "".join(
            '<li style="font-size:14.5px;line-height:1.6;color:%s;padding-left:20px;'
            'position:relative"><span style="position:absolute;left:0;top:9px;width:9px;'
            'height:1px;background:%s"></span>%s</li>' % (MUTED, ACCENT, f)
            for f in includes(t))
        txt = """
<div style="padding:%s">
  <div style="display:flex;align-items:baseline;gap:16px">
    <span class="d n" style="font-size:40px;color:%s">%02d</span>
    <span class="lab">%s</span>
  </div>
  <h3 class="d" style="font-size:42px;line-height:1.28;margin-top:16px">%s</h3>
  <p style="font-size:16px;line-height:1.95;color:%s;margin-top:16px;max-width:470px">%s</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:26px;
    padding:20px 0;border-top:1px solid %s;border-bottom:1px solid %s">%s</div>
  <div class="lab" style="margin-top:24px">포함 사항</div>
  <ul style="margin-top:12px;display:grid;gap:10px">%s</ul>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;
    margin-top:32px">
    <div>
      <div class="lab" style="color:%s">%s</div>
      <div class="d n" style="font-size:36px;margin-top:8px">%s</div>
    </div>
    <div style="display:flex;align-items:center;gap:22px">
      <a href="#" class="cta">%s</a>
      <a href="#" class="btn">%s</a>
    </div>
  </div>
</div>""" % ("0 0 0 78px" if left else "0 78px 0 0", RULE, i + 1, plain(t["badge"]),
             t["name"], MUTED, t["desc"], RULE, RULE, cells, feats,
             # 스펙 스트립엔 짧은 단위, 값 위엔 단서까지 붙은 원문을 둔다.
             MUTED, t["sub"], t["price"], TOUR["more"], TOUR["book"])
        a, b = (img, txt) if left else (txt, img)
        out += ('<section id="t%d" style="display:grid;grid-template-columns:1fr 1fr;'
                'align-items:center;padding:80px %dpx;border-top:1px solid %s">%s%s</section>'
                ) % (i + 1, PAD, RULE, a, b)
    return out


def editorial():
    stats = "".join(
        '<div style="flex:1"><div class="d n" style="font-size:38px">%s</div>'
        '<div class="lab" style="margin-top:10px">%s</div></div>' % (n, l)
        for n, l in STATS)
    body = """
<div style="width:%dpx;background:%s;color:%s">
  <section style="position:relative;height:640px;overflow:hidden">
    <img src="%s" alt="%s" style="position:absolute;inset:0;width:100%%;height:100%%;
      object-fit:cover">
    <div style="position:absolute;left:0;right:0;top:0;height:190px;
      background:linear-gradient(180deg,rgba(16,34,43,.46),rgba(16,34,43,0))"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:320px;
      background:linear-gradient(180deg,rgba(16,34,43,0) 0%%,rgba(16,34,43,.30) 34%%,
      rgba(16,34,43,.72) 72%%,rgba(16,34,43,.86) 100%%)"></div>
    <header style="position:absolute;left:0;right:0;top:0;z-index:3;display:flex;
      align-items:center;justify-content:space-between;padding:30px %dpx">
      <img src="logo_full.png" alt="오션스타"
        style="height:52px;width:auto;filter:brightness(0) invert(1)">
      <nav style="display:flex;gap:38px">%s</nav>
      <div style="display:flex;align-items:center;gap:24px">
        <a href="#" class="nav">EN</a>
        <a href="#" class="nav">내 예약 관리</a>
        <a href="#" class="nav" style="color:#10222B;background:#fff;padding:12px 20px">투어 예약하기</a>
      </div>
    </header>
    <div style="position:absolute;left:%dpx;right:%dpx;bottom:26px;z-index:3;color:#fff">
      <div class="lab" style="color:rgba(255,255,255,.80)">%s</div>
      <h2 style="font-size:27px;line-height:1.45;margin-top:14px;
        font-weight:400">%s</h2>
      <h1 class="d" style="font-size:62px;font-weight:800;line-height:1.18;
        margin-top:8px">%s</h1>
    </div>
  </section>
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:60px;
    padding:44px %dpx 40px">
    <p style="font-size:17px;line-height:1.95;color:%s;max-width:560px">%s</p>
    <a href="#" class="cta">%s</a>
  </div>
  <div style="display:flex;gap:44px;padding:46px %dpx;border-bottom:1px solid %s">%s</div>
  <section style="padding:96px %dpx 0">
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:60px">
      <div>
        <div class="lab">%s</div>
        <h2 class="d" style="font-size:56px;line-height:1.24;margin-top:18px">%s</h2>
      </div>
      <p style="font-size:15px;line-height:1.9;color:%s;max-width:330px;
        padding-bottom:10px">%s</p>
    </div>
    <div style="margin-top:52px">%s</div>
  </section>
  <section style="padding:96px %dpx 34px">
    <div class="lab">%s</div>
    <h2 class="d" style="font-size:44px;line-height:1.28;margin-top:16px">%s</h2>
  </section>
  %s
  <section style="position:relative;height:340px;overflow:hidden">
    <img src="%s" alt="%s" style="position:absolute;inset:0;width:100%%;height:100%%;
      object-fit:cover">
    <div style="position:absolute;inset:0;background:rgba(16,34,43,.62)"></div>
    <div style="position:relative;z-index:2;height:100%%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:18px;color:#fff;text-align:center">
      <div class="lab" style="color:rgba(255,255,255,.80)">%s</div>
      <h2 class="d" style="font-size:44px;line-height:1.3;max-width:780px">%s</h2>
      <a href="#" class="btn" style="background:#fff;color:%s;margin-top:8px">%s</a>
    </div>
  </section>
</div>""" % (W, PAPER, INK, IMG, ALT, PAD,
             "".join('<a href="#" class="nav">%s</a>' % n for n in NAV),
             PAD, PAD, HERO["badge"], HERO["t1"], HERO["t2"],
             PAD, MUTED, HERO["desc"], HERO["cta"],
             PAD, RULE, stats,
             PAD, "투어 한눈에 보기", TOUR["title"], MUTED, TOUR["subtitle"], table(),
             PAD, "프로그램 상세", "다섯 가지 바다, 하나씩 펼쳐 보기", rows(),
             CLOSE_IMG, "하와이 바다거북과 함께하는 스노클링",
             HERO["badge"], HERO["t1"], INK, HERO["cta"])
    css = """/*__FONTS__*//*__FONTS_END__*/
body{background:%s;color:%s;font-family:'Pretendard','Poppins',sans-serif;
     word-break:keep-all;font-weight:400}
.d{font-family:'SUIT',sans-serif;font-weight:700;letter-spacing:-.015em}
.lab{font-family:'Poppins','Pretendard',sans-serif;font-size:11.5px;font-weight:500;
     letter-spacing:.20em;text-transform:uppercase;color:%s}
.nav{font-size:13.5px;font-weight:400;letter-spacing:.14em;text-transform:uppercase;
     color:rgba(255,255,255,.9)}
.cta{display:inline-block;font-size:13.5px;font-weight:500;letter-spacing:.14em;
     text-transform:uppercase;color:%s;border-bottom:1px solid %s;padding-bottom:6px;
     white-space:nowrap}
/* 이 디자인엔 라운드가 없다. 예약 버튼도 각진 잉크 사각형으로 둔다. */
.btn{display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 30px;
     background:%s;color:#fff;font-size:14px;font-weight:600;letter-spacing:.02em;
     white-space:nowrap}
""" % (PAPER, INK, MUTED, ACCENT, ACCENT, INK)
    return """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>새-6 · 에디토리얼 투어</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap">
  <style>
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,p,ul,li{margin:0;padding:0}
li{list-style:none}
a{text-decoration:none}
img{display:block;max-width:100%%}
.n{font-variant-numeric:tabular-nums}
%s
  </style>
</helmet>
%s
</x-dc>
</body>
</html>
""" % (css, body)


def demo():
    """스펙을 데이터에서 제대로 뽑아내는지. 이게 틀리면 표가 통째로 거짓말이 된다."""
    when, who, unit = spec(T[0])          # 거북이 스노클링
    assert when == "1부 08:00–11:00 · 2부 11:00–14:00", when
    assert who == "51인승 루프탑 보트", who
    assert unit == "성인 1인 기준", unit
    assert includes(T[0]) == ["거북이 스노클링 + 해양 4종",
                              "스노클 장비/구명조끼, 음료/간식"], includes(T[0])
    when, who, unit = spec(T[3])          # 프라이빗 단독 대관
    assert when == "옵션·일정 커스터마이징", when
    assert who == "우리 일행 단독 탑승 (최대 30인)", who
    assert unit == "팀 단위 대관", unit
    when, _, _ = spec(T[2])               # 패러세일링/제트스키
    assert when == "07:30–14:30", when
    # '와인 제공'이 정원으로 새지 않는지. 한 번 당했던 자리다.
    assert spec(T[1])[1] == "51인승 루프탑 보트", spec(T[1])[1]
    assert "치즈보드와 와인 제공" in includes(T[1]), includes(T[1])
    print("demo ok")


if __name__ == "__main__":
    demo()
    io.open("New6.dc.html", "w", encoding="utf-8").write(editorial())
    print("New6.dc.html ok")
