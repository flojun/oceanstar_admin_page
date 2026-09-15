# -*- coding: utf-8 -*-
"""B안 파생 2가지. 히어로 영상·문구·상품·서체·색은 그대로 두고 구성과 재질만 바꾼다.

B-2 분할 : 흰 바탕과 영상을 좌우로 가른다. 스크림이 없으니 활자 대비가 최대.
B-3 카드 : 옅은 하늘 바탕 위에 흰 카드가 떠 있는 구성. 히어로도 카드 안에 들어간다.
"""
import io
from build_v2 import HERO, STATS, TOUR, TOURS, page
from build_v2_boards import (W, PAD, MW, MP, header, mheader, mbar, mcard,
                             msect, mwrap, sect_head, card, MSTYLE, soft_fade)

T = TOURS
HERO_STYLE = ".hero-media{width:100%;height:100%;object-fit:cover;display:block}\n"


def stat_rule(dark=False):
    """카드 대신 얇은 규칙선 위에 숫자만 올린다."""
    cells = ""
    for i, (n, l) in enumerate(STATS):
        c = "var(--primary)" if i in (0, 1) else "var(--navy)"
        cells += ('<div style="padding-right:38px">'
                  '<div class="hd num" style="font-size:28px;font-weight:800;line-height:1.15;'
                  'white-space:nowrap;color:%s">%s</div>'
                  '<div style="font-size:13px;color:var(--muted);margin-top:4px">%s</div></div>'
                  ) % (c, n, l)
    return ('<div style="display:flex;margin-top:48px;padding-top:26px;'
            'border-top:1px solid var(--border)">%s</div>') % cells


def hero_copy(cta_full=False):
    return """
    <span style="display:inline-flex;border-radius:9999px;background:var(--badge);
      color:var(--primary);font-size:13px;font-weight:700;letter-spacing:.14em;
      padding:9px 18px">%s</span>
    <h1 style="font-size:54px;font-weight:800;line-height:1.26;margin-top:22px">%s<br>
      <span style="color:var(--primary)">%s</span></h1>
    <p style="font-size:18px;line-height:1.85;color:var(--soft-text);max-width:500px;
      margin-top:18px">%s</p>
    <div style="display:flex;gap:14px;margin-top:30px">
      <button class="btn btn-fill" style="height:58px;padding:0 34px;font-size:17px">%s</button>
      <button class="btn btn-line" style="height:58px;padding:0 30px;font-size:17px">%s</button>
    </div>""" % (HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
                 HERO["cta"], HERO["cta2"])


# ==========================================================  B-2 · 분할
def split():
    grid = ('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px">'
            '%s%s%s%s%s</div>') % (card(T[0]), card(T[1]), card(T[2]),
                                   card(T[3]), card(T[4], wide=True))
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="display:grid;grid-template-columns:1fr 760px;align-items:center;
  min-height:648px;padding-left:%dpx">
  <div style="padding:64px 56px 64px 0">%s%s</div>
  <div style="height:540px;border-radius:28px 0 0 28px;overflow:hidden;background:#eaf6fc">
    <img class="hero-media" src="hero_boat.webp"
      alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트"
      style="object-position:right center">
  </div>
</section>
<section style="padding:104px %dpx 96px">%s%s</section>
</div>""" % (W, header(), PAD, hero_copy(), stat_rule(), PAD, sect_head(), grid)
    return page("B-2안 · 분할", HERO_STYLE, body)


def split_m():
    inner = """
%s
<section style="padding:28px %dpx 0">%s</section>
<div style="margin:24px %dpx 0;height:214px;border-radius:20px;overflow:hidden;background:#eaf6fc">
  <img class="hero-media" src="hero_boat.webp" alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트"
    style="object-position:95%% center">
</div>
<div style="padding:20px %dpx 0">
  <button class="btn btn-fill" style="width:100%%;height:52px;font-size:16px">%s</button>
  <button class="btn btn-line" style="width:100%%;height:52px;margin-top:10px;font-size:16px">%s</button>
</div>
<div style="padding:26px %dpx 0">%s</div>
<section style="padding:42px %dpx 0">%s<div style="margin-top:22px">%s</div></section>
""" % (mheader(), MP, """
  <span style="display:inline-flex;border-radius:9999px;background:var(--badge);
    color:var(--primary);font-size:12px;font-weight:700;letter-spacing:.12em;
    padding:7px 14px">%s</span>
  <h1 style="font-size:30px;font-weight:800;line-height:1.32;margin-top:14px">%s<br>
    <span style="color:var(--primary)">%s</span></h1>
  <p style="font-size:15px;line-height:1.75;color:var(--soft-text);margin-top:12px">%s</p>
""" % (HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"]),
       MP, MP, HERO["cta"], HERO["cta2"], MP, mstat_rule(), MP, msect(),
       mlist_wrap())
    return page("B-2안 · 분할 (모바일)", MSTYLE + HERO_STYLE, mwrap(inner, 3520))


def mstat_rule():
    cells = ""
    for i, (n, l) in enumerate(STATS):
        c = "var(--primary)" if i in (0, 1) else "var(--navy)"
        cells += ('<div><div class="hd num" style="font-size:24px;font-weight:800;'
                  'line-height:1.15;color:%s">%s</div>'
                  '<div style="font-size:13px;color:var(--muted);margin-top:3px">%s</div></div>'
                  ) % (c, n, l)
    return ('<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px 14px;'
            'padding-top:22px;border-top:1px solid var(--border)">%s</div>') % cells


def mlist_wrap():
    return ('<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:16px">%s</div>'
            % "".join(mcard(t) for t in T))


# ==========================================================  B-3 · 카드
def feature_card(t):
    """왼쪽 큰 피처 카드. 이미지가 크고 두 줄을 차지한다."""
    return """
<article style="grid-row:span 2;display:flex;flex-direction:column;background:var(--surface);
  border:1px solid var(--border);border-radius:24px;box-shadow:var(--sh-card);overflow:hidden">
  <div style="position:relative;height:392px;flex:none">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
    <span style="position:absolute;top:14px;left:14px;background:var(--primary);color:#fff;
      font-size:12px;font-weight:700;padding:7px 12px;border-radius:8px">%s</span>
  </div>
  <div style="display:flex;flex-direction:column;flex:1;padding:28px">
    <h3 style="font-size:26px;font-weight:800;line-height:1.35;color:var(--navy)">%s</h3>
    <p class="num" style="font-size:15px;line-height:1.6;color:var(--muted);margin-top:10px">%s</p>
    <p style="font-size:15px;line-height:1.6;color:var(--muted)">%s</p>
    <div style="margin-top:auto;padding-top:22px;border-top:1px solid var(--inner)">
      <div class="hd num" style="font-size:30px;font-weight:800;color:var(--navy);
        margin-top:18px">%s</div>
      <div class="num" style="font-size:13px;color:var(--muted);margin-top:4px">%s</div>
      <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:18px;
        font-size:16px">%s</button>
    </div>
  </div>
</article>""" % (t["img"], t["name"], t["badge"], t["name"], t["meta"], t["meta2"],
                 t["price"], t["sub"], TOUR["book"])


def cardhero():
    statcells = ""
    for i, (n, l) in enumerate(STATS):
        bd = "" if i == 3 else "border-right:1px solid var(--border);"
        c = "var(--primary)" if i in (0, 1) else "var(--navy)"
        statcells += ('<div style="flex:1;padding:24px 34px;%s">'
                      '<div class="hd num" style="font-size:29px;font-weight:800;'
                      'line-height:1.15;color:%s">%s</div>'
                      '<div style="font-size:14px;color:var(--muted);margin-top:5px">%s</div></div>'
                      ) % (bd, c, n, l)
    grid = ('<div style="display:grid;grid-template-columns:1.22fr 1fr 1fr;gap:20px">'
            '%s%s%s%s%s</div>') % (feature_card(T[0]), card(T[1]), card(T[2]),
                                   card(T[3]), card(T[4]))
    body = """
<div style="width:%dpx;background:var(--soft)">
%s
<section style="padding:32px %dpx 0">
  <div style="display:grid;grid-template-columns:1fr 640px;min-height:512px;
    background:var(--surface);border-radius:28px;overflow:hidden;box-shadow:var(--sh-card)">
    <div style="padding:56px 48px;display:flex;flex-direction:column;justify-content:center">%s</div>
    <div style="background:#eaf6fc">
      <img class="hero-media" src="hero_boat.webp"
        alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트" style="object-position:right center">
    </div>
  </div>
  <div style="display:flex;background:var(--surface);border-radius:20px;margin-top:20px;
    box-shadow:var(--sh-card);overflow:hidden">%s</div>
</section>
<section style="padding:88px %dpx 96px">%s%s</section>
</div>""" % (W, header(), PAD, hero_copy(), statcells, PAD, sect_head(), grid)
    return page("B-3안 · 카드", HERO_STYLE, body)


def cardhero_m():
    statcells = ""
    for i, (n, l) in enumerate(STATS):
        c = "var(--primary)" if i in (0, 1) else "var(--navy)"
        statcells += ('<div><div class="hd num" style="font-size:24px;font-weight:800;'
                      'line-height:1.15;color:%s">%s</div>'
                      '<div style="font-size:13px;color:var(--muted);margin-top:3px">%s</div></div>'
                      ) % (c, n, l)
    inner = """
%s
<section style="padding:18px %dpx 0">
  <div style="background:var(--surface);border-radius:24px;overflow:hidden;
    box-shadow:var(--sh-card)">
    <div style="height:196px;background:#eaf6fc">
      <img class="hero-media" src="hero_boat.webp"
        alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트" style="object-position:95%% center">
    </div>
    <div style="padding:24px 20px 26px">
      <span style="display:inline-flex;border-radius:9999px;background:var(--badge);
        color:var(--primary);font-size:12px;font-weight:700;letter-spacing:.12em;
        padding:7px 14px">%s</span>
      <h1 style="font-size:29px;font-weight:800;line-height:1.32;margin-top:14px">%s<br>
        <span style="color:var(--primary)">%s</span></h1>
      <p style="font-size:15px;line-height:1.75;color:var(--soft-text);margin-top:12px">%s</p>
      <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:18px;
        font-size:16px">%s</button>
      <button class="btn btn-line" style="width:100%%;height:52px;margin-top:10px;
        font-size:16px">%s</button>
    </div>
  </div>
  <div style="background:var(--surface);border-radius:20px;box-shadow:var(--sh-card);
    padding:22px 20px;margin-top:14px;display:grid;grid-template-columns:1fr 1fr;
    gap:20px 14px">%s</div>
</section>
<section style="padding:40px %dpx 0">%s<div style="margin-top:22px">%s</div></section>
""" % (mheader(), MP, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
       HERO["cta"], HERO["cta2"], statcells, MP, msect(), mlist_wrap())
    return page("B-3안 · 카드 (모바일)", MSTYLE + HERO_STYLE, mwrap(inner, 3560, "var(--soft)"))


if __name__ == "__main__":
    for name, fn in [("Split", split), ("Split_M", split_m),
                     ("CardHero", cardhero), ("CardHero_M", cardhero_m)]:
        io.open(name + ".dc.html", "w", encoding="utf-8").write(fn())
        print(name, "ok")
