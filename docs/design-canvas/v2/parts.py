# -*- coding: utf-8 -*-
"""데스크탑 1440 공통 부품."""
from _base import TOURS, stars, page

W, PAD = 1440, 120

STATS = [("14,000+", "누적 리뷰"), ("100%", "거북이 보장"),
         ("51인승", "루프탑 보트"), ("4시간", "넉넉한 운영")]


def header(active="Home", dark=False):
    fg = "#fff" if dark else "var(--navy)"
    sub = "var(--on-navy)" if dark else "var(--muted)"
    line = "rgba(255,255,255,.18)" if dark else "var(--border)"
    bg = "transparent" if dark else "var(--surface)"
    nav = ""
    for it in ["Home", "고객후기", "FAQ", "블로그"]:
        on = it == active
        nav += ('<a href="#" style="font-size:16px;font-weight:%d;color:%s;padding-bottom:4px;'
                'border-bottom:%s">%s</a>') % (
            700 if on else 500, fg if on else sub,
            "2px solid var(--cyan)" if on else "2px solid transparent", it)
    return """
<header style="height:76px;display:flex;align-items:center;justify-content:space-between;
  padding:0 %dpx;background:%s;border-bottom:1px solid %s;position:relative;z-index:6">
  <div style="display:flex;align-items:center;gap:48px">
    <span class="d" style="font-size:26px;color:%s;letter-spacing:0">OCEAN STAR</span>
    <nav style="display:flex;gap:30px;align-items:center">%s</nav>
  </div>
  <div style="display:flex;gap:10px;align-items:center">
    <button class="btn btn-line" style="height:42px;padding:0 16px;font-size:14px;border-radius:10px;
      color:%s;border-color:%s">EN</button>
    <button class="btn btn-line" style="height:42px;padding:0 16px;font-size:14px;border-radius:10px;
      color:%s;border-color:%s">내 예약 관리</button>
    <button class="btn btn-fill" style="height:42px;padding:0 22px;font-size:15px">예약하기</button>
  </div>
</header>""" % (PAD, bg, line, fg, nav, fg, line, fg, line)


def statbar():
    cells = ""
    for i, (n, l) in enumerate(STATS):
        c = "var(--primary)" if i == 0 else "var(--navy)"
        bd = "" if i == 3 else "border-right:1px solid var(--border);"
        cells += ('<div style="flex:1;padding:26px 40px;%s">'
                  '<div class="d num" style="font-size:34px;line-height:1.1;color:%s">%s</div>'
                  '<div style="font-size:14px;color:var(--muted);margin-top:6px">%s</div></div>'
                  ) % (bd, c, n, l)
    return ('<div style="display:flex;background:var(--surface);border:1px solid var(--border);'
            'border-radius:20px;box-shadow:var(--sh-float);overflow:hidden">%s</div>') % cells


def sect_title(lead, brand, tail="", note=None):
    n = ('<p style="font-size:17px;line-height:1.75;color:var(--soft-text);max-width:520px;'
         'margin-top:14px">%s</p>') % note if note else ""
    return ('<div><h2 class="d" style="font-size:50px;line-height:1.2">%s'
            '<span style="color:var(--primary)">%s</span>%s</h2>%s</div>') % (lead, brand, tail, n)


def card(t, img_h=170, cta_h=48):
    navy = t.get("navy")
    bg = "var(--navy)" if navy else "var(--surface)"
    bd = "none" if navy else "1px solid var(--border)"
    tc = "#fff" if navy else "var(--navy)"
    mc = "var(--on-navy)" if navy else "var(--muted)"
    dv = "rgba(255,255,255,.16)" if navy else "var(--inner)"
    sh = "var(--sh-navy)" if navy else "var(--sh-card)"
    if navy:
        bbg, bfg = "var(--sky)", "var(--navy)"
        btn = "background:var(--sky);color:var(--navy)"
    elif t.get("hot"):
        bbg, bfg = "var(--primary)", "#fff"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    else:
        bbg, bfg = "var(--surface)", "var(--navy)"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    return """
<article style="display:flex;flex-direction:column;background:%s;border:%s;border-radius:20px;
  box-shadow:%s;overflow:hidden">
  <div style="position:relative;height:%dpx;flex:none">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
    <span style="position:absolute;top:12px;left:12px;background:%s;color:%s;font-size:12px;
      font-weight:700;padding:6px 10px;border-radius:8px">%s</span>
  </div>
  <div style="display:flex;flex-direction:column;flex:1;padding:24px">
    <h3 class="d" style="font-size:21px;line-height:1.35;color:%s">%s</h3>
    <p style="font-size:14px;line-height:1.6;color:%s;margin-top:8px">%s</p>
    <div style="margin-top:auto;padding-top:18px;border-top:1px solid %s">
      <div class="d num" style="font-size:26px;line-height:1.15;color:%s;margin-top:16px">%s</div>
      <div class="num" style="font-size:13px;color:%s;margin-top:4px">%s</div>
      <button class="btn" style="width:100%%;height:%dpx;margin-top:16px;font-size:15px;%s">예약하기</button>
    </div>
  </div>
</article>""" % (bg, bd, sh, img_h, t["img"], t["name"], bbg, bfg, t["badge"],
                 tc, t["name"], mc, t["meta"], dv, tc, t["price"], mc, t["sub"], cta_h, btn)


def grid_equal():
    return ('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">%s</div>'
            % "".join(card(t) for t in TOURS))


WAVE = """
<svg viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true"
     style="position:absolute;left:0;right:0;bottom:0;width:100%;height:220px">
  <path class="w1" fill="#bfe6f6" fill-opacity=".55"
    d="M0 96c180-42 320 34 500 34s330-72 500-38 300 54 440 40v130H0Z"/>
  <path class="w2" fill="#8fd3ef" fill-opacity=".55"
    d="M0 140c200-46 340 26 520 30s330-58 500-30 280 46 420 34v88H0Z"/>
  <path fill="#0077a8" fill-opacity=".10"
    d="M0 178c220-30 360 22 560 22s340-42 500-22 260 30 380 24v40H0Z"/>
</svg>"""
