# -*- coding: utf-8 -*-
"""새-8 · 스크롤 투어 — 모바일 375.

데스크탑과 같은 순서로 간다.
히어로 영상 → 소개 → 지표 → 오션스타 추천 프로그램 → 푸터

375 폭에서 다시 판단한 것
· 히어로 — 영상이 2.076:1 이라 375 폭 전면으로 깔면 높이가 181px 밖에 안 나온다.
  배도 활자도 들어갈 자리가 없다. 그래서 흰 활자 블록을 위에 놓고 아래를 250px
  영상 띠로 잘라 쓴다. object-position 을 오른쪽 끝(92%)에 붙여야 배가 화면에
  남는다. 가운데 정렬하면 좁은 폭에서 배가 잘려나간다.
· 스펙 — 세 칸을 나란히 두면 한 칸이 100px 이라 '1부 08:00–11:00' 이 세 줄이 된다.
  운영 시간만 한 줄 통으로 쓰고 정원·요금 기준을 아래 두 칸으로 내렸다.
· 예약 — 값과 버튼을 한 줄에 두면 버튼이 44px 최소 타깃 아래로 눌린다.
  값을 위, 버튼 두 개를 아래 전폭으로 내렸다.
· 헤더 — 좁은 폭에 7항목을 다 펴면 글자가 읽히지 않는다. 데스크탑과 같은 메뉴를
  햄버거 안에 두고 밖에는 EN 과 예약 버튼만 남긴다. 운영 중인 모바일 안과 같은 방식.
· 사진 뒤 하늘색 판 — 데스크탑은 옆으로 어긋냈지만 모바일은 폭이 없어 아래로만
  어긋낸다.

스크롤 연출은 데스크탑과 같은 규칙이다. 쉬는 상태가 기본값이고 키프레임은
'숨김 → 보임' 방향으로만 간다. 모션이 죽은 환경에선 그냥 다 보이는 화면이 된다.
"""
import io

from build_new8 import (CLOCK, FORK, IG, PIN, YT, badge_of, delay, icon,
                        includes, spec)
from build_v2 import HERO, NAV, STATS, TOUR, TOURS

T = TOURS
W, PAD = 375, 20
IMG, ALT = "hero_boat.webp", "와이키키 앞바다의 오션스타 51인승 루프탑 보트"

NAVY, PRIMARY, CYAN, SKY = "#0A3F66", "#0077A8", "#00A0D0", "#6FD0EE"
TEXT, MUTED, BORDER, PAPER = "#44586A", "#7B8FA0", "#E3EDF4", "#F4FAFD"

BURGER = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A3F66" '
          'stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/>'
          '</svg>')


def mrows():
    out = ""
    for i, t in enumerate(T):
        when, who, unit = spec(t)
        cells = ('<div class="cell wide"><span class="lab">운영 시간</span><b>%s</b></div>'
                 '<div class="cell"><span class="lab">정원</span><b>%s</b></div>'
                 '<div class="cell"><span class="lab">요금 기준</span><b>%s</b></div>'
                 ) % (when, who, unit)
        feats = "".join('<li>%s</li>' % f for f in includes(t))
        out += """
<section id="t%d" class="row">
  <div class="frame rise">
    <span class="plate"></span>
    <span class="shot"><img src="%s" alt="%s"></span>
  </div>
  <div class="col rise" style="%s">
    <span class="badge">%s</span>
    <h3>%s</h3>
    <p>%s</p>
    <div class="specs">%s</div>
    <div class="lab lab-b">포함 사항</div>
    <ul class="check">%s</ul>
    <div class="buy">
      <span class="buy-sub">%s</span>
      <b class="n">%s</b>
      <div class="buy-act">
        <a href="#" class="ghost">%s</a>
        <a href="#" class="solid">%s</a>
      </div>
    </div>
  </div>
</section>""" % (i + 1, t["img"], t["name"], delay(1), badge_of(t), t["name"],
                 t["desc"], cells, feats, t["sub"], t["price"],
                 TOUR["more"], TOUR["book"])
    return out


def mfooter():
    """데스크탑과 같은 내용을 한 단으로 쌓는다. 문구는 운영 중인 사이트 그대로."""
    return """
<footer class="foot rise">
  <div class="foot-in">
    <h4 class="fh">%s 하와이 현지 영업시간 안내</h4>
    <div class="fcard">
      <div class="frow">
        <span class="fchip">영업시간</span>
        <b>하와이 현지 기준 월~토 09:00~17:00</b>
      </div>
      <div class="flinks">
        <a href="https://www.instagram.com/oceanstar_turtlesnorkelling" class="fic"
           aria-label="Instagram">%s</a>
        <a href="https://www.youtube.com/@oceanstarhi" class="fic"
           aria-label="YouTube">%s</a>
        <a href="#" class="fbtn">%s 맛집 리스트 보기</a>
      </div>
    </div>
    <h4 class="fh" style="margin-top:30px">%s 하와이 주소 및 연락처</h4>
    <div class="fcard">
      <div class="frow">
        <span class="fchip">이메일</span>
        <b>hioceanstar@gmail.com</b>
      </div>
      <div class="frow">
        <span class="fchip">주소</span>
        <div>
          <b>1125 Kewalo Basin Harbor, Gate D #110, Honolulu, HI 96814</b>
          <a href="#" class="fmap">구글 지도로 바로보기</a>
        </div>
      </div>
    </div>
    <div class="foot-mid">
      <h4 class="fname">오션스타 (Waikiki Turtle Snorkeling)</h4>
      <p class="fdesc">하와이 한인 최초 거북이 스노클링 원조<br>
        여행 플랫폼 8,000 리뷰 · 구글 5,000 리뷰</p>
      <div class="fbiz">
        <p><span>상호명:</span> Oceanview Activity LLC</p>
        <p><span>사업장 소재지:</span> 615 PIKOI ST. STE 811</p>
        <p><span>사업자 전화번호:</span> 8083081792</p>
      </div>
    </div>
    <div class="foot-bot">© 2026 Ocean Star. All Rights Reserved.</div>
  </div>
</footer>""" % (icon(CLOCK, 18), icon(IG, 22), icon(YT, 22), icon(FORK, 17),
                icon(PIN, 18))


def scroll_tour_m():
    stats = "".join(
        '<div class="stat rise" style="%s"><b class="n">%s</b><span>%s</span></div>'
        % (delay(i, 2), n, l) for i, (n, l) in enumerate(STATS))
    body = """
<div class="page">
  <header class="mhead">
    <img src="logo_full.png" alt="오션스타" class="logo">
    <div class="mact">
      <a href="#" class="mchip">EN</a>
      <a href="#" class="mbook">예약</a>
      <button class="mburger" aria-label="메뉴 열기">%s</button>
    </div>
  </header>

  <section class="mtop rise">
    <span class="kicker">%s</span>
    <h2>%s</h2>
    <h1>%s</h1>
  </section>
  <section class="mhero">
    <img src="%s" alt="%s" class="hero-img">
    <span class="cue">SCROLL</span>
  </section>

  <section class="intro rise">
    <p>%s</p>
    <a href="#" class="solid">%s</a>
  </section>

  <section class="stats">%s</section>

  <section class="sect">
    <div class="head rise">
      <span class="lab">다섯 가지 바다</span>
      <h2>%s</h2>
      <p>%s</p>
    </div>
  </section>
  %s
  %s
</div>""" % (BURGER, HERO["badge"], HERO["t1"], HERO["t2"], IMG, ALT,
             HERO["desc"], HERO["cta"], stats,
             TOUR["title"], TOUR["subtitle"], mrows(), mfooter())
    return DOC % (CSS, body)


CSS = """/*__FONTS__*//*__FONTS_END__*/
:root{
  --navy:%s; --primary:%s; --cyan:%s; --sky:%s;
  --text:%s; --muted:%s; --border:%s; --paper:%s;
  --pad:%dpx;
  --e1:0 1px 2px rgba(0,119,168,.06), 0 4px 12px rgba(0,119,168,.07);
  --e2:0 2px 6px rgba(0,119,168,.09), 0 14px 30px rgba(0,119,168,.14);
}
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,h4,p,ul,li{margin:0;padding:0}
li{list-style:none}
a{text-decoration:none;color:inherit}
img{display:block;max-width:100%%}
.n{font-variant-numeric:tabular-nums}
.page{width:%dpx;background:#fff;color:var(--text);
  font-family:'Pretendard',system-ui,sans-serif;word-break:keep-all;
  -webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'SUIT',system-ui,sans-serif;color:var(--navy);letter-spacing:-.02em}
.lab{display:block;font-size:11px;font-weight:700;letter-spacing:.14em;
  text-transform:uppercase;color:var(--primary)}

/* 손가락으로 누르는 것은 전부 44px 아래로 내려가지 않는다. */
.solid{display:inline-flex;align-items:center;justify-content:center;height:52px;
  padding:0 26px;border-radius:999px;background:var(--primary);color:#fff;
  font-size:15px;font-weight:700;white-space:nowrap;
  box-shadow:0 2px 4px rgba(0,119,168,.24), 0 10px 22px rgba(0,119,168,.30),
             inset 0 1px 0 rgba(255,255,255,.28)}
.ghost{display:inline-flex;align-items:center;justify-content:center;height:52px;
  padding:0 22px;border-radius:999px;border:1.5px solid var(--primary);
  color:var(--primary);font-size:15px;font-weight:700;background:#fff}

/* ── 헤더. 데스크탑과 같은 메뉴는 햄버거 안에 둔다 ────────────────────── */
.mhead{height:62px;display:flex;align-items:center;justify-content:space-between;
  padding:0 var(--pad);border-bottom:1px solid var(--border);background:#fff}
.logo{height:42px;width:auto}
.mact{display:flex;align-items:center;gap:7px}
.mchip{display:inline-flex;align-items:center;justify-content:center;height:44px;
  min-width:44px;padding:0 12px;border-radius:12px;border:1px solid var(--border);
  background:var(--paper);color:var(--navy);font-size:14px;font-weight:700}
.mbook{display:inline-flex;align-items:center;justify-content:center;height:44px;
  padding:0 15px;border-radius:12px;background:var(--primary);color:#fff;
  font-size:14px;font-weight:700}
.mburger{width:44px;height:44px;border:1px solid var(--border);border-radius:12px;
  background:var(--paper);display:flex;align-items:center;justify-content:center;
  padding:0;cursor:pointer}

/* ── 히어로. 활자는 흰 바탕, 배는 아래 영상 띠 ───────────────────────── */
.mtop{padding:30px var(--pad) 24px}
.kicker{display:inline-block;font-size:11.5px;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:var(--primary)}
.mtop h2{font-size:19px;line-height:1.5;font-weight:400;color:var(--text);margin-top:12px;
  font-family:'Pretendard',system-ui,sans-serif;letter-spacing:0}
.mtop h1{font-size:33px;line-height:1.24;font-weight:800;margin-top:6px}
.mhero{position:relative;height:250px;overflow:hidden}
/* 좁은 폭에서 가운데를 잡으면 배가 잘린다. 오른쪽 끝에 붙여야 배가 남는다. */
.hero-img{width:100%%;height:100%%;object-fit:cover;object-position:92%% center;
  filter:brightness(1.00) saturate(1.06) contrast(1.00)}
.cue{position:absolute;right:14px;bottom:16px;font-size:10px;font-weight:700;
  letter-spacing:.3em;color:rgba(255,255,255,.86);writing-mode:vertical-rl;
  text-shadow:0 1px 8px rgba(6,26,40,.6)}

/* ── 소개 · 지표 ──────────────────────────────────────────────────── */
.intro{padding:28px var(--pad) 4px}
.intro p{font-size:16px;line-height:1.9}
.intro .solid{margin-top:20px;width:100%%}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;padding:28px var(--pad) 4px}
.stat{padding:18px 0 20px;border-top:2px solid var(--border)}
.stat b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:29px;
  font-weight:800;color:var(--navy)}
.stat span{display:block;margin-top:6px;font-size:13px;color:var(--muted)}

/* ── 섹션 머리 ────────────────────────────────────────────────────── */
.sect{padding:44px var(--pad) 0}
.head h2{font-size:31px;line-height:1.3;margin-top:12px}
.head p{font-size:14.5px;line-height:1.8;color:var(--muted);margin-top:10px}

/* ── 상품. 사진 위, 활자 아래 ─────────────────────────────────────── */
.row{padding:34px var(--pad)}
.frame{position:relative;margin-bottom:26px}
/* 폭이 없어 옆으로는 못 어긋낸다. 아래로만 내민다. */
.plate{position:absolute;left:22px;right:22px;bottom:-14px;height:60px;border-radius:20px;
  background:linear-gradient(135deg,var(--sky),var(--cyan));opacity:.34}
.shot{position:relative;display:block;border-radius:20px;overflow:hidden;
  box-shadow:var(--e2)}
.shot img{width:100%%;height:236px;object-fit:cover}
.badge{display:inline-flex;align-items:center;height:30px;padding:0 13px;
  border-radius:999px;background:var(--paper);color:var(--primary);
  font-size:12.5px;font-weight:700;border:1px solid var(--border)}
.col h3{font-size:26px;line-height:1.34;margin-top:13px}
.col p{font-size:15.5px;line-height:1.85;margin-top:11px}
.specs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px}
/* 운영 시간만 한 줄을 통으로 쓴다. 셋을 나란히 두면 시간이 세 줄로 접힌다. */
.cell{background:var(--paper);border-radius:12px;padding:13px 14px}
.cell.wide{grid-column:1 / -1}
.cell .lab{font-size:10.5px;letter-spacing:.1em;color:var(--muted)}
.cell b{display:block;margin-top:6px;font-size:14px;font-weight:600;color:var(--navy);
  line-height:1.45}
.lab-b{margin-top:22px}
.check{margin-top:11px;display:grid;gap:10px}
.check li{position:relative;padding-left:24px;font-size:14.5px;line-height:1.6}
.check li::before{content:"";position:absolute;left:4px;top:5px;width:6px;height:10px;
  border:solid var(--primary);border-width:0 2px 2px 0;transform:rotate(45deg)}
.buy{margin-top:26px;padding-top:20px;border-top:1px solid var(--border)}
.buy-sub{display:block;font-size:12.5px;color:var(--muted)}
.buy b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:32px;
  font-weight:800;color:var(--navy);margin-top:7px}
.buy-act{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}

/* ── 푸터 ─────────────────────────────────────────────────────────── */
.foot{background:var(--navy);color:rgba(255,255,255,.82);margin-top:18px}
.foot-in{padding:42px var(--pad) 30px}
.fh{display:flex;align-items:center;gap:8px;font-size:17px;color:#fff;margin-bottom:14px}
.fh svg{color:var(--sky)}
.fcard{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);
  border-radius:16px;padding:17px 18px;display:flex;flex-direction:column;gap:14px}
.frow{display:flex;align-items:flex-start;gap:10px}
.fchip{flex:none;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);
  border-radius:7px;padding:5px 9px;font-size:11.5px;font-weight:700;color:#fff}
.frow b{display:block;font-size:13.5px;font-weight:600;color:#fff;line-height:1.6}
.flinks{display:flex;align-items:center;gap:10px;padding-top:13px;
  border-top:1px solid rgba(255,255,255,.14)}
.fic{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;
  border-radius:12px;background:rgba(255,255,255,.1);color:#fff}
.fbtn{display:inline-flex;align-items:center;gap:7px;height:44px;padding:0 15px;
  border-radius:12px;background:var(--cyan);color:#fff;font-size:13.5px;font-weight:700}
.fmap{display:inline-block;margin-top:7px;font-size:12px;color:var(--sky);
  text-decoration:underline;text-underline-offset:3px}
.foot-mid{margin-top:30px;padding-top:24px;border-top:1px solid rgba(255,255,255,.16)}
.fname{font-size:16.5px;color:#fff}
.fdesc{margin-top:9px;font-size:13.5px;line-height:1.75}
.fbiz{margin-top:20px;font-size:13px;line-height:1.95}
.fbiz span{color:rgba(255,255,255,.55);font-weight:700}
.foot-bot{margin-top:22px;padding-top:18px;border-top:1px solid rgba(255,255,255,.16);
  text-align:center;font-size:12px;color:rgba(255,255,255,.55)}

/* ── 스크롤 연출. 데스크탑과 같은 규칙, 폭이 좁으니 이동 거리만 줄인다 ──── */
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    .rise,.frame,.col,.stat{
      animation-name:rise;animation-timeline:view();animation-fill-mode:both;
      animation-timing-function:cubic-bezier(.22,.61,.36,1);
      animation-range:entry 4%% cover 28%%}
    @keyframes rise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
    .shot img{animation:pan linear both;animation-timeline:view();
      animation-range:cover 0%% cover 100%%}
    @keyframes pan{from{transform:scale(1.12) translateY(2%%)}
                   to{transform:scale(1) translateY(-2%%)}}
  }
}
""" % (NAVY, PRIMARY, CYAN, SKY, TEXT, MUTED, BORDER, PAPER, PAD, W)

DOC = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>새-8 · 스크롤 투어 — 모바일</title>
  <style>%s</style>
</helmet>
%s
</x-dc>
</body>
</html>
"""


def demo():
    """모바일에서 조용히 깨지는 두 자리."""
    html = scroll_tour_m()
    # 배가 안 보이면 히어로가 통째로 무의미해진다.
    assert "object-position:92%% center".replace("%%", "%") in html
    # 모션이 죽은 환경에서 백지가 되지 않으려면 기본값에 숨김이 없어야 한다.
    base = CSS.split("@media (prefers-reduced-motion")[0]
    assert "opacity:0" not in base.replace(" ", ""), "기본 스타일에 숨김이 있다"
    # 데스크탑과 같은 5가지가 다 들어갔는지.
    for t in T:
        assert t["name"] in html, t["name"]
    # 헤더 밖 메뉴는 줄였지만 예약 동선은 남아 있어야 한다.
    assert "예약</a>" in html
    print("demo ok")


if __name__ == "__main__":
    demo()
    io.open("New8_M.dc.html", "w", encoding="utf-8").write(scroll_tour_m())
    print("New8_M.dc.html ok")
