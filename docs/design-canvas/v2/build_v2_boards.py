# -*- coding: utf-8 -*-
"""2차 시안 A(몰입) / B(항해) 데스크탑 1440 + 모바일 375."""
import io
from build_v2 import HERO, NAV, STATS, TOUR, TOURS, page

W, PAD, MW, MP = 1440, 120, 375, 16
T = TOURS

_STOPS = [0, .10, .20, .30, .40, .50, .60, .68, .78, 1.0]


def top_scrim():
    """투명 헤더가 앉는 구간만 받치는 그라데이션.

    완전 투명으로 두면 글자가 그날 하늘 밝기에 좌우된다. 그렇다고 흰 띠를 깔면
    헤더가 다시 분리돼 보인다. 그래서 헤더 높이(76px)까지는 60%를 유지해 대비를
    확보하고, 그 아래로는 기울기가 0이 되게 풀어 경계를 남기지 않는다.
    60%면 사진이 40% 비쳐 하늘과 구름이 그대로 보이면서도 네이비 글자가 9:1이다."""
    stops = [(0, .60), (.20, .60), (.32, .59), (.42, .545), (.52, .45),
             (.62, .33), (.72, .20), (.82, .09), (.92, .02), (1.0, 0)]
    return "linear-gradient(180deg,%s)" % ",".join(
        "rgba(255,255,255,%.3f) %d%%" % (a, round(t * 100)) for t, a in stops)


def soft_fade(deg, full_at=.78, reverse=False, amax=1.0):
    """알파가 직선으로 오르다 어느 지점에서 딱 멈추면, 눈은 그 꺾인 자리를 선으로 본다
    (마하 밴드). 그래서 시작과 끝의 기울기가 0이 되는 smoothstep 곡선으로 착지시킨다.
    reverse=True 는 흰색에서 시작해 투명으로 빠지는 방향."""
    pts = []
    for t in _STOPS:
        s = min(t / full_at, 1.0)
        a = s * s * (3 - 2 * s)
        if reverse:
            a = 1 - a
        pts.append("rgba(255,255,255,%.3f) %d%%" % (a * amax, round(t * 100)))
    return "linear-gradient(%ddeg,%s)" % (deg, ",".join(pts))


# ---------------------------------------------------------------- 공통 부품
def header(overlay=False):
    """overlay=True 면 히어로 영상 위에 얹히는 투명 헤더가 된다.

    바탕이 사진이라 비활성 메뉴를 --muted 로 두면 4.2:1 로 떨어진다.
    한 단계 진한 --text 로 올려 5.6:1 을 확보한다. 칩도 흰 테두리 대신
    옅은 네이비 테두리라야 밝은 스크림 위에서 윤곽이 잡힌다."""
    sub = "var(--text)" if overlay else "var(--muted)"
    chip_bg = "rgba(255,255,255,.55)" if overlay else "#fff"
    chip_line = "rgba(10,63,102,.22)" if overlay else "var(--border)"
    shell = ("position:absolute;left:0;right:0;top:0;background:transparent"
             if overlay else
             "position:relative;background:var(--surface);"
             "border-bottom:1px solid var(--border)")
    nav = "".join(
        '<a href="#" style="font-size:16px;font-weight:%d;color:%s;padding-bottom:4px;'
        'border-bottom:%s">%s</a>' % (
            700 if i == 0 else 500, "var(--navy)" if i == 0 else sub,
            "2px solid var(--cyan)" if i == 0 else "2px solid transparent", it)
        for i, it in enumerate(NAV))
    return """
<header style="height:76px;display:flex;align-items:center;justify-content:space-between;
  padding:0 %dpx;z-index:6;%s">
  <div style="display:flex;align-items:center;gap:46px">
    <a href="#" aria-label="오션스타 홈" style="display:flex;align-items:center;margin-left:30px">
      <img src="logo_full.png" alt="오션스타 하와이 거북이 스노클링"
        style="height:58px;width:auto;display:block">
    </a>
    <nav style="display:flex;gap:30px;align-items:center">%s</nav>
  </div>
  <div style="display:flex;gap:10px;align-items:center">
    <button class="btn btn-line" style="height:42px;padding:0 16px;font-size:14px;
      border-radius:10px;background:%s;color:var(--navy);border-color:%s">EN</button>
    <button class="btn btn-line" style="height:42px;padding:0 16px;font-size:14px;
      border-radius:10px;background:%s;color:var(--navy);border-color:%s">내 예약 관리</button>
    <button class="btn btn-fill" style="height:42px;padding:0 22px;font-size:15px">투어 예약하기</button>
  </div>
</header>""" % (PAD, shell, nav, chip_bg, chip_line, chip_bg, chip_line)


def statbar():
    cells = ""
    for i, (n, l) in enumerate(STATS):
        bd = "" if i == 3 else "border-right:1px solid var(--border);"
        c = "var(--primary)" if i in (0, 1) else "var(--navy)"
        cells += ('<div style="flex:1;padding:26px 36px;%s">'
                  '<div class="num" style="font-size:28px;font-weight:700;line-height:1.15;'
                  'color:%s">%s</div>'
                  '<div style="font-size:14px;color:var(--muted);margin-top:6px">%s</div></div>'
                  ) % (bd, c, n, l)
    return ('<div style="display:flex;background:#ffffff;border:1px solid var(--border);'
            'border-radius:14px;box-shadow:var(--e3);overflow:hidden">%s</div>') % cells


def sect_head():
    return """
<div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:40px">
  <div>
    <h2 style="font-size:40px;font-weight:700;line-height:1.28;letter-spacing:-.01em">%s</h2>
    <p style="font-size:17px;line-height:1.7;color:var(--soft-text);margin-top:12px">%s</p>
  </div>
  <a href="#" style="font-size:15px;font-weight:700;padding-bottom:10px">%s</a>
</div>""" % (TOUR["title"], TOUR["subtitle"], TOUR["more"])


def label(text):
    """뱃지 문구에서 이모지와 느낌표를 걷어낸다. 사진 위에 얹힌 이모지 알약과
    느낌표는 아마추어 티가 가장 크게 나는 자리다. 문구 자체는 그대로 둔다."""
    out = "".join(c for c in text if ord(c) < 0x2000 or 0xAC00 <= ord(c) <= 0xD7A3)
    return out.replace("!", "").strip()


def checklist(feats, tone="light"):
    """운영 중인 사이트와 같은 체크 목록. 옅은 면 위에 체크 마크 + 한 줄씩."""
    if tone == "navy":
        bg, bd, tc, mk = ("rgba(255,255,255,.07)", "rgba(255,255,255,.14)",
                          "#e3f1f8", "var(--sky)")
    else:
        bg, bd, tc, mk = "var(--soft)", "var(--border)", "var(--soft-text)", "var(--cyan)"
    rows = ""
    for f in feats:
        rows += """
    <li style="display:flex;align-items:flex-start;gap:9px;font-size:13.5px;
      line-height:1.5;color:%s">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="%s"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
        style="flex:none;margin-top:2px" aria-hidden="true"><path d="m4.5 12.5 5 5 10-11"/></svg>
      <span>%s</span></li>""" % (tc, mk, f)
    return ('<ul style="list-style:none;margin:14px 0 0;padding:15px 16px;background:%s;'
            'border:1px solid %s;border-radius:10px;display:grid;gap:9px">%s</ul>'
            ) % (bg, bd, rows)


def card(t, wide=False):
    """전문가 톤으로 정리한 카드.

    · 뱃지를 사진에서 떼어내 본문 위 작은 활자 레이블로 내린다
    · 가격은 26/800 에서 22/700 으로. 굵은 큰 숫자는 할인 전단처럼 읽힌다
    · 굵기를 800 한 단계로 도배하지 않고 700/500/400 으로 층을 만든다
    · 꽉 찬 파란 버튼 5개 대신 가격 줄 오른쪽에 작은 아웃라인 버튼 하나
      (채움 버튼은 히어로와 헤더에만 남겨 위계를 지킨다)
    · 라운드 20 -> 14, 광택 그라데이션 제거. 깊이는 그림자와 바닥 면이 만든다
    """
    navy = t.get("navy")
    hot = t.get("hot")
    bg = "var(--navy)" if navy else "#ffffff"
    bd = "none" if navy else "1px solid var(--border)"
    tc = "#fff" if navy else "var(--navy)"
    mc = "var(--on-navy)" if navy else "var(--muted)"
    dv = "rgba(255,255,255,.16)" if navy else "var(--inner)"
    sh = ("var(--e-navy)" if navy else
          "var(--e3)" if hot else "var(--e2)")
    if navy:
        lab = ('background:var(--sky);color:var(--navy);padding:5px 9px;border-radius:6px')
        btn = ("background:transparent;color:var(--sky);"
               "border:1.5px solid rgba(255,255,255,.42)")
    elif hot:
        lab = "background:var(--primary);color:#fff;padding:5px 9px;border-radius:6px"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    else:
        lab = "color:var(--primary);letter-spacing:.06em"
        btn = ("background:#fff;color:var(--primary);"
               "border:1.5px solid var(--outline)")
    body = """
  <div style="display:flex;flex-direction:column;flex:1;padding:22px 22px 24px">
    <span style="align-self:flex-start;font-size:11.5px;font-weight:700;
      line-height:1;%s">%s</span>
    <h3 style="font-size:18px;font-weight:700;line-height:1.45;color:%s;
      margin-top:11px">%s</h3>
    <p style="font-size:13.5px;font-weight:400;line-height:1.7;color:%s;
      margin-top:8px">%s</p>
    %s
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;
      margin-top:auto;padding-top:20px">
      <div style="padding-top:18px;border-top:1px solid %s;flex:1">
        <div class="num" style="font-size:12px;font-weight:400;color:%s;
          margin-top:16px">%s</div>
        <div><span class="num" style="font-size:22px;font-weight:700;line-height:1.2;
          color:%s">%s</span></div>
      </div>
      <button class="btn" style="height:40px;padding:0 18px;font-size:14px;border-radius:10px;
        flex:none;%s">%s</button>
    </div>
  </div>""" % (lab, label(t["badge"]), tc, t["name"], mc, t["desc"],
               checklist(t["feats"], "navy" if navy else "light"),
               dv, mc, t["sub"], tc, t["price"], btn, TOUR["book"])
    img = """
  <div style="position:relative;%s">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
  </div>""" % ("height:100%" if wide else "height:186px;flex:none", t["img"], t["name"])
    shell = ("display:grid;grid-template-columns:260px 1fr" if wide
             else "display:flex;flex-direction:column")
    return ('<article style="%s;background:%s;border:%s;border-radius:14px;box-shadow:%s;'
            'overflow:hidden">%s%s</article>') % (shell, bg, bd, sh, img, body)


def grid5():
    top = "".join(card(t) for t in T[:3])
    bottom = "".join(card(t, wide=True) for t in T[3:])
    return ('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">'
            '%s</div>'
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));'
            'gap:24px;margin-top:24px">%s</div>') % (top, bottom)


# ---------------------------------------------------------------- A · 몰입
def immersion():
    style = """
.hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
"""
    body = """
<div style="width:%dpx;background:var(--surface)">
<section style="position:relative;height:800px;overflow:hidden;background:var(--navy)">
  <img class="hero-media" src="hero_turtle.webp" alt="와이키키 앞바다를 헤엄치는 바다거북">
  <div style="position:absolute;inset:0;background:linear-gradient(100deg,
    rgba(10,63,102,.90) 0%%,rgba(10,63,102,.62) 48%%,rgba(10,63,102,.12) 100%%)"></div>
  <div style="position:relative;z-index:4">%s</div>
  <div style="position:absolute;left:%dpx;top:224px;width:820px;z-index:4">
    <span style="display:inline-flex;border-radius:9999px;background:rgba(255,255,255,.16);
      border:1px solid rgba(255,255,255,.34);color:#fff;font-size:13px;font-weight:700;
      letter-spacing:.14em;padding:9px 18px">%s</span>
    <h1 style="font-size:56px;font-weight:800;line-height:1.24;color:#fff;margin-top:24px">
      %s<br>%s</h1>
    <p style="font-size:18px;line-height:1.85;color:#d8ecf7;max-width:560px;margin-top:20px">%s</p>
    <div style="display:flex;gap:14px;margin-top:34px">
      <button class="btn btn-fill" style="height:58px;padding:0 34px;font-size:17px">%s</button>
      <button class="btn" style="height:58px;padding:0 30px;font-size:17px;background:transparent;
        color:#fff;border:1.5px solid rgba(255,255,255,.55)">%s</button>
    </div>
  </div>
</section>
<div style="padding:0 %dpx;margin-top:-46px;position:relative;z-index:5">%s</div>
<section style="padding:126px %dpx 96px;background:var(--plane)">%s%s</section>
</div>""" % (W, header(dark=True), PAD, HERO["badge"], HERO["t1"], HERO["t2"],
             HERO["desc"], HERO["cta"], HERO["cta2"], PAD, statbar(), PAD,
             sect_head(), grid5())
    return page("A안 · 몰입", style, body)


# ---------------------------------------------------------------- B · 항해
HERO_CSS = """
.hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
"""


def hero_block():
    """히어로 + 숫자 바. 아래 구조만 바꾼 변형안들이 이 조각을 그대로 가져다 쓴다."""
    return """
<section style="position:relative;height:716px;overflow:hidden;background:#ffffff">
  <img class="hero-media" src="hero_boat.webp" alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트">
  <div style="position:absolute;inset:0;background:%s"></div>
  <div style="position:absolute;left:0;right:0;top:0;height:220px;background:%s"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:230px;background:%s"></div>
  %s
  <div style="position:absolute;left:%dpx;top:154px;width:660px;z-index:3">
    <span style="display:inline-flex;border-radius:9999px;background:var(--badge);
      color:var(--primary);font-size:13px;font-weight:700;letter-spacing:.14em;
      padding:9px 18px">%s</span>
    <h1 style="font-size:56px;font-weight:800;line-height:1.24;margin-top:22px">%s<br>
      <span style="color:var(--primary)">%s</span></h1>
    <p style="font-size:18px;line-height:1.85;color:var(--soft-text);max-width:520px;
      margin-top:20px">%s</p>
    <div style="display:flex;gap:14px;margin-top:32px">
      <button class="btn btn-fill" style="height:58px;padding:0 34px;font-size:17px">%s</button>
      <button class="btn btn-line" style="height:58px;padding:0 30px;font-size:17px">%s</button>
    </div>
  </div>
</section>
<div style="padding:0 %dpx;margin-top:-46px;position:relative;z-index:5">%s</div>""" % (
        soft_fade(96, full_at=.80, reverse=True, amax=.96),
        top_scrim(),
        soft_fade(180, full_at=.78),
        header(overlay=True),
        PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
        HERO["cta"], HERO["cta2"], PAD, statbar())


def voyage():
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="padding:126px %dpx 96px;background:var(--plane)">%s%s</section>
</div>""" % (W, hero_block(), PAD, sect_head(), grid5())
    return page("B안 · 항해", HERO_CSS, body)


# ---------------------------------------------------------------- 모바일 공통
MSTYLE = """
.hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.bar{position:absolute;left:0;right:0;bottom:0;height:64px;background:var(--surface);
  border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;padding:0 16px;
  box-shadow:0 -8px 24px rgba(0,119,168,.10)}
"""


def mheader(dark=False):
    fg = "#fff" if dark else "var(--navy)"
    line = "rgba(255,255,255,.22)" if dark else "var(--border)"
    chip = "rgba(255,255,255,.14)" if dark else "var(--soft)"
    burger = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="%s" '
              'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
              '<path d="M4 7h16M4 12h16M4 17h16"/></svg>') % fg
    return """
<header style="height:60px;padding:0 %dpx;display:flex;align-items:center;
  justify-content:space-between;border-bottom:1px solid %s;background:%s;
  position:relative;z-index:6">
  <a href="#" aria-label="오션스타 홈" style="display:flex;align-items:center;margin-left:10px">
    <img src="logo_full.png" alt="오션스타 하와이 거북이 스노클링"
      style="height:46px;width:auto;display:block;%s">
  </a>
  <div style="display:flex;gap:8px;align-items:center">
    <button class="btn" style="height:44px;min-width:44px;padding:0 14px;font-size:14px;
      background:%s;color:%s;border:1px solid %s">EN</button>
    <button class="btn" aria-label="메뉴 열기" style="width:44px;height:44px;padding:0;
      background:%s;border:1px solid %s">%s</button>
  </div>
</header>""" % (MP, line, "transparent" if dark else "var(--surface)",
                "filter:brightness(0) invert(1)" if dark else "",
                chip, fg, line, chip, line, burger)


def mstats(navy=True):
    cells = ""
    for i, (n, l) in enumerate(STATS):
        c = ("var(--sky)" if i in (0, 1) else "#fff") if navy else \
            ("var(--primary)" if i in (0, 1) else "var(--navy)")
        sub = "var(--on-navy)" if navy else "var(--muted)"
        cells += ('<div><div class="hd num" style="font-size:24px;font-weight:800;'
                  'line-height:1.15;color:%s">%s</div>'
                  '<div style="font-size:13px;color:%s;margin-top:4px">%s</div></div>'
                  ) % (c, n, sub, l)
    return ('<div style="background:%s;border:%s;border-radius:14px;padding:24px 22px;'
            'display:grid;grid-template-columns:1fr 1fr;gap:22px 14px">%s</div>'
            ) % ("var(--navy)" if navy else "#ffffff",
                 "none" if navy else "1px solid var(--border)", cells)


def mcard(t):
    """데스크탑 카드와 같은 규칙. 모바일은 손가락이 닿아야 하므로 예약 버튼만
    전폭 44px 이상을 유지하되, 채움 대신 아웃라인으로 낮춘다."""
    navy = t.get("navy")
    hot = t.get("hot")
    bg = "var(--navy)" if navy else "#ffffff"
    bd = "none" if navy else "1px solid var(--border)"
    tc = "#fff" if navy else "var(--navy)"
    mc = "var(--on-navy)" if navy else "var(--muted)"
    dv = "rgba(255,255,255,.16)" if navy else "var(--inner)"
    sh = "var(--e-navy)" if navy else "var(--e3)" if hot else "var(--e2)"
    if navy:
        lab = "background:var(--sky);color:var(--navy);padding:5px 9px;border-radius:6px"
        btn = "background:transparent;color:var(--sky);border:1.5px solid rgba(255,255,255,.42)"
    elif hot:
        lab = "background:var(--primary);color:#fff;padding:5px 9px;border-radius:6px"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    else:
        lab = "color:var(--primary);letter-spacing:.06em"
        btn = "background:#fff;color:var(--primary);border:1.5px solid var(--outline)"
    return """
<article style="background:%s;border:%s;border-radius:14px;box-shadow:%s;overflow:hidden">
  <div style="position:relative;height:186px">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
  </div>
  <div style="padding:20px">
    <span style="display:inline-block;font-size:11.5px;font-weight:700;line-height:1;%s">%s</span>
    <h3 style="font-size:17px;font-weight:700;line-height:1.45;color:%s;margin-top:10px">%s</h3>
    <p style="font-size:13px;font-weight:400;line-height:1.7;color:%s;margin-top:8px">%s</p>
    %s
    <div style="margin-top:18px;padding-top:16px;border-top:1px solid %s">
      <div class="num" style="font-size:12px;font-weight:400;color:%s">%s</div>
      <div class="num" style="font-size:21px;font-weight:700;line-height:1.2;color:%s;
        margin-top:3px">%s</div>
      <button class="btn" style="width:100%%;height:48px;margin-top:14px;font-size:15px;
        border-radius:10px;%s">%s</button>
    </div>
  </div>
</article>""" % (bg, bd, sh, t["img"], t["name"], lab, label(t["badge"]), tc, t["name"],
                 mc, t["desc"], checklist(t["feats"], "navy" if navy else "light"),
                 dv, mc, t["sub"], tc, t["price"],
                 btn, TOUR["book"])


def mlist():
    return ('<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:16px">%s</div>'
            % "".join(mcard(t) for t in T))


def mbar():
    return """
<div class="bar">
  <div style="flex:1">
    <div class="hd num" style="font-size:18px;font-weight:800;color:var(--navy);
      line-height:1.15">₩151,570 ~</div>
    <div style="font-size:12px;color:var(--muted)">성인가 기준</div>
  </div>
  <button class="btn btn-fill" style="height:48px;padding:0 24px;font-size:16px">%s</button>
</div>""" % HERO["cta"]


def msect():
    return """
<h2 style="font-size:28px;font-weight:800;line-height:1.3">%s</h2>
<p style="font-size:15px;line-height:1.7;color:var(--soft-text);margin-top:10px">%s</p>
""" % (TOUR["title"], TOUR["subtitle"])


def mwrap(inner, h, bg="var(--surface)"):
    return ('<div style="width:%dpx;min-height:%dpx;position:relative;background:%s;'
            'padding-bottom:80px">%s%s</div>') % (MW, h, bg, inner, mbar())


def immersion_m():
    inner = """
<section style="position:relative;height:610px;overflow:hidden;background:var(--navy)">
  <img class="hero-media" src="hero_turtle.webp" alt="와이키키 앞바다를 헤엄치는 바다거북">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(10,63,102,.72) 0%%,rgba(10,63,102,.28) 32%%,rgba(10,63,102,.94) 100%%)"></div>
  <div style="position:relative;z-index:3">%s</div>
  <div style="position:absolute;left:%dpx;right:%dpx;bottom:28px;z-index:3">
    <span style="display:inline-flex;border-radius:9999px;background:rgba(255,255,255,.16);
      border:1px solid rgba(255,255,255,.34);color:#fff;font-size:12px;font-weight:700;
      letter-spacing:.12em;padding:7px 14px">%s</span>
    <h1 style="font-size:30px;font-weight:800;line-height:1.32;color:#fff;margin-top:14px">
      %s<br>%s</h1>
    <p style="font-size:15px;line-height:1.75;color:#d5ebf7;margin-top:12px">%s</p>
    <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:18px;
      font-size:16px">%s</button>
  </div>
</section>
<div style="padding:24px %dpx 0">%s</div>
<section style="padding:42px %dpx 0">%s<div style="margin-top:22px">%s</div></section>
""" % (mheader(dark=True), MP, MP, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
       HERO["cta"], MP, mstats(navy=False), MP, msect(), mlist())
    return page("A안 · 몰입 (모바일)", MSTYLE, mwrap(inner, 3480))


def voyage_m():
    """모바일은 흰 바탕에 활자를 먼저 놓고, 배가 보이도록 영상을 그 아래 띠로 깐다.
    375폭에 21:9 영상을 꽉 채우면 가로가 심하게 잘려 오른쪽 배가 사라진다."""
    inner = """
%s
<section style="padding:28px %dpx 0;background:var(--surface)">
  <span style="display:inline-flex;border-radius:9999px;background:var(--badge);
    color:var(--primary);font-size:12px;font-weight:700;letter-spacing:.12em;
    padding:7px 14px">%s</span>
  <h1 style="font-size:30px;font-weight:800;line-height:1.32;margin-top:14px">%s<br>
    <span style="color:var(--primary)">%s</span></h1>
  <p style="font-size:15px;line-height:1.75;color:var(--soft-text);margin-top:12px">%s</p>
</section>
<div style="position:relative;height:236px;margin-top:22px;overflow:hidden;background:#ffffff">
  <img src="hero_boat.webp" alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트"
    style="width:100%%;height:100%%;object-fit:cover;object-position:95%% center;display:block">
  <div style="position:absolute;left:0;right:0;top:0;height:72px;background:%s"></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:84px;background:%s"></div>
</div>
<div style="padding:20px %dpx 0">
  <button class="btn btn-fill" style="width:100%%;height:52px;font-size:16px">%s</button>
  <button class="btn btn-line" style="width:100%%;height:52px;margin-top:10px;font-size:16px">%s</button>
</div>
<div style="padding:24px %dpx 0">%s</div>
<section style="padding:42px %dpx 0">%s<div style="margin-top:22px">%s</div></section>
""" % (mheader(), MP, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
       soft_fade(180, full_at=.82, reverse=True), soft_fade(180, full_at=.82),
       MP, HERO["cta"], HERO["cta2"], MP, mstats(navy=False), MP, msect(), mlist())
    return page("B안 · 항해 (모바일)", MSTYLE, mwrap(inner, 3480))


if __name__ == "__main__":
    for name, fn in [("Main", voyage), ("Voyage2_M", voyage_m)]:
        io.open(name + ".dc.html", "w", encoding="utf-8").write(fn())
        print(name, "ok")
