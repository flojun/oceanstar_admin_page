# -*- coding: utf-8 -*-
"""새-8 · 스크롤 투어. 새-6 의 배치를 뼈대로 쓰되 조판이 아니라 투어 UI 로 다시 짰다.

배치는 새-6 그대로다
히어로 영상 → 소개 띠 → 지표 → 투어 고르기 → 상품 상세(사진↔활자 교차) → 예약 유도 띠

에디토리얼에서 투어로 바꾼 것
· 헤어라인 표를 썸네일·요금·화살표가 있는 '고르는 줄'로 바꿨다. 표는 읽는 물건이고
  이건 누르는 물건이다.
· 사진을 둥근 액자에 넣고 뒤로 하늘색 판을 어긋나게 깔아 깊이를 만들었다.
· 스펙을 옅은 판 세 칸으로, 포함 사항을 체크 목록으로. 값 옆엔 꽉 찬 예약 버튼.
· 색이 잉크 흑백에서 브랜드 파랑으로 돌아왔다. 액티비티 투어의 온도에 맞춘다.

스크롤 연출을 전제로 한 설계
나중에 붙일 게 아니라 지금 CSS 로 들어가 있다. animation-timeline: view() 를 써서
스크립트 없이 뷰포트 진입에 맞춰 움직인다. 설계상 지켜야 할 것은 두 가지다.

1. 쉬는 상태가 기본값이다. 키프레임은 '숨김 → 보임' 방향으로만 쓴다. 그래서
   모션을 못 쓰는 환경(캔버스 뷰어, PDF 렌더, prefers-reduced-motion)에서는
   그냥 다 보이는 화면이 된다. 반대로 짜면 인쇄물이 백지가 된다.
2. 한 덩어리가 한 번에 들어오게 블록을 나눴다. 줄 단위로 쪼개면 산만해진다.
   순서 차이는 animation-range 를 조금씩 밀어 만든다. JS 스태거가 필요 없다.

히어로에서 제목이 배를 가리지 않게 하는 계산은 새-6 과 같다.
영상이 2.076:1 이라 높이를 1440/2.076 = 694px 아래로 잡으면 가로가 잘리지 않고,
배는 위쪽 3분의 2 에 온전히 들어온다. 활자는 그 아래 띠에만 놓는다.
"""
import io
import re
from build_v2 import HERO, NAV, STATS, TOUR, TOURS
from build_v2_boards import soft_fade, top_scrim

T = TOURS
W, PAD = 1440, 120
IMG, ALT = "hero_boat.webp", "와이키키 앞바다의 오션스타 51인승 루프탑 보트"

NAVY, PRIMARY, CYAN, SKY = "#0A3F66", "#0077A8", "#00A0D0", "#6FD0EE"
TEXT, MUTED, BORDER, PAPER = "#44586A", "#7B8FA0", "#E3EDF4", "#F4FAFD"

TIME = re.compile(r"\d{2}:\d{2}|시간")
# '인' 앞에 숫자가 있어야 인원이다. 그냥 '인'만 보면 '와인 제공'이 정원으로 잡힌다.
PARTY = re.compile(r"\d+\s*인")


# 캔버스에서 직접 고치신 배지 문구. 확정안(Main)은 그대로 두고 새-8 에만 적용한다.
BADGE = {"거북이 스노클링 + 패러세일링 / 제트스키": "인기있는 콤보상품",
         "거북이 스노클링 + 서핑": "신규 콤보 상품"}


def badge_of(t):
    return BADGE.get(t["name"], plain(t["badge"]))


def plain(badge):
    out = "".join(c for c in badge if ord(c) < 0x2000 or 0xAC00 <= ord(c) <= 0xD7A3)
    return out.replace("!", "").strip()


def spec(t):
    """운영 시간 / 정원 / 요금 기준. 전부 기존 feats·sub 에서 읽어온다."""
    times = [f for f in t["feats"] if TIME.search(f)]
    party = [f for f in t["feats"] if PARTY.search(f)]
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
    return [f for f in t["feats"] if not TIME.search(f) and not PARTY.search(f)]


def delay(i, step=4):
    """스태거. 진입 구간을 조금씩 뒤로 밀면 순서대로 들어온다."""
    a = 6 + i * step
    return "animation-range:entry %d%% cover %d%%" % (a, a + 24)


def left_scrim(hold=.18, gone=.58, amax=.78):
    """왼쪽을 흰색으로 덮어 네이비 활자를 앉히는 그라데이션.

    홈의 soft_fade 를 그대로 쓰면 활자가 끝나는 x 640 근처에서 흰색이 이미 44%%까지
    빠져 있다. 그 자리엔 배 뱃머리와 도시 실루엣의 어두운 픽셀이 있어서 파란 강조줄이
    2.55:1 까지 떨어졌다. 그래서 활자 폭까지는 흰색을 유지하고 그 뒤로 푼다.

    hold 까지 amax 를 유지하고 gone 에서 0 이 된다. 사이는 smoothstep 이라
    기울기가 양 끝에서 0 이다. 직선으로 꺾으면 그 자리가 세로선으로 보인다.
    """
    pts = []
    for i in range(21):
        t = i / 20
        if t <= hold:
            a = amax
        elif t >= gone:
            a = 0.0
        else:
            u = (t - hold) / (gone - hold)
            a = amax * (1 - u * u * (3 - 2 * u))
        pts.append("rgba(255,255,255,%.3f) %d%%" % (a, round(t * 100)))
    return "linear-gradient(96deg,%s)" % ",".join(pts)


def icon(path, size=22):
    """푸터 아이콘. 이모지 대신 선으로 그려야 크기·색을 따라온다."""
    return ('<svg width="%d" height="%d" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            'stroke-linejoin="round">%s</svg>') % (size, size, path)


IG = ('<rect x="3" y="3" width="18" height="18" rx="5"></rect>'
      '<circle cx="12" cy="12" r="4"></circle><circle cx="17.3" cy="6.7" r="1"></circle>')
YT = ('<rect x="2.5" y="5.5" width="19" height="13" rx="4"></rect>'
      '<path d="M10.2 9.6l5 2.4-5 2.4z"></path>')
FORK = ('<path d="M6 3v7a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3"></path><path d="M8 12v9"></path>'
        '<path d="M17 3c-1.4 1.6-2 3.4-2 5.5 0 1.6.7 2.5 2 2.5v10"></path>')
PIN = ('<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"></path>'
       '<circle cx="12" cy="10" r="2.6"></circle>')
CLOCK = '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5.2l3.3 2"></path>'


def footer():
    """운영 중인 사이트 맨 아래 그대로. 문구·주소·사업자 정보는 손대지 않는다."""
    return """
<footer class="foot">
  <div class="foot-in">
    <div class="foot-top">
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
    <div class="foot-mid">
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
</footer>""" % (icon(CLOCK, 19), icon(IG, 24), icon(YT, 24), icon(FORK, 18),
                icon(PIN, 19))


def rows():
    out = ""
    for i, t in enumerate(T):
        left = i % 2 == 0          # 사진이 왼쪽인 행
        when, who, unit = spec(t)
        frame = """
<div class="frame %s">
  <span class="plate"></span>
  <span class="shot"><img src="%s" alt="%s"></span>
</div>""" % ("f-l" if left else "f-r", t["img"], t["name"])
        cells = "".join(
            '<div class="cell"><span class="lab">%s</span><b>%s</b></div>' % (k, v)
            for k, v in (("운영 시간", when), ("정원", who), ("요금 기준", unit)))
        feats = "".join('<li>%s</li>' % f for f in includes(t))
        txt = """
<div class="col %s" style="%s">
  <span class="badge">%s</span>
  <h3>%s</h3>
  <p>%s</p>
  <div class="specs">%s</div>
  <div class="lab lab-b">포함 사항</div>
  <ul class="check">%s</ul>
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
</div>""" % ("slide-r" if left else "slide-l", delay(0), badge_of(t), t["name"],
             t["desc"], cells, feats, t["sub"], t["price"], TOUR["more"], TOUR["book"])
        a, b = (frame, txt) if left else (txt, frame)
        out += ('<section id="t%d" class="row%s">%s%s</section>'
                % (i + 1, "" if left else " alt", a, b))
    return out


def scroll_tour():
    stats = "".join(
        '<div class="stat rise" style="%s"><b class="n">%s</b><span>%s</span></div>'
        % (delay(i, 3), n, l) for i, (n, l) in enumerate(STATS))
    body = """
<div class="page">
  <section class="hero">
    <img src="%s" alt="%s" class="hero-img">
    <span class="hero-left"></span>
    <span class="hero-top"></span>
    <span class="hero-bot"></span>
    <header>
      <img src="logo_full.png" alt="오션스타" class="logo">
      <nav>%s</nav>
      <div class="hnav">
        <a href="#" class="chip">EN</a>
        <a href="#" class="chip">내 예약 관리</a>
        <a href="#" class="chip chip-on">투어 예약하기</a>
      </div>
    </header>
    <div class="hero-txt">
      <span class="hbadge">%s</span>
      <h1>%s<br><span class="accent">%s</span></h1>
      <p>%s</p>
      <a href="#" class="solid">%s</a>
    </div>
  </section>

  <section class="stats">%s</section>

  <section class="sect sect-b">
    <div class="head rise">
      <div>
        <span class="lab">다섯 가지 바다</span>
        <h2>%s</h2>
      </div>
      <p>%s</p>
    </div>
  </section>
  %s
  %s
</div>""" % (IMG, ALT,
             "".join('<a href="#">%s</a>' % n for n in NAV),
             HERO["badge"], HERO["t1"], HERO["t2"],
             HERO["desc"], HERO["cta"], stats,
             TOUR["title"], TOUR["subtitle"], rows(), footer())
    return DOC % (CSS, body)


CSS = """/*__FONTS__*//*__FONTS_END__*/
:root{
  --navy:%s; --primary:%s; --cyan:%s; --sky:%s;
  --text:%s; --muted:%s; --border:%s; --paper:%s;
  --pad:%dpx;
  --e1:0 1px 2px rgba(0,119,168,.06), 0 4px 12px rgba(0,119,168,.07);
  --e2:0 2px 6px rgba(0,119,168,.09), 0 18px 38px rgba(0,119,168,.14);
  --e3:0 4px 10px rgba(10,63,102,.12), 0 30px 60px rgba(10,63,102,.20);
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
.lab{display:block;font-size:12px;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:var(--primary)}

/* ── 버튼. 라운드를 크게 가져가 액티비티의 가벼운 온도를 만든다 ────────── */
.solid{display:inline-flex;align-items:center;justify-content:center;height:54px;
  padding:0 32px;border-radius:999px;background:var(--primary);color:#fff;
  font-size:15px;font-weight:700;white-space:nowrap;
  box-shadow:0 2px 4px rgba(0,119,168,.24), 0 12px 26px rgba(0,119,168,.30),
             inset 0 1px 0 rgba(255,255,255,.28)}
.solid-w{background:#fff;color:var(--primary);box-shadow:var(--e3)}
.ghost{display:inline-flex;align-items:center;justify-content:center;height:54px;
  padding:0 26px;border-radius:999px;border:1.5px solid var(--primary);
  color:var(--primary);font-size:15px;font-weight:700;white-space:nowrap;background:#fff}

/* ── 헤더. 홈과 같이 흰 스크림 위 네이비 활자다. 흰 띠를 깔면 헤더가 영상에서
   분리돼 보이고, 완전 투명이면 그날 하늘 밝기에 글자가 좌우된다. 그래서 헤더
   높이까지만 흰색 60%%를 유지하고 그 아래로 기울기 0 으로 푼다. ────────────── */
.hero header{position:absolute;left:0;right:0;top:0;z-index:4;height:88px;
  display:flex;align-items:center;justify-content:space-between;padding:0 var(--pad)}
.logo{height:54px;width:auto}
.hero nav{display:flex;gap:30px;align-items:center}
.hero nav a{font-size:16px;font-weight:500;color:var(--text);padding-bottom:4px;
  border-bottom:2px solid transparent}
.hero nav a:first-child{font-weight:700;color:var(--navy);border-bottom-color:var(--cyan)}
.hnav{display:flex;gap:10px;align-items:center}
.chip{display:inline-flex;align-items:center;height:42px;padding:0 16px;border-radius:10px;
  border:1.5px solid rgba(10,63,102,.22);background:rgba(255,255,255,.55);
  color:var(--navy);font-size:14px;font-weight:700;
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.chip-on{background:var(--primary);color:#fff;border-color:var(--primary);padding:0 22px;
  font-size:15px;box-shadow:0 2px 4px rgba(0,119,168,.24), 0 10px 22px rgba(0,119,168,.30),
  inset 0 1px 0 rgba(255,255,255,.26)}

/* ── 히어로. 홈과 같은 방식이다. 왼쪽을 흰색으로 덮어 네이비 활자를 앉히고,
   아래는 흰색으로 풀어 다음 섹션과 이어붙인다. 배는 오른쪽에 그대로 남는다.
   영상이 2.076:1 이라 716px 이면 가로가 좌우 23px 씩만 잘린다. ──────────────── */
.hero{position:relative;height:716px;overflow:hidden;background:#fff}
.hero-img{position:absolute;inset:0;width:100%%;height:100%%;object-fit:cover;
  filter:brightness(1.00) saturate(1.06) contrast(1.00)}
.hero-left{position:absolute;inset:0;background:%s}
.hero-top{position:absolute;left:0;right:0;top:0;height:220px;background:%s}
.hero-bot{position:absolute;left:0;right:0;bottom:0;height:230px;background:%s}
.hero-txt{position:absolute;left:var(--pad);top:154px;width:660px;z-index:3}
.hbadge{display:inline-flex;align-items:center;border-radius:999px;background:#E4F3FA;
  color:#00618A;font-size:13px;font-weight:700;letter-spacing:.14em;padding:9px 18px}
.hero-txt h1{font-size:56px;font-weight:800;line-height:1.24;margin-top:22px;
  color:var(--navy)}
/* 사진 위 강조줄은 --primary(#0077A8) 로는 흰색을 많이 깔아야 3:1 이 나온다.
   한 단계 깊은 파랑으로 내리면 그만큼 스크림을 걷어낼 수 있다. */
.hero-txt h1 .accent{color:#00506F}
.hero-txt p{font-size:18px;line-height:1.85;color:#2C3E50;max-width:520px;margin-top:20px}
.hero-txt .solid{margin-top:32px;height:58px;padding:0 34px;font-size:17px}

/* ── 소개 띠 · 지표 ────────────────────────────────────────────────── */
.stats{display:flex;gap:0;padding:0 var(--pad) 8px;margin-top:-58px;
  position:relative;z-index:5}
.stat{flex:1;padding:26px 0 34px;border-top:2px solid var(--border)}
.stat b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:40px;
  font-weight:800;color:var(--navy)}
.stat span{display:block;margin-top:8px;font-size:14px;color:var(--muted)}

/* ── 섹션 머리 ────────────────────────────────────────────────────── */
.sect{padding:92px var(--pad) 0}
.sect-b{padding-bottom:8px}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:60px}
.head h2{font-size:52px;line-height:1.24;margin-top:16px}
.head p{font-size:16px;line-height:1.9;color:var(--muted);max-width:340px;padding-bottom:8px}

/* ── 상품 상세. 사진은 둥근 액자, 뒤로 하늘색 판을 어긋나게 깐다 ──────── */
.row{display:grid;grid-template-columns:1fr 1fr;gap:76px;align-items:center;
  padding:76px var(--pad)}
.frame{position:relative}
.plate{position:absolute;width:56%%;height:62%%;border-radius:26px;
  background:linear-gradient(135deg,var(--sky),var(--cyan));opacity:.34}
.f-l .plate{right:-22px;bottom:-22px}
.f-r .plate{left:-22px;bottom:-22px}
.shot{position:relative;display:block;border-radius:24px;overflow:hidden;
  box-shadow:var(--e2)}
.shot img{width:100%%;height:480px;object-fit:cover}
.badge{display:inline-flex;align-items:center;height:32px;padding:0 15px;
  border-radius:999px;background:var(--paper);color:var(--primary);
  font-size:13px;font-weight:700;border:1px solid var(--border)}
.col h3{font-size:40px;line-height:1.3;margin-top:16px}
.col p{font-size:16.5px;line-height:1.95;color:var(--text);margin-top:14px;max-width:480px}
.specs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:26px}
.cell{background:var(--paper);border-radius:14px;padding:15px 16px}
.cell .lab{font-size:11px;letter-spacing:.12em;color:var(--muted)}
.cell b{display:block;margin-top:7px;font-size:14.5px;font-weight:600;color:var(--navy);
  line-height:1.45}
.lab-b{margin-top:26px}
.check{margin-top:12px;display:grid;gap:11px}
.check li{position:relative;padding-left:26px;font-size:15px;line-height:1.6;
  color:var(--text)}
/* 체크는 글립이 아니라 테두리를 돌려 그린다. 폰트에 없는 글자를 안 쓴다. */
.check li::before{content:"";position:absolute;left:4px;top:5px;width:6px;height:11px;
  border:solid var(--primary);border-width:0 2px 2px 0;transform:rotate(45deg)}
.buy{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;
  margin-top:32px;padding-top:24px;border-top:1px solid var(--border)}
.buy-sub{display:block;font-size:13px;color:var(--muted)}
.buy b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:38px;
  font-weight:800;color:var(--navy);margin-top:8px}
.buy-act{display:flex;align-items:center;gap:12px}

/* ── 푸터. 운영 중인 사이트 맨 아래 내용을 이 안의 언어로 옮겼다 ────────
   본문이 흰 바탕으로 끝나므로 네이비로 받아 페이지를 닫는다. */
.foot{background:var(--navy);color:rgba(255,255,255,.82);margin-top:24px}
.foot-in{padding:76px var(--pad) 44px}
.foot-top{display:grid;grid-template-columns:1fr 1fr;gap:56px}
.fh{display:flex;align-items:center;gap:9px;font-size:19px;color:#fff;margin-bottom:16px}
.fh svg{color:var(--sky)}
.fcard{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);
  border-radius:18px;padding:20px 22px;display:flex;flex-direction:column;gap:16px;
  max-width:460px}
.frow{display:flex;align-items:flex-start;gap:12px}
.fchip{flex:none;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);
  border-radius:7px;padding:5px 9px;font-size:12px;font-weight:700;color:#fff}
.frow b{display:block;font-size:14.5px;font-weight:600;color:#fff;line-height:1.6}
.flinks{display:flex;align-items:center;gap:14px;padding-top:14px;
  border-top:1px solid rgba(255,255,255,.14)}
.fic{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;
  border-radius:12px;background:rgba(255,255,255,.1);color:#fff}
.fbtn{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;
  border-radius:12px;background:var(--cyan);color:#fff;font-size:14px;font-weight:700}
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

/* ── 스크롤 연출 ──────────────────────────────────────────────────────
   기본값이 '쉬는 상태'다. 키프레임은 숨김 → 보임 방향으로만 간다.
   그래서 모션을 못 쓰는 환경에서는 그냥 다 보이는 화면이 된다. */
@media (prefers-reduced-motion: no-preference){
  @supports (animation-timeline: view()){
    .rise,.slide-l,.slide-r,.frame,.col,.stat,.foot-top,.foot-mid{
      animation-timeline:view();animation-fill-mode:both;
      animation-timing-function:cubic-bezier(.22,.61,.36,1);
      animation-range:entry 6%% cover 30%%}
    .rise,.stat,.foot-top,.foot-mid{animation-name:rise}
    .slide-l{animation-name:slide-l}
    .slide-r{animation-name:slide-r}
    .frame{animation-name:frame-in;animation-range:entry 0%% cover 34%%}
    @keyframes rise{from{opacity:0;transform:translateY(42px)}to{opacity:1;transform:none}}
    @keyframes slide-l{from{opacity:0;transform:translateX(-54px)}
                       to{opacity:1;transform:none}}
    @keyframes slide-r{from{opacity:0;transform:translateX(54px)}
                       to{opacity:1;transform:none}}
    @keyframes frame-in{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
    /* 사진은 액자 안에서 천천히 물러난다. 통과하는 내내 이어져야 시차가 생긴다. */
    .shot img{animation:pan linear both;animation-timeline:view();
      animation-range:cover 0%% cover 100%%}
    @keyframes pan{from{transform:scale(1.14) translateY(2.2%%)}
                   to{transform:scale(1) translateY(-2.2%%)}}
    /* 히어로 활자에는 스크롤 연출을 걸지 않는다.
       view() 의 cover 구간은 '요소가 아래에서 들어오는' 것을 기준으로 잡히는데,
       히어로는 페이지 맨 위라 그 구간이 이미 지나간 상태로 로드된다. 그래서
       페이드를 걸면 문서를 열자마자 문구가 opacity .69 로 흐리게 떠 있었다.
       맨 위 요소에는 진입 기반 타임라인을 쓰면 안 된다. */
  }
}
""" % (NAVY, PRIMARY, CYAN, SKY, TEXT, MUTED, BORDER, PAPER, PAD, W,
       left_scrim(),
       top_scrim(), soft_fade(180, full_at=.78))

DOC = """<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>새-8 · 스크롤 투어</title>
  <style>%s</style>
</helmet>
%s
</x-dc>
</body>
</html>
"""


def demo():
    """스펙 추출과 모션의 안전 규칙. 둘 다 틀리면 조용히 망가지는 자리다."""
    when, who, unit = spec(T[0])
    assert when == "1부 08:00–11:00 · 2부 11:00–14:00", when
    assert who == "51인승 루프탑 보트", who
    assert unit == "성인 1인 기준", unit
    assert spec(T[1])[1] == "51인승 루프탑 보트", spec(T[1])[1]   # '와인 제공' 오검출
    assert "치즈보드와 와인 제공" in includes(T[1])
    assert spec(T[3])[2] == "팀 단위 대관", spec(T[3])
    # 모션이 죽은 환경에서 백지가 되지 않으려면 opacity:0 이 기본값에 있으면 안 된다.
    base = CSS.split("@media (prefers-reduced-motion")[0]
    assert "opacity:0" not in base.replace(" ", ""), "기본 스타일에 숨김이 있다"
    print("demo ok")


if __name__ == "__main__":
    demo()
    io.open("New8.dc.html", "w", encoding="utf-8").write(scroll_tour())
    print("New8.dc.html ok")
