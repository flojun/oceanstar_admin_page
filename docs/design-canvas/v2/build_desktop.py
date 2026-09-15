# -*- coding: utf-8 -*-
"""5안 데스크탑 1440 아트보드 생성."""
import io
from _base import TOURS, stars, page
from parts import W, PAD, STATS, header, statbar, sect_title, card, grid_equal, WAVE

T = TOURS


# =========================  1안 · 항해  =========================
def voyage():
    style = """
@keyframes sail{0%{transform:translate3d(0,0,0) rotate(-.7deg)}
                100%{transform:translate3d(-26px,-14px,0) rotate(.7deg)}}
@keyframes drift1{from{transform:translateX(0)}to{transform:translateX(-46px)}}
@keyframes drift2{from{transform:translateX(0)}to{transform:translateX(34px)}}
.boat{animation:sail 7s ease-in-out infinite alternate}
.w1{animation:drift1 11s ease-in-out infinite alternate}
.w2{animation:drift2 8s ease-in-out infinite alternate}
"""
    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="position:relative;height:700px;overflow:hidden;
  background:linear-gradient(180deg,#ffffff 0%%,#f0f9fd 46%%,#e2f2fb 100%%)">
  %s
  <img class="boat" src="boat.jpg" alt="오션스타 51인승 루프탑 보트"
    style="position:absolute;right:-24px;bottom:112px;width:740px;border-radius:24px;
    box-shadow:0 30px 70px rgba(0,119,168,.24)">
  <div style="position:absolute;left:%dpx;top:76px;width:660px;z-index:3">
    <span class="pill">SINCE 2019 · 하와이 한인 최초</span>
    <h1 class="d" style="font-size:86px;line-height:1.08;margin-top:22px">
      와이키키 앞바다에서<br><span style="color:var(--primary)">바다거북</span>을 만납니다</h1>
    <p style="font-size:18px;line-height:1.8;color:var(--soft-text);max-width:450px;margin-top:22px">
      51인승 루프탑 보트로 매일 세 번 출항합니다.<br>
      2019년부터 14,000명이 이 배에서 거북이를 만났습니다.</p>
    <div style="display:flex;gap:14px;margin-top:32px">
      <button class="btn btn-fill" style="height:60px;padding:0 36px;font-size:17px">예약하기</button>
      <button class="btn btn-line" style="height:60px;padding:0 30px;font-size:17px">투어 코스 보기</button>
    </div>
  </div>
</section>
<div style="padding:0 %dpx;margin-top:-52px;position:relative;z-index:5">%s</div>
<section style="padding:148px %dpx 96px">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:44px">
    %s
    <div style="display:flex;align-items:center;gap:10px;padding-bottom:10px">
      %s<span style="font-size:14px;color:var(--muted)">누적 후기 14,000+</span>
    </div>
  </div>
  %s
</section>
</div>""" % (W, header(), WAVE, PAD, PAD, statbar(), PAD,
             sect_title("추천 ", "프로그램"), stars(), grid_equal())
    return page("1안 · 항해", style, body)


# =========================  2안 · 몰입  =========================
def immersion():
    style = """
@keyframes surface{from{transform:scale(1.09) translateY(12px)}to{transform:scale(1) translateY(0)}}
.dive{animation:surface 20s ease-out both}
"""
    cards = ""
    for t in T:
        cards += """
<article style="border-radius:20px;overflow:hidden;background:var(--surface);
  border:1px solid var(--border);box-shadow:var(--sh-card);display:flex;flex-direction:column">
  <img src="%s" alt="%s" style="width:100%%;height:250px;object-fit:cover;display:block">
  <div style="padding:26px;display:flex;flex-direction:column;flex:1">
    <span style="font-size:12px;font-weight:700;color:var(--primary);letter-spacing:.1em">%s</span>
    <h3 class="d" style="font-size:24px;line-height:1.3;margin-top:10px">%s</h3>
    <p style="font-size:14px;color:var(--muted);margin-top:8px;line-height:1.6">%s</p>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;
      margin-top:auto;padding-top:22px">
      <div><div class="d num" style="font-size:26px;color:var(--navy)">%s</div>
        <div class="num" style="font-size:13px;color:var(--muted);margin-top:2px">%s</div></div>
      <button class="btn btn-fill" style="height:48px;padding:0 26px;font-size:15px">예약하기</button>
    </div>
  </div>
</article>""" % (t["img"], t["name"], t["badge"], t["name"], t["meta"], t["price"], t["sub"])
    body = """
<div style="width:%dpx;background:var(--surface)">
<section style="position:relative;height:820px;overflow:hidden;background:var(--navy)">
  <img class="dive" src="turtle.jpg" alt="와이키키 앞바다의 바다거북"
    style="position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover">
  <div style="position:absolute;inset:0;background:linear-gradient(100deg,
    rgba(10,63,102,.90) 0%%,rgba(10,63,102,.60) 46%%,rgba(10,63,102,.10) 100%%)"></div>
  <div style="position:relative;z-index:4">%s</div>
  <div style="position:absolute;left:%dpx;top:238px;width:680px;z-index:4">
    <span style="display:inline-flex;border-radius:9999px;background:rgba(255,255,255,.14);
      border:1px solid rgba(255,255,255,.32);color:#fff;font-size:12px;font-weight:700;
      letter-spacing:.18em;padding:9px 18px">SINCE 2019 · 하와이 한인 최초</span>
    <h1 class="d" style="font-size:92px;line-height:1.06;color:#fff;margin-top:24px">
      배에서 내리면<br><span style="color:var(--sky)">바로 거북이</span></h1>
    <p style="font-size:19px;line-height:1.8;color:#dbeefa;max-width:470px;margin-top:22px">
      와이키키에서 15분. 거북이가 사는 자리로 곧장 갑니다.</p>
    <div style="display:flex;gap:14px;margin-top:34px">
      <button class="btn btn-fill" style="height:60px;padding:0 36px;font-size:17px">예약하기</button>
      <button class="btn" style="height:60px;padding:0 30px;font-size:17px;background:transparent;
        color:#fff;border:1.5px solid rgba(255,255,255,.55)">투어 코스 보기</button>
    </div>
  </div>
</section>
<div style="padding:0 %dpx;margin-top:-46px;position:relative;z-index:5">%s</div>
<section style="padding:130px %dpx 96px">
  <div style="max-width:660px;margin-bottom:48px">%s</div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">%s</div>
</section>
</div>""" % (W, header(dark=True), PAD, PAD, statbar(), PAD,
             sect_title("여섯 가지 ", "항해", "",
                        "출발 시간과 곁들이는 활동만 다릅니다. 거북이를 만나는 것은 전부 같습니다."),
             cards)
    return page("2안 · 몰입", style, body)


# =========================  3안 · 벤토  =========================
def bento():
    style = """
@keyframes bob{0%{transform:translateY(0)}100%{transform:translateY(-14px)}}
.bob{animation:bob 5.5s ease-in-out infinite alternate}
.tile{border-radius:20px;overflow:hidden}
"""
    def wide(t):
        return """
<article class="tile" style="grid-column:span 2;display:grid;grid-template-columns:290px 1fr;
  background:var(--surface);border:1px solid var(--border);box-shadow:var(--sh-card)">
  <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
  <div style="padding:26px 28px;display:flex;flex-direction:column">
    <span style="align-self:flex-start;background:%s;color:%s;font-size:12px;font-weight:700;
      padding:6px 10px;border-radius:8px">%s</span>
    <h3 class="d" style="font-size:26px;line-height:1.3;margin-top:14px">%s</h3>
    <p style="font-size:15px;color:var(--muted);margin-top:8px;line-height:1.6">%s</p>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;
      margin-top:auto;padding-top:20px">
      <div><div class="d num" style="font-size:28px">%s</div>
        <div class="num" style="font-size:13px;color:var(--muted)">%s</div></div>
      <button class="btn btn-fill" style="height:48px;padding:0 26px;font-size:15px">예약하기</button>
    </div>
  </div>
</article>""" % (t["img"], t["name"],
                 "var(--primary)" if t.get("hot") else "var(--badge)",
                 "#fff" if t.get("hot") else "var(--primary)",
                 t["badge"], t["name"], t["meta"], t["price"], t["sub"])

    def full(t):
        return """
<article class="tile" style="grid-column:span 3;display:grid;grid-template-columns:1fr 1fr;
  background:var(--navy);box-shadow:var(--sh-navy);min-height:250px">
  <div style="padding:34px 38px;display:flex;flex-direction:column">
    <span style="align-self:flex-start;background:var(--sky);color:var(--navy);font-size:12px;
      font-weight:700;padding:6px 10px;border-radius:8px">%s</span>
    <h3 class="d" style="font-size:32px;line-height:1.25;color:#fff;margin-top:14px">%s</h3>
    <p style="font-size:15px;color:var(--on-navy);margin-top:10px;line-height:1.6">%s</p>
    <div style="display:flex;align-items:flex-end;justify-content:space-between;
      margin-top:auto;padding-top:22px">
      <div><div class="d num" style="font-size:30px;color:#fff">%s</div>
        <div class="num" style="font-size:13px;color:var(--on-navy)">%s</div></div>
      <button class="btn" style="height:50px;padding:0 30px;font-size:15px;background:var(--sky);
        color:var(--navy)">예약하기</button>
    </div>
  </div>
  <img src="%s" alt="%s" style="width:100%%;height:100%%;object-fit:cover;display:block">
</article>""" % (t["badge"], t["name"], t["meta"], t["price"], t["sub"], t["img"], t["name"])

    statcells = "".join(
        '<div><div class="d num" style="font-size:30px;color:%s">%s</div>'
        '<div style="font-size:13px;color:var(--muted);margin-top:4px">%s</div></div>'
        % ("var(--primary)" if i == 0 else "var(--navy)", n, l)
        for i, (n, l) in enumerate(STATS))
    tiles = wide(T[0]) + card(T[1]) + card(T[2]) + card(T[3]) + card(T[5]) + full(T[4])
    body = """
<div style="width:%dpx;background:var(--soft)">
%s
<section style="padding:52px %dpx 0">
  <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:20px">
    <div class="tile" style="grid-row:span 2;background:var(--navy);padding:52px 48px;
      display:flex;flex-direction:column;justify-content:center;box-shadow:var(--sh-navy)">
      <span style="align-self:flex-start;border-radius:9999px;background:rgba(255,255,255,.12);
        border:1px solid rgba(255,255,255,.26);color:#fff;font-size:12px;font-weight:700;
        letter-spacing:.18em;padding:9px 18px">SINCE 2019 · 하와이 한인 최초</span>
      <h1 class="d" style="font-size:70px;line-height:1.08;color:#fff;margin-top:24px">
        와이키키 앞바다<br><span style="color:var(--sky)">거북이 투어</span></h1>
      <p style="font-size:17px;line-height:1.8;color:#c7e4f2;max-width:430px;margin-top:20px">
        51인승 루프탑 보트로 매일 세 번. 2019년부터 14,000명이 이 배를 탔습니다.</p>
      <div style="display:flex;gap:12px;margin-top:32px">
        <button class="btn" style="height:58px;padding:0 34px;font-size:17px;background:var(--sky);
          color:var(--navy)">예약하기</button>
        <button class="btn" style="height:58px;padding:0 28px;font-size:17px;background:transparent;
          color:#fff;border:1.5px solid rgba(255,255,255,.5)">투어 코스 보기</button>
      </div>
    </div>
    <div class="tile" style="min-height:300px;background:#e2f2fb">
      <img class="bob" src="boat.jpg" alt="오션스타 루프탑 보트"
        style="width:100%%;height:100%%;object-fit:cover;display:block">
    </div>
    <div class="tile" style="background:var(--surface);border:1px solid var(--border);
      padding:30px 34px;display:grid;grid-template-columns:1fr 1fr;gap:24px 20px;align-content:center">
      %s
    </div>
  </div>
</section>
<section style="padding:88px %dpx 96px">
  <div style="margin-bottom:40px">%s</div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px">%s</div>
</section>
</div>""" % (W, header(), PAD, statcells, PAD, sect_title("추천 ", "프로그램"), tiles)
    return page("3안 · 벤토", style, body)


# =========================  4안 · 하루의 항로  =========================
RAIL = [("08:00", "var(--sky)"), ("11:00", "#4cc3e6"), ("15:00", "var(--primary)"),
        ("종일", "#0d6f9e"), ("단독", "var(--navy)"), ("오전", "#1a86b5")]


def timeline():
    style = """
@keyframes glide{0%{transform:translateY(0)}100%{transform:translateY(-16px)}}
.boat{animation:glide 6s ease-in-out infinite alternate}
@keyframes fill{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.rail-fill{transform-origin:top;animation:fill 2.4s cubic-bezier(.16,1,.3,1) both}
"""
    rows = ""
    for i, t in enumerate(T):
        chip, col = RAIL[i]
        navy = t.get("navy")
        cardbg = "var(--navy)" if navy else "var(--surface)"
        tc = "#fff" if navy else "var(--navy)"
        mc = "var(--on-navy)" if navy else "var(--muted)"
        btn = ("background:var(--sky);color:var(--navy)" if navy
               else "background:var(--primary);color:#fff;box-shadow:var(--sh-cta)")
        rows += """
<div style="display:grid;grid-template-columns:104px 1fr;gap:34px;align-items:start">
  <div style="display:flex;flex-direction:column;align-items:center;padding-top:26px">
    <span class="d num" style="font-size:22px;color:%s">%s</span>
    <span style="width:15px;height:15px;border-radius:50%%;background:%s;margin-top:12px;
      box-shadow:0 0 0 5px rgba(255,255,255,1),0 0 0 7px %s"></span>
  </div>
  <article style="display:grid;grid-template-columns:236px 1fr auto;gap:28px;align-items:center;
    background:%s;border:%s;border-radius:20px;box-shadow:%s;padding:20px;margin-bottom:22px">
    <img src="%s" alt="%s" style="width:236px;height:150px;object-fit:cover;
      border-radius:14px;display:block">
    <div>
      <span style="display:inline-block;background:%s;color:%s;font-size:12px;font-weight:700;
        padding:5px 10px;border-radius:8px">%s</span>
      <h3 class="d" style="font-size:26px;line-height:1.3;color:%s;margin-top:12px">%s</h3>
      <p style="font-size:15px;color:%s;margin-top:6px;line-height:1.6">%s</p>
    </div>
    <div style="text-align:right;padding-right:8px">
      <div class="d num" style="font-size:28px;color:%s">%s</div>
      <div class="num" style="font-size:13px;color:%s;margin-top:2px">%s</div>
      <button class="btn" style="height:48px;padding:0 28px;margin-top:14px;font-size:15px;%s">예약하기</button>
    </div>
  </article>
</div>""" % (col, chip, col, col.replace("var(--", "var(--"), cardbg,
             "none" if navy else "1px solid var(--border)",
             "var(--sh-navy)" if navy else "var(--sh-card)",
             t["img"], t["name"],
             "var(--sky)" if navy else ("var(--primary)" if t.get("hot") else "var(--badge)"),
             "var(--navy)" if navy else ("#fff" if t.get("hot") else "var(--primary)"),
             t["badge"], tc, t["name"], mc, t["meta"], tc, t["price"], mc, t["sub"], btn)

    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="position:relative;height:660px;overflow:hidden;
  background:linear-gradient(160deg,#ffffff 0%%,#eaf7fc 60%%,#dcf0f9 100%%)">
  <img class="boat" src="boat.jpg" alt="오션스타 51인승 루프탑 보트"
    style="position:absolute;right:0;top:104px;width:660px;height:440px;object-fit:cover;
    border-radius:28px 0 0 28px;box-shadow:0 26px 60px rgba(0,119,168,.22)">
  <div style="position:absolute;left:%dpx;top:106px;width:600px">
    <span class="pill">SINCE 2019 · 하와이 한인 최초</span>
    <h1 class="d" style="font-size:76px;line-height:1.08;margin-top:22px">
      몇 시 배를<br>타시겠어요?</h1>
    <p style="font-size:18px;line-height:1.8;color:var(--soft-text);max-width:440px;margin-top:20px">
      아침 8시부터 저녁 6시까지 하루 세 번 출항합니다. 시간표를 보고 고르세요.</p>
    <div style="display:flex;gap:14px;margin-top:30px">
      <button class="btn btn-fill" style="height:60px;padding:0 36px;font-size:17px">예약하기</button>
      <button class="btn btn-line" style="height:60px;padding:0 30px;font-size:17px">투어 코스 보기</button>
    </div>
  </div>
</section>
<div style="padding:0 %dpx;margin-top:-52px;position:relative;z-index:5">%s</div>
<section style="padding:140px %dpx 96px">
  <div style="margin-bottom:44px">%s</div>
  <div style="position:relative">
    <div class="rail-fill" style="position:absolute;left:51px;top:34px;bottom:60px;width:3px;
      border-radius:2px;background:linear-gradient(180deg,var(--sky),var(--primary) 46%%,var(--navy))"></div>
    %s
  </div>
</section>
</div>""" % (W, header(), PAD, PAD, statbar(), PAD,
             sect_title("하루의 ", "항로", "",
                        "출항 시각 순서대로 여섯 가지. 위에서 아래로 하루가 흘러갑니다."), rows)
    return page("4안 · 하루의 항로", style, body)


# =========================  5안 · 정리된 여백  =========================
def clarity():
    style = """
@keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.r{animation:rise .8s cubic-bezier(.16,1,.3,1) both}
.r2{animation-delay:.10s}.r3{animation-delay:.20s}.r4{animation-delay:.30s}
.row{border-bottom:1px solid var(--border)}
.row:hover{background:var(--soft)}
"""
    rows = ""
    for i, t in enumerate(T):
        last = "border-bottom:0;" if i >= 4 else ""
        rows += """
<div class="row" style="display:grid;grid-template-columns:132px 1fr auto;gap:22px;
  align-items:center;padding:22px 8px;%s">
  <img src="%s" alt="%s" style="width:132px;height:92px;object-fit:cover;border-radius:12px;display:block">
  <div>
    <h3 class="d" style="font-size:21px;line-height:1.35">%s</h3>
    <p class="num" style="font-size:14px;color:var(--muted);margin-top:6px">%s</p>
  </div>
  <div style="text-align:right;min-width:190px">
    <div class="d num" style="font-size:24px">%s</div>
    <div class="num" style="font-size:13px;color:var(--muted);margin-top:2px">%s</div>
    <a href="#" style="display:inline-block;font-size:15px;font-weight:700;margin-top:8px;
      border-bottom:1.5px solid var(--outline);padding-bottom:2px">예약하기</a>
  </div>
</div>""" % (last, t["img"], t["name"], t["name"], t["meta"], t["price"], t["sub"])

    statcells = "".join(
        '<div style="padding-right:34px"><div class="d num" style="font-size:32px;color:%s">%s</div>'
        '<div style="font-size:14px;color:var(--muted);margin-top:4px">%s</div></div>'
        % ("var(--primary)" if i == 0 else "var(--navy)", n, l)
        for i, (n, l) in enumerate(STATS))

    body = """
<div style="width:%dpx;background:var(--surface)">
%s
<section style="display:grid;grid-template-columns:1fr 640px;align-items:center;
  min-height:640px;padding-left:%dpx">
  <div style="padding:80px 60px 80px 0">
    <span class="r" style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.18em;
      color:var(--primary);border-bottom:2px solid var(--cyan);padding-bottom:8px">SINCE 2019 · 하와이 한인 최초</span>
    <h1 class="r r2 d" style="font-size:82px;line-height:1.08;margin-top:26px">
      바다거북을<br>만나는 시간</h1>
    <p class="r r3" style="font-size:18px;line-height:1.8;color:var(--soft-text);max-width:430px;margin-top:22px">
      와이키키 앞바다, 51인승 루프탑 보트. 2019년부터 14,000명이 이 배를 탔습니다.</p>
    <div class="r r4" style="display:flex;gap:14px;margin-top:36px">
      <button class="btn btn-fill" style="height:60px;padding:0 36px;font-size:17px">예약하기</button>
      <button class="btn btn-line" style="height:60px;padding:0 30px;font-size:17px">투어 코스 보기</button>
    </div>
    <div style="display:flex;margin-top:56px;padding-top:30px;border-top:1px solid var(--border)">%s</div>
  </div>
  <img src="couple.jpg" alt="오션스타 보트 위에서 바라본 다이아몬드 헤드"
    style="width:640px;height:520px;object-fit:cover;border-radius:28px 0 0 28px;display:block">
</section>
<section style="padding:110px %dpx 96px">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:26px">
    %s
    <a href="#" style="font-size:15px;font-weight:700;padding-bottom:10px">전체 일정 보기</a>
  </div>
  <div style="border-top:1px solid var(--border)">%s</div>
</section>
</div>""" % (W, header(), PAD, statcells, PAD,
             sect_title("여섯 가지 ", "프로그램"), rows)
    return page("5안 · 정리된 여백", style, body)


if __name__ == "__main__":
    for name, fn in [("Voyage1", voyage), ("Immersion", immersion), ("Bento", bento),
                     ("Timeline", timeline), ("Clarity", clarity)]:
        io.open(name + ".dc.html", "w", encoding="utf-8").write(fn())
        print(name, "ok")
