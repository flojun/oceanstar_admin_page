# -*- coding: utf-8 -*-
"""새-9 · 아치, 새-10 · 블록. 배치는 새-8 그대로, 디자인 언어만 바꾼 두 안.

배치는 새-8 과 한 칸도 다르지 않다
히어로(영상 + 배지 + 대제목 + 소개 + 예약) → 지표 → 섹션 머리 →
상품 5개 사진↔활자 교차 → 푸터

바꾼 것은 조형 언어뿐이다
· 새-9 아치 — 곡선. 사진을 아치로 따고 모서리를 크게 굴린다. 스펙은 칸을 나누지
  않고 한 판을 헤어라인으로 가른다. 하늘빛 바탕에 부드러운 그림자. 리조트의 온도.
· 새-10 블록 — 직선. 라운드 0, 그림자 대신 색면. 사진 뒤에 네이비 블록을 어긋나게
  깔고 번호를 크게 얹는다. 스펙은 줄로만 나눈 표. 아웃도어 카탈로그의 온도.

두 안 모두 새-8 과 같은 데이터·같은 규칙을 쓴다. 없는 값은 지어내지 않고
[운영 시간 확정 필요] 표기를 그대로 노출한다.

히어로 활자는 사진 위에 앉는다. 대비는 check_hero_contrast.py 가 실제 렌더
픽셀로 잰다(파일명을 인자로 넘기면 이 두 안도 잰다).
"""
import io

from build_new8 import (CLOCK, FORK, IG, PIN, YT, badge_of, delay, icon,
                        includes, left_scrim, spec)
from build_v2 import HERO, NAV, STATS, TOUR, TOURS
from build_v2_boards import soft_fade, top_scrim

T = TOURS
W, PAD = 1440, 120
IMG, ALT = "hero_boat.webp", "와이키키 앞바다의 오션스타 51인승 루프탑 보트"

NAVY, PRIMARY, CYAN, SKY = "#0A3F66", "#0077A8", "#00A0D0", "#6FD0EE"
TEXT, MUTED, BORDER = "#44586A", "#7B8FA0", "#E3EDF4"


# ------------------------------------------------------------------ 공통 조각
def header():
    return """
    <header>
      <img src="logo_full.png" alt="오션스타" class="logo">
      <nav>%s</nav>
      <div class="hnav">
        <a href="#" class="chip">EN</a>
        <a href="#" class="chip">내 예약 관리</a>
        <a href="#" class="chip chip-on">투어 예약하기</a>
      </div>
    </header>""" % "".join('<a href="#">%s</a>' % n for n in NAV)


def hero(extra=""):
    """새-8 과 같은 구성. 스크림 모양만 각 안의 CSS 에서 달라진다."""
    return """
  <section class="hero">
    <img src="%s" alt="%s" class="hero-img">
    <span class="hero-left"></span>
    <span class="hero-top"></span>
    <span class="hero-bot"></span>%s
%s
    <div class="hero-txt">
      <span class="hbadge">%s</span>
      <h1>%s<br><span class="accent">%s</span></h1>
      <p>%s</p>
      <a href="#" class="solid">%s</a>
    </div>
  </section>
""" % (IMG, ALT, extra, header(), HERO["badge"], HERO["t1"], HERO["t2"],
       HERO["desc"], HERO["cta"])


def stats_row():
    return '  <section class="stats">%s</section>\n' % "".join(
        '<div class="stat rise" style="%s"><b class="n">%s</b><span>%s</span></div>'
        % (delay(i, 3), n, l) for i, (n, l) in enumerate(STATS))


def sect_head():
    return """
  <section class="sect">
    <div class="head rise">
      <div>
        <span class="lab">다섯 가지 바다</span>
        <h2>%s</h2>
      </div>
      <p>%s</p>
    </div>
  </section>
""" % (TOUR["title"], TOUR["subtitle"])


def specs_split(t):
    """새-9. 한 판을 헤어라인으로 가른다. 칸을 나누면 곡선 언어와 어긋난다."""
    when, who, unit = spec(t)
    return '<div class="specs">%s</div>' % "".join(
        '<div class="row"><span class="lab">%s</span><b>%s</b></div>' % (k, v)
        for k, v in (("운영 시간", when), ("정원", who), ("요금 기준", unit)))


def specs_table(t):
    """새-10. 색면 없이 줄로만 나눈 표."""
    when, who, unit = spec(t)
    return '<table class="specs"><tbody>%s</tbody></table>' % "".join(
        "<tr><th>%s</th><td>%s</td></tr>" % (k, v)
        for k, v in (("운영 시간", when), ("정원", who), ("요금 기준", unit)))


def check_list(t):
    return '<ul class="check">%s</ul>' % "".join(
        "<li>%s</li>" % f for f in includes(t))


def footer():
    """운영 중인 사이트 맨 아래 그대로. 문구·주소·사업자 정보는 손대지 않는다."""
    return """
<footer class="foot">
  <div class="foot-in">
    <div class="foot-top rise">
      <div>
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
      </div>
      <div>
        <h4 class="fh">%s 하와이 주소 및 연락처</h4>
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
      </div>
    </div>
    <div class="foot-mid rise">
      <div>
        <h4 class="fname">오션스타 (Waikiki Turtle Snorkeling)</h4>
        <p class="fdesc">하와이 한인 최초 거북이 스노클링 원조<br>
          여행 플랫폼 8,000 리뷰 · 구글 5,000 리뷰</p>
      </div>
      <div class="fbiz">
        <p><span>상호명:</span> Oceanview Activity LLC</p>
        <p><span>사업장 소재지:</span> 615 PIKOI ST. STE 811</p>
        <p><span>사업자 전화번호:</span> 8083081792</p>
      </div>
    </div>
    <div class="foot-bot">© 2026 Ocean Star. All Rights Reserved.</div>
  </div>
</footer>
"""  % (icon(CLOCK, 19), icon(IG, 24), icon(YT, 24), icon(FORK, 18), icon(PIN, 19))


def rows(specs_fn, frame_fn):
    """사진↔활자 교차. 새-8 과 같은 순서, 같은 내용."""
    out = ""
    for i, t in enumerate(T):
        left = i % 2 == 0
        txt = """
<div class="col %s">
  <span class="tag">%s</span>
  <h3>%s</h3>
  <p>%s</p>
  %s
  <div class="lab lab-b">포함 사항</div>
  %s
  <div class="buy">
    <div>
      <span class="buy-sub">%s</span>
      <b class="n">%s</b>
    </div>
    <div class="buy-act">
      <a href="#" class="ghost">%s</a>
      <a href="#" class="solid">%s</a>
    </div>
  </div>
</div>""" % ("slide-r" if left else "slide-l", badge_of(t), t["name"], t["desc"],
             specs_fn(t), check_list(t), t["sub"], t["price"],
             TOUR["more"], TOUR["book"])
        a, b = (frame_fn(t, left, i), txt) if left else (txt, frame_fn(t, left, i))
        out += ('<section id="t%d" class="row%s">%s%s</section>'
                % (i + 1, "" if left else " alt", a, b))
    return out


# 색·버튼·푸터 등 두 안이 함께 쓰는 바닥. 모양(라운드·그림자)은 각 안이 덮어쓴다.
BASE_T = """/*__FONTS__*//*__FONTS_END__*/
:root{
  --navy:%s; --primary:%s; --cyan:%s; --sky:%s;
  --text:%s; --muted:%s; --border:%s; --pad:%dpx;
}
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,h4,p,ul,li,table{margin:0;padding:0}
li{list-style:none}
a{text-decoration:none;color:inherit}
img{display:block;max-width:100%%}
table{border-collapse:collapse;width:100%%}
.n{font-variant-numeric:tabular-nums}
.page{width:%dpx;color:var(--text);font-family:'Pretendard',system-ui,sans-serif;
  word-break:keep-all;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'SUIT',system-ui,sans-serif;color:var(--navy);letter-spacing:-.02em}
.lab{display:block;font-size:12px;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:var(--primary)}

/* ── 헤더. 새-8 과 같은 7항목 ─────────────────────────────────────── */
.hero header{position:absolute;left:0;right:0;top:0;z-index:4;height:88px;
  display:flex;align-items:center;justify-content:space-between;padding:0 var(--pad)}
.logo{height:54px;width:auto}
.hero nav{display:flex;gap:30px;align-items:center}
.hero nav a{font-size:16px;font-weight:500;color:var(--text);padding-bottom:4px;
  border-bottom:2px solid transparent}
.hero nav a:first-child{font-weight:700;color:var(--navy)}
.hnav{display:flex;gap:10px;align-items:center}
.chip{display:inline-flex;align-items:center;height:42px;padding:0 16px;
  color:var(--navy);font-size:14px;font-weight:700}
.chip-on{background:var(--primary);color:#fff;padding:0 22px;font-size:15px}

/* ── 히어로 스크림. 실측으로 잡은 값이라 두 안이 같이 쓴다 ──────────────── */
.hero{position:relative;height:716px;overflow:hidden}
.hero-img{position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover;
  filter:brightness(1.00) saturate(1.06) contrast(1.00)}
.hero-left{position:absolute;inset:0;background:%s}
.hero-top{position:absolute;left:0;right:0;top:0;height:220px;background:%s}
.hero-bot{position:absolute;left:0;right:0;bottom:0;height:230px;background:%s}
.hero-txt{position:absolute;left:var(--pad);top:154px;width:660px;z-index:3}
.hero-txt h1{font-size:56px;font-weight:800;line-height:1.24;margin-top:22px}
.hero-txt h1 .accent{color:#00506F}
.hero-txt p{font-size:18px;line-height:1.85;color:#2C3E50;max-width:520px;margin-top:20px}
.hero-txt .solid{margin-top:32px;height:58px;padding:0 34px;font-size:17px}

/* ── 지표 · 섹션 머리 ──────────────────────────────────────────────── */
.stats{display:flex;gap:0;padding:0 var(--pad) 8px;margin-top:-58px;
  position:relative;z-index:5}
.stat{flex:1;padding:26px 0 34px;border-top:2px solid var(--border)}
.stat b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:40px;
  font-weight:800;color:var(--navy)}
.stat span{display:block;margin-top:8px;font-size:14px;color:var(--muted)}
.sect{padding:88px var(--pad) 0}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:60px}
.head h2{font-size:52px;line-height:1.24;margin-top:16px}
.head p{font-size:16px;line-height:1.9;color:var(--muted);max-width:340px;padding-bottom:8px}

/* ── 상품 행 ──────────────────────────────────────────────────────── */
.row{display:grid;grid-template-columns:1fr 1fr;gap:76px;align-items:center;
  padding:76px var(--pad)}
.col h3{font-size:40px;line-height:1.3;margin-top:16px}
.col p{font-size:16.5px;line-height:1.95;margin-top:14px;max-width:480px}
.lab-b{margin-top:26px}
.check{margin-top:12px;display:grid;gap:11px}
.check li{position:relative;padding-left:26px;font-size:15px;line-height:1.6}
.buy{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;
  margin-top:32px;padding-top:24px;border-top:1px solid var(--border)}
.buy-sub{display:block;font-size:13px;color:var(--muted)}
.buy b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:38px;
  font-weight:800;color:var(--navy);margin-top:8px}
.buy-act{display:flex;align-items:center;gap:12px}

/* ── 푸터 ─────────────────────────────────────────────────────────── */
.foot{background:var(--navy);color:rgba(255,255,255,.82);margin-top:24px}
.foot-in{padding:76px var(--pad) 44px}
.foot-top{display:grid;grid-template-columns:1fr 1fr;gap:56px}
.fh{display:flex;align-items:center;gap:9px;font-size:19px;color:#fff;margin-bottom:16px}
.fh svg{color:var(--sky)}
.fcard{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);
  padding:20px 22px;display:flex;flex-direction:column;gap:16px;max-width:460px}
.frow{display:flex;align-items:flex-start;gap:12px}
.fchip{flex:none;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);
  padding:5px 9px;font-size:12px;font-weight:700;color:#fff}
.frow b{display:block;font-size:14.5px;font-weight:600;color:#fff;line-height:1.6}
.flinks{display:flex;align-items:center;gap:14px;padding-top:14px;
  border-top:1px solid rgba(255,255,255,.14)}
.fic{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;
  background:rgba(255,255,255,.1);color:#fff}
.fbtn{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;
  background:var(--cyan);color:#fff;font-size:14px;font-weight:700}
.fmap{display:inline-block;margin-top:8px;font-size:12.5px;color:var(--sky);
  text-decoration:underline;text-underline-offset:3px}
.foot-mid{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;
  margin-top:56px;padding-top:32px;border-top:1px solid rgba(255,255,255,.16)}
.fname{font-size:18px;color:#fff}
.fdesc{margin-top:10px;font-size:14px;line-height:1.75}
.fbiz{text-align:right;font-size:13.5px;line-height:2}
.fbiz span{color:rgba(255,255,255,.55);font-weight:700}
.foot-bot{margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.16);
  text-align:center;font-size:12.5px;color:rgba(255,255,255,.55)}
"""

BASE = BASE_T % (NAVY, PRIMARY, CYAN, SKY, TEXT, MUTED, BORDER, PAD, W,
                 left_scrim(), top_scrim(), soft_fade(180, full_at=.78))

# 스크롤 연출. 쉬는 상태가 기본값이고 키프레임은 '숨김 → 보임' 방향으로만 간다.
MOTION = """
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    .rise,.slide-l,.slide-r,.frame,.col,.stat{
      animation-timeline:view();animation-fill-mode:both;
      animation-timing-function:cubic-bezier(.22,.61,.36,1);
      animation-range:entry 6% cover 30%}
    .rise,.stat{animation-name:rise}
    .slide-l{animation-name:slide-l}
    .slide-r{animation-name:slide-r}
    .frame{animation-name:frame-in;animation-range:entry 0% cover 34%}
    @keyframes rise{from{opacity:0;transform:translateY(42px)}to{opacity:1;transform:none}}
    @keyframes slide-l{from{opacity:0;transform:translateX(-54px)}
                       to{opacity:1;transform:none}}
    @keyframes slide-r{from{opacity:0;transform:translateX(54px)}
                       to{opacity:1;transform:none}}
    @keyframes frame-in{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
    .shot img{animation:pan linear both;animation-timeline:view();
      animation-range:cover 0% cover 100%}
    @keyframes pan{from{transform:scale(1.14) translateY(2.2%)}
                   to{transform:scale(1) translateY(-2.2%)}}
  }
}
"""

DOC = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>%s</title>
  <style>%s</style>
</helmet>
<div class="page">
%s</div>
</x-dc>
</body>
</html>
"""


# ------------------------------------------------------------------ 새-9 아치
def arch_frame(t, left, i):
    return """
<div class="frame">
  <span class="shot"><img src="%s" alt="%s"></span>
</div>""" % (t["img"], t["name"])


def arch():
    body = (hero() + stats_row() + sect_head()
            + rows(specs_split, arch_frame) + footer())
    css = BASE + """
/* ── 아치. 곡선 하나로 끌고 간다. 사진 위쪽을 크게 따고, 판과 버튼도 같은
   반지름 계열로 맞춘다. 모서리가 서로 다르면 곡선 언어가 흐트러진다. ──────── */
.page{background:#F6FBFD}
.hero{background:#F6FBFD}
.hbadge{display:inline-flex;align-items:center;border-radius:999px;background:#fff;
  color:#00618A;font-size:13px;font-weight:700;letter-spacing:.14em;padding:10px 20px;
  box-shadow:0 6px 18px rgba(0,119,168,.12)}
.chip{border:1.5px solid rgba(10,63,102,.2);border-radius:999px;
  background:rgba(255,255,255,.6);-webkit-backdrop-filter:blur(6px);
  backdrop-filter:blur(6px)}
.chip-on{border-radius:999px;border-color:var(--primary);
  box-shadow:0 10px 24px rgba(0,119,168,.3)}
.solid{display:inline-flex;align-items:center;justify-content:center;height:54px;
  padding:0 32px;border-radius:999px;background:var(--primary);color:#fff;
  font-size:15px;font-weight:700;white-space:nowrap;
  box-shadow:0 12px 26px rgba(0,119,168,.3), inset 0 1px 0 rgba(255,255,255,.28)}
.ghost{display:inline-flex;align-items:center;justify-content:center;height:54px;
  padding:0 26px;border-radius:999px;border:1.5px solid var(--primary);
  color:var(--primary);font-size:15px;font-weight:700;background:transparent}
.stat{border-top:none;position:relative}
.stat::before{content:"";position:absolute;left:0;top:0;width:44px;height:4px;
  border-radius:999px;background:var(--cyan)}
.stats{background:#fff;border-radius:34px;margin:-58px var(--pad) 0;padding:14px 44px 8px;
  box-shadow:0 20px 50px rgba(0,119,168,.10)}
.stat{padding:30px 0 34px}

/* 사진은 위가 둥근 아치. 아래는 카드 반지름에 맞춰 살짝만 굴린다. */
.frame{position:relative}
.shot{display:block;overflow:hidden;border-radius:260px 260px 32px 32px;
  box-shadow:0 26px 60px rgba(0,119,168,.18)}
.shot img{width:100%;height:500px;object-fit:cover}
.tag{display:inline-flex;align-items:center;height:34px;padding:0 17px;border-radius:999px;
  background:#fff;color:var(--primary);font-size:13px;font-weight:700;
  box-shadow:0 6px 16px rgba(0,119,168,.12)}
/* 스펙은 칸을 나누지 않고 한 판을 줄로 가른다. */
.specs{margin-top:24px;background:#fff;border-radius:26px;padding:6px 26px;
  box-shadow:0 10px 30px rgba(0,119,168,.09)}
.specs .row{display:flex;align-items:baseline;justify-content:space-between;gap:20px;
  padding:16px 0;border-bottom:1px solid #EDF5F9}
.specs .row:last-child{border-bottom:none}
.specs .lab{font-size:11.5px;letter-spacing:.12em;color:var(--muted)}
.specs b{font-size:15px;font-weight:600;color:var(--navy);text-align:right}
.check li::before{content:"";position:absolute;left:2px;top:6px;width:10px;height:10px;
  border-radius:999px;background:var(--sky);box-shadow:inset 0 0 0 2.5px #fff}
.buy{border-top:1px solid #DCEBF2}
.foot{border-radius:44px 44px 0 0;overflow:hidden}
.fcard{border-radius:24px}
.fchip{border-radius:999px}
.fic,.fbtn{border-radius:999px}
""" + MOTION
    return DOC % ("새-9 · 아치", css, body)


# ------------------------------------------------------------------ 새-10 블록
def block_frame(t, left, i):
    return """
<div class="frame">
  <span class="plate"></span>
  <span class="shot"><img src="%s" alt="%s"></span>
  <span class="no n">%02d</span>
</div>""" % (t["img"], t["name"], i + 1)


def block():
    body = (hero() + stats_row() + sect_head()
            + rows(specs_table, block_frame) + footer())
    css = BASE + """
/* ── 블록. 라운드 0, 그림자 대신 색면. 깊이는 그림자가 아니라 어긋난 면으로
   만든다. 아웃도어 카탈로그처럼 정보가 각지고 단단하게 앉는다. ──────────── */
.page{background:#fff}
.hero{background:#fff}
.hbadge{display:inline-flex;align-items:center;background:var(--navy);color:#fff;
  font-size:12.5px;font-weight:700;letter-spacing:.18em;padding:10px 18px}
.chip{border:1.5px solid var(--navy);background:#fff}
.chip-on{background:var(--navy);border-color:var(--navy)}
.solid{display:inline-flex;align-items:center;justify-content:center;height:54px;
  padding:0 32px;background:var(--primary);color:#fff;font-size:15px;font-weight:700;
  white-space:nowrap}
.ghost{display:inline-flex;align-items:center;justify-content:center;height:54px;
  padding:0 26px;border:2px solid var(--navy);color:var(--navy);font-size:15px;
  font-weight:700;background:#fff}
.hero-txt h1{letter-spacing:-.03em}
.stats{margin-top:-58px;padding:0 var(--pad) 8px}
.stat{border-top:4px solid var(--navy);margin-right:1px;background:#fff;
  padding:26px 22px 34px}
.stat:nth-child(even){background:#F1F7FA}

/* 사진 뒤에 네이비 블록을 어긋나게 깐다. 번호는 그 위에 크게 얹는다. */
.frame{position:relative}
.plate{position:absolute;left:-22px;top:-22px;right:40px;bottom:40px;
  background:var(--navy)}
.alt .plate{left:40px;right:-22px}
.shot{position:relative;display:block;overflow:hidden}
.shot img{width:100%;height:480px;object-fit:cover}
.no{position:absolute;left:-22px;top:-22px;width:88px;height:88px;z-index:2;
  background:var(--cyan);color:#fff;font-family:'SUIT',system-ui,sans-serif;
  font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center}
.alt .no{left:auto;right:-22px}
.tag{display:inline-flex;align-items:center;height:32px;padding:0 14px;
  background:#EAF4F9;color:var(--navy);font-size:12.5px;font-weight:700;
  letter-spacing:.06em}
/* 스펙은 색면 없이 줄로만 나눈 표. */
.specs{margin-top:24px;border-top:2px solid var(--navy)}
.specs th{text-align:left;font-size:11.5px;font-weight:700;letter-spacing:.12em;
  text-transform:uppercase;color:var(--muted);padding:14px 20px 14px 0;
  border-bottom:1px solid var(--border);white-space:nowrap;vertical-align:top;width:130px}
.specs td{font-size:15px;font-weight:600;color:var(--navy);padding:14px 0;
  border-bottom:1px solid var(--border);line-height:1.45}
.check li::before{content:"";position:absolute;left:0;top:7px;width:12px;height:2px;
  background:var(--primary)}
.buy{border-top:2px solid var(--navy)}
""" + MOTION
    return DOC % ("새-10 · 블록", css, body)


def demo():
    """배치가 새-8 과 같은 순서인지, 데이터·규칙이 같은지, 모션이 안전한지."""
    order = ['class="hero"', 'class="stats"', 'class="sect"', 'id="t1"', 'id="t5"',
             'class="foot"']
    for name, html in (("새-9", arch()), ("새-10", block())):
        at = -1
        for marker in order:
            i = html.find(marker)
            assert i > at, "%s: %s 순서가 새-8 과 다르다" % (name, marker)
            at = i
        for t in T:
            assert t["name"] in html and t["price"] in html, (name, t["name"])
        for item in NAV + ["EN", "내 예약 관리", "투어 예약하기"]:
            assert item in html, (name, item)
        assert "8083081792" in html, name
        assert "[운영 시간 확정 필요]" in html, name
        base = html.split("@media (prefers-reduced-motion")[0]
        assert "opacity:0" not in base.replace(" ", ""), "%s: 기본 스타일에 숨김" % name
    print("demo ok")


if __name__ == "__main__":
    demo()
    for fname, fn in (("New9.dc.html", arch), ("New10.dc.html", block)):
        io.open(fname, "w", encoding="utf-8").write(fn())
        print(fname, "ok")
