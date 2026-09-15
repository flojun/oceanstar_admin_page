# -*- coding: utf-8 -*-
"""히어로(영상까지)는 확정안 그대로 두고, 그 아래 상품 영역의 구조만 바꾼 4가지.

색·서체·문구·상품 5가지·카드 안 내용 어휘는 전부 동일하다.
바뀌는 것은 '다섯 개를 화면에 어떻게 늘어놓느냐' 하나뿐이라, 나란히 놓으면
구조 차이만 보인다.

틀-1 리스트   : 전폭 가로 행 5줄. 위아래로 훑으며 비교하기 가장 쉽다.
틀-2 탭       : 탭으로 하나씩. 스크롤이 짧고 한 상품에 집중된다.
틀-3 좌측 고정: 섹션 제목이 왼쪽에 붙박이, 카드가 오른쪽 2열로 흐른다.
틀-4 피처     : 대표 1개를 전폭 대형으로, 나머지 4개를 작은 4열로.
"""
import io
from build_v2 import HERO, TOUR, TOURS, page
from build_v2_boards import (W, PAD, HERO_CSS, hero_block, sect_head,
                             label, checklist, card)

T = TOURS
BOOK = TOUR["book"]


def price_pair(t, size=22, align="left"):
    return ('<div style="text-align:%s">'
            '<div class="num" style="font-size:12px;color:var(--muted)">%s</div>'
            '<div class="num" style="font-size:%dpx;font-weight:700;line-height:1.2;'
            'color:var(--navy)">%s</div></div>') % (align, t["sub"], size, t["price"])


def tag(t):
    if t.get("hot"):
        css = "background:var(--primary);color:#fff;padding:5px 9px;border-radius:6px"
    elif t.get("navy"):
        css = "background:var(--navy);color:#fff;padding:5px 9px;border-radius:6px"
    else:
        css = "color:var(--primary);letter-spacing:.06em"
    return ('<span style="display:inline-block;font-size:11.5px;font-weight:700;'
            'line-height:1;%s">%s</span>') % (css, label(t["badge"]))


# ========================================================  틀-1 · 리스트
def frame_list():
    rows = ""
    for i, t in enumerate(T):
        line = "" if i == 0 else "border-top:1px solid var(--border);"
        rows += """
<article style="display:grid;grid-template-columns:232px 1fr 240px;gap:32px;
  align-items:center;padding:26px 0;%s">
  <img src="%s" alt="%s" style="width:232px;height:150px;object-fit:cover;
    border-radius:12px;display:block;box-shadow:var(--e1)">
  <div>
    %s
    <h3 style="font-size:20px;font-weight:700;line-height:1.4;color:var(--navy);
      margin-top:10px">%s</h3>
    <p style="font-size:13.5px;line-height:1.7;color:var(--muted);margin-top:7px;
      max-width:540px">%s</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:12px">%s</div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:14px">
    %s
    <button class="btn %s" style="height:44px;padding:0 24px;font-size:15px;
      border-radius:10px">%s</button>
  </div>
</article>""" % (line, t["img"], t["name"], tag(t), t["name"], t["desc"],
                 "".join('<span style="display:flex;align-items:center;gap:7px;'
                         'font-size:13px;color:var(--soft-text)">'
                         '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" '
                         'stroke="var(--cyan)" stroke-width="2.6" stroke-linecap="round" '
                         'stroke-linejoin="round" aria-hidden="true">'
                         '<path d="m4.5 12.5 5 5 10-11"/></svg>%s</span>' % f
                         for f in t["feats"]),
                 price_pair(t, 22, "right"),
                 "btn-fill" if t.get("hot") else "btn-line", BOOK)
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="padding:126px %dpx 96px;background:var(--plane)">%s
  <div style="background:#ffffff;border:1px solid var(--border);border-radius:14px;
    box-shadow:var(--e2);padding:8px 28px 14px">%s</div>
</section>
</div>""" % (W, hero_block(), PAD, sect_head(), rows)
    return page("틀-1 · 리스트", HERO_CSS, body)


# ========================================================  틀-2 · 탭
def frame_tabs():
    sel = T[0]
    tabs = ""
    for i, t in enumerate(T):
        on = i == 0
        tabs += ('<button class="btn" style="height:46px;padding:0 20px;font-size:14.5px;'
                 'border-radius:10px;font-weight:%d;background:%s;color:%s;border:1px solid %s">'
                 '%s</button>') % (
            700 if on else 500,
            "var(--navy)" if on else "#ffffff",
            "#ffffff" if on else "var(--soft-text)",
            "var(--navy)" if on else "var(--border)",
            t["name"].replace("[단독] ", ""))
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="padding:126px %dpx 96px;background:var(--plane)">%s
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:26px">%s</div>
  <div style="display:grid;grid-template-columns:1.15fr 1fr;background:#ffffff;
    border:1px solid var(--border);border-radius:16px;box-shadow:var(--e3);overflow:hidden">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;min-height:430px;
      object-fit:cover;display:block">
    <div style="padding:38px 40px 40px;display:flex;flex-direction:column">
      %s
      <h3 style="font-size:28px;font-weight:700;line-height:1.35;color:var(--navy);
        margin-top:13px">%s</h3>
      <p style="font-size:15px;line-height:1.8;color:var(--muted);margin-top:12px">%s</p>
      %s
      <div style="display:flex;align-items:flex-end;justify-content:space-between;
        gap:16px;margin-top:auto;padding-top:26px;border-top:1px solid var(--inner)">
        <div style="padding-top:20px">%s</div>
        <button class="btn btn-fill" style="height:50px;padding:0 30px;
          font-size:16px">%s</button>
      </div>
    </div>
  </div>
</section>
</div>""" % (W, hero_block(), PAD, sect_head(), tabs, sel["img"], sel["name"],
             tag(sel), sel["name"], sel["desc"],
             checklist(sel["feats"]), price_pair(sel, 26), BOOK)
    return page("틀-2 · 탭", HERO_CSS, body)


# ========================================================  틀-3 · 좌측 고정
def frame_sticky():
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="padding:126px %dpx 96px;background:var(--plane)">
  <div style="display:grid;grid-template-columns:352px 1fr;gap:56px;align-items:start">
    <div style="position:sticky;top:40px">
      <h2 style="font-size:40px;font-weight:700;line-height:1.28;
        letter-spacing:-.01em">%s</h2>
      <p style="font-size:16px;line-height:1.8;color:var(--soft-text);
        margin-top:14px">%s</p>
      <div style="height:1px;background:var(--border);margin:26px 0"></div>
      <p style="font-size:14px;line-height:1.8;color:var(--muted)">
        모든 투어에 스노클 장비와 구명조끼, 음료와 간식이 포함됩니다.
        한국인 크루가 함께 탑승합니다.</p>
      <button class="btn btn-line" style="height:48px;padding:0 24px;margin-top:24px;
        font-size:15px">%s</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px">%s</div>
  </div>
</section>
</div>""" % (W, hero_block(), PAD, TOUR["title"], TOUR["subtitle"], TOUR["more"],
             "".join(card(t) for t in T))
    return page("틀-3 · 좌측 고정", HERO_CSS, body)


# ========================================================  틀-4 · 피처
def frame_feature():
    lead = T[0]
    small = ""
    for t in T[1:]:
        small += """
<article style="display:flex;flex-direction:column;background:#ffffff;
  border:1px solid var(--border);border-radius:14px;box-shadow:%s;overflow:hidden">
  <img src="%s" alt="%s" style="width:100%%;height:132px;object-fit:cover;display:block">
  <div style="display:flex;flex-direction:column;flex:1;padding:18px">
    %s
    <h3 style="font-size:16px;font-weight:700;line-height:1.4;color:%s;
      margin-top:9px">%s</h3>
    <p style="font-size:12.5px;line-height:1.65;color:%s;margin-top:6px">%s</p>
    <div style="margin-top:auto;padding-top:16px">
      <div class="num" style="font-size:11.5px;color:%s">%s</div>
      <div class="num" style="font-size:19px;font-weight:700;color:%s;
        margin-top:2px">%s</div>
      <button class="btn btn-line" style="width:100%%;height:42px;margin-top:12px;
        font-size:14px;border-radius:10px">%s</button>
    </div>
  </div>
</article>""" % ("var(--e-navy)" if t.get("navy") else "var(--e2)",
                 t["img"], t["name"], tag(t),
                 "var(--navy)", t["name"], "var(--muted)", t["feats"][0],
                 "var(--muted)", t["sub"], "var(--navy)", t["price"], BOOK)
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="padding:126px %dpx 96px;background:var(--plane)">%s
  <article style="display:grid;grid-template-columns:1fr 1fr;background:#ffffff;
    border:1px solid var(--border);border-radius:16px;box-shadow:var(--e3);
    overflow:hidden;margin-bottom:24px">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;min-height:400px;
      object-fit:cover;display:block">
    <div style="padding:40px 42px;display:flex;flex-direction:column">
      %s
      <h3 style="font-size:30px;font-weight:700;line-height:1.32;color:var(--navy);
        margin-top:14px">%s</h3>
      <p style="font-size:15px;line-height:1.8;color:var(--muted);margin-top:12px">%s</p>
      %s
      <div style="display:flex;align-items:flex-end;justify-content:space-between;
        gap:16px;margin-top:auto;padding-top:26px">
        <div>%s</div>
        <button class="btn btn-fill" style="height:50px;padding:0 30px;
          font-size:16px">%s</button>
      </div>
    </div>
  </article>
  <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px">%s</div>
</section>
</div>""" % (W, hero_block(), PAD, sect_head(), lead["img"], lead["name"],
             tag(lead), lead["name"], lead["desc"], checklist(lead["feats"]),
             price_pair(lead, 26), BOOK, small)
    return page("틀-4 · 피처", HERO_CSS, body)


if __name__ == "__main__":
    for name, fn in [("Frame1.dc.html", frame_list), ("Frame2.dc.html", frame_tabs),
                     ("Frame3.dc.html", frame_sticky), ("Frame4.dc.html", frame_feature)]:
        io.open(name, "w", encoding="utf-8").write(fn())
        print(name, "ok")
