# -*- coding: utf-8 -*-
"""글래스모피즘 변형안. 확정안과 배치·문구·상품은 같고 표면 재질만 유리로 바꾼다.

유리는 뒤에 무언가 있어야 유리로 보인다. 그래서
· 헤더는 히어로 영상 위로 겹쳐 올린다 (아래 레이아웃 총 높이는 그대로)
· 히어로 활자는 흰 스크림 대신 유리판 위에 앉힌다
· 상품 영역에는 옅은 파랑 워시를 깔아 카드가 흐릴 대상을 만든다
blur만으로는 납작하다. 1px 안쪽 테두리와 상단 하이라이트를 넣어 모서리 굴절을 흉내낸다.
"""
import io
from build_v2 import HERO, STATS, TOUR, TOURS, page
from build_v2_boards import W, PAD, NAV, sect_head, label, checklist

T = TOURS

STYLE = """
.hero-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.glass{
  background:linear-gradient(140deg,rgba(255,255,255,.68),rgba(255,255,255,.42));
  backdrop-filter:blur(24px) saturate(160%);
  -webkit-backdrop-filter:blur(24px) saturate(160%);
  border:1px solid rgba(255,255,255,.62);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.88),
             inset 0 -1px 0 rgba(255,255,255,.28),
             0 20px 48px rgba(10,63,102,.16);
}
.glass-dark{
  background:linear-gradient(140deg,rgba(10,63,102,.82),rgba(10,63,102,.64));
  backdrop-filter:blur(24px) saturate(150%);
  -webkit-backdrop-filter:blur(24px) saturate(150%);
  border:1px solid rgba(255,255,255,.24);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.34), 0 20px 48px rgba(10,63,102,.30);
}
.glass-bar{
  background:linear-gradient(180deg,rgba(255,255,255,.60),rgba(255,255,255,.34));
  backdrop-filter:blur(20px) saturate(150%);
  -webkit-backdrop-filter:blur(20px) saturate(150%);
  border-bottom:1px solid rgba(255,255,255,.45);
  box-shadow:inset 0 -1px 0 rgba(255,255,255,.5);
}
/* 투명 효과를 줄이도록 설정한 사용자에게는 불투명 면으로 내려앉는다 */
@media (prefers-reduced-transparency: reduce){
  .glass,.glass-bar{background:rgba(255,255,255,.97);backdrop-filter:none;
                    -webkit-backdrop-filter:none}
  .glass-dark{background:var(--navy);backdrop-filter:none;-webkit-backdrop-filter:none}
}
"""


def header():
    nav = "".join(
        '<a href="#" style="font-size:16px;font-weight:%d;color:%s;padding-bottom:4px;'
        'border-bottom:%s">%s</a>' % (
            700 if i == 0 else 500,
            "var(--navy)" if i == 0 else "var(--soft-text)",
            "2px solid var(--cyan)" if i == 0 else "2px solid transparent", it)
        for i, it in enumerate(NAV))
    return """
<header class="glass-bar" style="position:absolute;left:0;right:0;top:0;height:76px;z-index:6;
  display:flex;align-items:center;justify-content:space-between;padding:0 %dpx">
  <div style="display:flex;align-items:center;gap:46px">
    <a href="#" aria-label="오션스타 홈" style="display:flex;align-items:center;margin-left:30px">
      <img src="logo_full.png" alt="오션스타 하와이 거북이 스노클링"
        style="height:58px;width:auto;display:block">
    </a>
    <nav style="display:flex;gap:30px;align-items:center">%s</nav>
  </div>
  <div style="display:flex;gap:10px;align-items:center">
    <button class="btn" style="height:42px;padding:0 16px;font-size:14px;border-radius:10px;
      background:rgba(255,255,255,.55);color:var(--navy);
      border:1px solid rgba(255,255,255,.7)">EN</button>
    <button class="btn" style="height:42px;padding:0 16px;font-size:14px;border-radius:10px;
      background:rgba(255,255,255,.55);color:var(--navy);
      border:1px solid rgba(255,255,255,.7)">내 예약 관리</button>
    <button class="btn btn-fill" style="height:42px;padding:0 22px;font-size:15px">투어 예약하기</button>
  </div>
</header>""" % (PAD, nav)


def statbar():
    cells = ""
    for i, (n, l) in enumerate(STATS):
        bd = "" if i == 3 else "border-right:1px solid rgba(255,255,255,.55);"
        c = "var(--primary)" if i in (0, 1) else "var(--navy)"
        cells += ('<div style="flex:1;padding:26px 36px;%s">'
                  '<div class="num" style="font-size:28px;font-weight:700;line-height:1.15;'
                  'color:%s">%s</div>'
                  '<div style="font-size:14px;color:var(--soft-text);margin-top:6px">%s</div></div>'
                  ) % (bd, c, n, l)
    return ('<div class="glass" style="display:flex;border-radius:14px;overflow:hidden">%s</div>'
            % cells)


def card(t, wide=False):
    """유리 재질만 다르고 활자 규칙은 확정안 카드와 동일하게 간다."""
    navy = t.get("navy")
    hot = t.get("hot")
    cls = "glass-dark" if navy else "glass"
    tc = "#fff" if navy else "var(--navy)"
    mc = "var(--on-navy)" if navy else "var(--soft-text)"
    dv = "rgba(255,255,255,.24)" if navy else "rgba(255,255,255,.75)"
    if navy:
        lab = "background:var(--sky);color:var(--navy);padding:5px 9px;border-radius:6px"
        btn = "background:transparent;color:var(--sky);border:1.5px solid rgba(255,255,255,.42)"
    elif hot:
        lab = "background:var(--primary);color:#fff;padding:5px 9px;border-radius:6px"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    else:
        lab = "color:var(--primary);letter-spacing:.06em"
        btn = ("background:rgba(255,255,255,.82);color:var(--primary);"
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
    return ('<article class="%s" style="%s;border-radius:14px;overflow:hidden">%s%s</article>'
            ) % (cls, shell, img, body)


def glass():
    grid = ('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">'
            '%s</div>'
            '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));'
            'gap:24px;margin-top:24px">%s</div>') % (
                "".join(card(t) for t in T[:3]),
                "".join(card(t, wide=True) for t in T[3:]))
    body = """
<div style="width:%dpx;background:var(--surface)">
<section style="position:relative;height:716px;overflow:hidden;background:#ffffff">
  <img class="hero-media" src="hero_boat.webp"
    alt="와이키키 앞바다의 오션스타 51인승 루프탑 보트">
  %s
  <div class="glass" style="position:absolute;left:%dpx;top:150px;width:680px;z-index:3;
    border-radius:26px;padding:38px 42px 42px">
    <span style="display:inline-flex;border-radius:9999px;background:rgba(255,255,255,.72);
      color:var(--primary);font-size:13px;font-weight:700;letter-spacing:.14em;
      padding:9px 18px">%s</span>
    <h1 style="font-size:52px;font-weight:800;line-height:1.26;margin-top:20px">%s<br>
      <span style="color:var(--primary)">%s</span></h1>
    <p style="font-size:18px;line-height:1.85;color:var(--soft-text);max-width:520px;
      margin-top:16px">%s</p>
    <div style="display:flex;gap:14px;margin-top:28px">
      <button class="btn btn-fill" style="height:58px;padding:0 34px;font-size:17px">%s</button>
      <button class="btn btn-line" style="height:58px;padding:0 30px;font-size:17px">%s</button>
    </div>
  </div>
</section>
<div style="padding:0 %dpx;margin-top:-46px;position:relative;z-index:5">%s</div>
<section style="padding:126px %dpx 96px;background:linear-gradient(180deg,
  #ffffff 0%%,#e4f1fa 16%%,#eef7fc 52%%,#ffffff 100%%)">%s%s</section>
</div>""" % (W, header(), PAD, HERO["badge"], HERO["t1"], HERO["t2"], HERO["desc"],
             HERO["cta"], HERO["cta2"], PAD, statbar(), PAD, sect_head(), grid)
    return page("색-4 · 글래스모피즘", STYLE, body)


if __name__ == "__main__":
    io.open("Glass.dc.html", "w", encoding="utf-8").write(glass())
    print("Glass ok")
