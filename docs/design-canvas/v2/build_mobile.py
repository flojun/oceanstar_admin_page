# -*- coding: utf-8 -*-
"""5안 모바일 375 아트보드 생성. 터치 타깃 44 이상, 하단 고정 CTA 64px."""
import io
from _base import TOURS, stars, page
from parts import STATS

T = TOURS
MW, MP = 375, 16

MSTYLE = """
.mrow{display:flex;align-items:center;justify-content:space-between}
.bar{position:absolute;left:0;right:0;bottom:0;height:64px;background:var(--surface);
  border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;padding:0 16px;
  box-shadow:0 -8px 24px rgba(0,119,168,.10)}
"""


def mheader(dark=False):
    fg = "#fff" if dark else "var(--navy)"
    line = "rgba(255,255,255,.2)" if dark else "var(--border)"
    chip = "rgba(255,255,255,.12)" if dark else "var(--soft)"
    burger = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="%s" '
              'stroke-width="2" stroke-linecap="round" aria-hidden="true">'
              '<path d="M4 7h16M4 12h16M4 17h16"/></svg>') % fg
    return """
<header class="mrow" style="height:60px;padding:0 %dpx;border-bottom:1px solid %s;
  background:%s;position:relative;z-index:6">
  <span class="d" style="font-size:21px;color:%s">OCEAN STAR</span>
  <div style="display:flex;gap:8px;align-items:center">
    <button class="btn" style="height:44px;min-width:44px;padding:0 14px;font-size:14px;
      background:%s;color:%s;border:1px solid %s">EN</button>
    <button class="btn" aria-label="메뉴 열기" style="width:44px;height:44px;padding:0;
      background:%s;border:1px solid %s">%s</button>
  </div>
</header>""" % (MP, line, "transparent" if dark else "var(--surface)", fg,
                chip, fg, line, chip, line, burger)


def mstatband(navy=True):
    cells = ""
    for i, (n, l) in enumerate(STATS):
        if navy:
            c = "var(--sky)" if i == 0 else "#fff"
            sub = "var(--on-navy)"
        else:
            c = "var(--primary)" if i == 0 else "var(--navy)"
            sub = "var(--muted)"
        cells += ('<div><div class="d num" style="font-size:26px;line-height:1.1;color:%s">%s</div>'
                  '<div style="font-size:13px;color:%s;margin-top:4px">%s</div></div>') % (c, n, sub, l)
    bg = "var(--navy)" if navy else "var(--surface)"
    bd = "none" if navy else "1px solid var(--border)"
    return ('<div style="background:%s;border:%s;border-radius:20px;padding:24px 22px;'
            'display:grid;grid-template-columns:1fr 1fr;gap:22px 14px">%s</div>') % (bg, bd, cells)


def mcard(t, img_h=190):
    navy = t.get("navy")
    bg = "var(--navy)" if navy else "var(--surface)"
    bd = "none" if navy else "1px solid var(--border)"
    tc = "#fff" if navy else "var(--navy)"
    mc = "var(--on-navy)" if navy else "var(--muted)"
    dv = "rgba(255,255,255,.16)" if navy else "var(--inner)"
    sh = "var(--sh-navy)" if navy else "var(--sh-card)"
    if navy:
        bbg, bfg, btn = "var(--sky)", "var(--navy)", "background:var(--sky);color:var(--navy)"
    elif t.get("hot"):
        bbg, bfg = "var(--primary)", "#fff"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    else:
        bbg, bfg = "var(--surface)", "var(--navy)"
        btn = "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)"
    return """
<article style="background:%s;border:%s;border-radius:20px;box-shadow:%s;overflow:hidden">
  <div style="position:relative;height:%dpx">
    <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
    <span style="position:absolute;top:12px;left:12px;background:%s;color:%s;font-size:12px;
      font-weight:700;padding:6px 10px;border-radius:8px">%s</span>
  </div>
  <div style="padding:20px">
    <h3 class="d" style="font-size:19px;line-height:1.35;color:%s">%s</h3>
    <p class="num" style="font-size:14px;line-height:1.6;color:%s;margin-top:6px">%s</p>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid %s">
      <div class="mrow">
        <div><div class="d num" style="font-size:26px;line-height:1.15;color:%s">%s</div>
          <div class="num" style="font-size:12px;color:%s;margin-top:2px">%s</div></div>
      </div>
      <button class="btn" style="width:100%%;height:52px;margin-top:14px;font-size:16px;%s">예약하기</button>
    </div>
  </div>
</article>""" % (bg, bd, sh, img_h, t["img"], t["name"], bbg, bfg, t["badge"],
                 tc, t["name"], mc, t["meta"], dv, tc, t["price"], mc, t["sub"], btn)


def mlist(gap=16, cards=None):
    cards = cards if cards is not None else T
    return ('<div style="display:grid;grid-template-columns:minmax(0,1fr);gap:%dpx">%s</div>'
            % (gap, "".join(mcard(t) for t in cards)))


def bottombar():
    return """
<div class="bar">
  <div style="flex:1">
    <div class="d num" style="font-size:19px;color:var(--navy);line-height:1.1">₩151,570~</div>
    <div style="font-size:12px;color:var(--muted)">1인 · 세금 포함</div>
  </div>
  <button class="btn btn-fill" style="height:48px;padding:0 26px;font-size:16px">예약하기</button>
</div>"""


def msection_title(lead, brand, note=None):
    n = ('<p style="font-size:15px;line-height:1.7;color:var(--soft-text);margin-top:10px">%s</p>'
         % note) if note else ""
    return ('<h2 class="d" style="font-size:32px;line-height:1.2">%s'
            '<span style="color:var(--primary)">%s</span></h2>%s') % (lead, brand, n)


def wrap(inner, h, bg="var(--surface)"):
    return ('<div style="width:%dpx;min-height:%dpx;position:relative;background:%s;'
            'padding-bottom:80px">%s%s</div>') % (MW, h, bg, inner, bottombar())


# ---------------- 1안 · 항해 ----------------
def voyage():
    style = MSTYLE + """
@keyframes sailm{0%{transform:translateY(0) rotate(-.6deg)}100%{transform:translateY(-10px) rotate(.6deg)}}
.boat{animation:sailm 6s ease-in-out infinite alternate}
"""
    inner = """
%s
<section style="padding:28px %dpx 0;background:linear-gradient(180deg,#fff 0%%,#eef8fc 100%%)">
  <span class="pill" style="font-size:11px;padding:7px 14px">SINCE 2019 · 하와이 한인 최초</span>
  <h1 class="d" style="font-size:46px;line-height:1.06;margin-top:16px">
    와이키키 앞바다에서<br><span style="color:var(--primary)">바다거북</span>을 만납니다</h1>
  <p style="font-size:15px;line-height:1.75;color:var(--soft-text);margin-top:14px">
    51인승 루프탑 보트로 매일 세 번 출항합니다. 2019년부터 14,000명이 이 배를 탔습니다.</p>
  <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:20px;font-size:16px">예약하기</button>
  <button class="btn btn-line" style="width:100%%;height:52px;margin-top:10px;font-size:16px">투어 코스 보기</button>
</section>
<div style="position:relative;margin-top:26px;height:262px;overflow:hidden">
  <svg viewBox="0 0 375 120" preserveAspectRatio="none" aria-hidden="true"
    style="position:absolute;left:0;right:0;bottom:0;width:100%%;height:120px">
    <path fill="#bfe6f6" fill-opacity=".6" d="M0 52c60-24 110 18 180 18s110-30 195-14v64H0Z"/>
    <path fill="#8fd3ef" fill-opacity=".55" d="M0 80c70-20 120 10 190 12s110-20 185-8v36H0Z"/>
  </svg>
  <img class="boat" src="boat.jpg" alt="오션스타 51인승 루프탑 보트"
    style="position:absolute;left:16px;top:6px;width:343px;height:230px;object-fit:cover;
    border-radius:20px;box-shadow:0 18px 40px rgba(0,119,168,.22)">
</div>
<div style="padding:24px %dpx 0">%s</div>
<section style="padding:44px %dpx 0">
  %s
  <div style="margin-top:22px">%s</div>
</section>""" % (mheader(), MP, MP, mstatband(), MP,
                 msection_title("추천 ", "프로그램"), mlist())
    return page("1안 · 항해 (모바일)", style, wrap(inner, 3760))


# ---------------- 2안 · 몰입 ----------------
def immersion():
    style = MSTYLE + """
@keyframes surfm{from{transform:scale(1.10)}to{transform:scale(1)}}
.dive{animation:surfm 18s ease-out both}
"""
    inner = """
<section style="position:relative;height:600px;overflow:hidden;background:var(--navy)">
  <img class="dive" src="turtle.jpg" alt="와이키키 앞바다의 바다거북"
    style="position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(10,63,102,.70) 0%%,rgba(10,63,102,.30) 34%%,rgba(10,63,102,.92) 100%%)"></div>
  <div style="position:relative;z-index:3">%s</div>
  <div style="position:absolute;left:%dpx;right:%dpx;bottom:30px;z-index:3">
    <span style="display:inline-flex;border-radius:9999px;background:rgba(255,255,255,.14);
      border:1px solid rgba(255,255,255,.32);color:#fff;font-size:11px;font-weight:700;
      letter-spacing:.16em;padding:7px 14px">SINCE 2019 · 하와이 한인 최초</span>
    <h1 class="d" style="font-size:48px;line-height:1.06;color:#fff;margin-top:16px">
      배에서 내리면<br><span style="color:var(--sky)">바로 거북이</span></h1>
    <p style="font-size:15px;line-height:1.75;color:#d5ebf7;margin-top:12px">
      와이키키에서 15분. 거북이가 사는 자리로 곧장 갑니다.</p>
    <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:18px;font-size:16px">예약하기</button>
  </div>
</section>
<div style="padding:24px %dpx 0">%s</div>
<section style="padding:44px %dpx 0">
  %s
  <div style="margin-top:22px">%s</div>
</section>""" % (mheader(dark=True), MP, MP, MP, mstatband(navy=False), MP,
                 msection_title("여섯 가지 ", "항해",
                                "출발 시간과 활동만 다릅니다. 거북이를 만나는 것은 전부 같습니다."),
                 mlist())
    return page("2안 · 몰입 (모바일)", style, wrap(inner, 3820))


# ---------------- 3안 · 벤토 ----------------
def bento():
    style = MSTYLE + """
@keyframes bobm{0%{transform:translateY(0)}100%{transform:translateY(-9px)}}
.bob{animation:bobm 5s ease-in-out infinite alternate}
"""
    inner = """
%s
<section style="padding:20px %dpx 0;display:grid;grid-template-columns:minmax(0,1fr);gap:14px">
  <div style="background:var(--navy);border-radius:20px;padding:30px 24px;box-shadow:var(--sh-navy)">
    <span style="display:inline-flex;border-radius:9999px;background:rgba(255,255,255,.12);
      border:1px solid rgba(255,255,255,.26);color:#fff;font-size:11px;font-weight:700;
      letter-spacing:.16em;padding:7px 14px">SINCE 2019 · 하와이 한인 최초</span>
    <h1 class="d" style="font-size:44px;line-height:1.08;color:#fff;margin-top:16px">
      와이키키 앞바다<br><span style="color:var(--sky)">거북이 투어</span></h1>
    <p style="font-size:15px;line-height:1.75;color:#c7e4f2;margin-top:12px">
      51인승 루프탑 보트로 매일 세 번. 14,000명이 이 배를 탔습니다.</p>
    <button class="btn" style="width:100%%;height:52px;margin-top:18px;font-size:16px;
      background:var(--sky);color:var(--navy)">예약하기</button>
  </div>
  <div style="border-radius:20px;overflow:hidden;height:200px;background:#e2f2fb">
    <img class="bob" src="boat.jpg" alt="오션스타 루프탑 보트"
      style="width:100%%;height:100%%;object-fit:cover;display:block">
  </div>
  %s
</section>
<section style="padding:44px %dpx 0">
  %s
  <div style="margin-top:22px">%s</div>
</section>""" % (mheader(), MP, mstatband(navy=False), MP,
                 msection_title("추천 ", "프로그램"), mlist())
    return page("3안 · 벤토 (모바일)", style, wrap(inner, 3820, "var(--soft)"))


# ---------------- 4안 · 하루의 항로 ----------------
RAIL = [("08:00", "var(--sky)"), ("11:00", "#4cc3e6"), ("15:00", "var(--primary)"),
        ("종일", "#0d6f9e"), ("단독", "var(--navy)"), ("오전", "#1a86b5")]


def timeline():
    style = MSTYLE + """
@keyframes glidem{0%{transform:translateY(0)}100%{transform:translateY(-10px)}}
.boat{animation:glidem 6s ease-in-out infinite alternate}
"""
    rows = ""
    for i, t in enumerate(T):
        chip, col = RAIL[i]
        rows += """
<div style="display:grid;grid-template-columns:56px 1fr;gap:12px;align-items:start">
  <div style="display:flex;flex-direction:column;align-items:center;padding-top:8px">
    <span class="d num" style="font-size:16px;color:%s">%s</span>
    <span style="width:12px;height:12px;border-radius:50%%;background:%s;margin-top:8px;
      box-shadow:0 0 0 4px #fff,0 0 0 6px %s"></span>
  </div>
  <div style="padding-bottom:18px">%s</div>
</div>""" % (col, chip, col, col, mcard(t, img_h=170))
    inner = """
%s
<section style="padding:26px %dpx 0;background:linear-gradient(180deg,#fff 0%%,#eef8fc 100%%)">
  <span class="pill" style="font-size:11px;padding:7px 14px">SINCE 2019 · 하와이 한인 최초</span>
  <h1 class="d" style="font-size:46px;line-height:1.06;margin-top:16px">
    몇 시 배를<br>타시겠어요?</h1>
  <p style="font-size:15px;line-height:1.75;color:var(--soft-text);margin-top:14px">
    아침 8시부터 저녁 6시까지 하루 세 번 출항합니다. 시간표를 보고 고르세요.</p>
  <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:20px;font-size:16px">예약하기</button>
  <button class="btn btn-line" style="width:100%%;height:52px;margin-top:10px;font-size:16px">투어 코스 보기</button>
  <img class="boat" src="boat.jpg" alt="오션스타 51인승 루프탑 보트"
    style="width:100%%;height:200px;object-fit:cover;border-radius:20px;margin-top:24px;
    box-shadow:0 18px 40px rgba(0,119,168,.20)">
</section>
<div style="padding:24px %dpx 0">%s</div>
<section style="padding:44px %dpx 0">
  %s
  <div style="margin-top:22px;position:relative">
    <div style="position:absolute;left:27px;top:20px;bottom:40px;width:3px;border-radius:2px;
      background:linear-gradient(180deg,var(--sky),var(--primary) 46%%,var(--navy))"></div>
    %s
  </div>
</section>""" % (mheader(), MP, MP, mstatband(), MP,
                 msection_title("하루의 ", "항로", "출항 시각 순서대로 여섯 가지."), rows)
    return page("4안 · 하루의 항로 (모바일)", style, wrap(inner, 4020))


# ---------------- 5안 · 정리된 여백 ----------------
def clarity():
    style = MSTYLE + """
@keyframes risem{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.r{animation:risem .7s cubic-bezier(.16,1,.3,1) both}.r2{animation-delay:.09s}.r3{animation-delay:.18s}
"""
    rows = ""
    for i, t in enumerate(T):
        last = "border-bottom:0;" if i == len(T) - 1 else ""
        rows += """
<div style="display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center;
  padding:18px 0;border-bottom:1px solid var(--border);%s">
  <img src="%s" alt="%s" style="width:96px;height:76px;object-fit:cover;border-radius:12px;display:block">
  <div>
    <h3 class="d" style="font-size:18px;line-height:1.3">%s</h3>
    <p class="num" style="font-size:13px;color:var(--muted);margin-top:4px">%s</p>
    <div class="mrow" style="margin-top:8px">
      <span class="d num" style="font-size:20px;color:var(--navy)">%s</span>
      <a href="#" style="font-size:14px;font-weight:700;min-height:44px;display:flex;
        align-items:center">예약하기</a>
    </div>
  </div>
</div>""" % (last, t["img"], t["name"], t["name"], t["meta"], t["price"])
    inner = """
%s
<section style="padding:30px %dpx 0">
  <span class="r" style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:.16em;
    color:var(--primary);border-bottom:2px solid var(--cyan);padding-bottom:7px">SINCE 2019 · 하와이 한인 최초</span>
  <h1 class="r r2 d" style="font-size:46px;line-height:1.06;margin-top:18px">
    바다거북을<br>만나는 시간</h1>
  <p class="r r3" style="font-size:15px;line-height:1.75;color:var(--soft-text);margin-top:14px">
    와이키키 앞바다, 51인승 루프탑 보트. 2019년부터 14,000명이 이 배를 탔습니다.</p>
  <button class="btn btn-fill" style="width:100%%;height:52px;margin-top:20px;font-size:16px">예약하기</button>
  <button class="btn btn-line" style="width:100%%;height:52px;margin-top:10px;font-size:16px">투어 코스 보기</button>
</section>
<img src="couple.jpg" alt="오션스타 보트 위에서 바라본 다이아몬드 헤드"
  style="width:100%%;height:230px;object-fit:cover;display:block;margin-top:28px">
<div style="padding:26px %dpx 0">%s</div>
<section style="padding:44px %dpx 0">
  <div class="mrow" style="align-items:flex-end">
    %s
    <a href="#" style="font-size:14px;font-weight:700;padding-bottom:4px">전체 일정</a>
  </div>
  <div style="margin-top:14px;border-top:1px solid var(--border)">%s</div>
</section>""" % (mheader(), MP, MP, mstatband(navy=False), MP,
                 msection_title("여섯 가지 ", "프로그램"), rows)
    return page("5안 · 정리된 여백 (모바일)", style, wrap(inner, 2280))


if __name__ == "__main__":
    for name, fn in [("Voyage_M", voyage), ("Immersion_M", immersion), ("Bento_M", bento),
                     ("Timeline_M", timeline), ("Clarity_M", clarity)]:
        io.open(name + ".dc.html", "w", encoding="utf-8").write(fn())
        print(name, "ok")
