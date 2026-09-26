# -*- coding: utf-8 -*-
"""시안 1 리뉴얼 - 한 장에 다 보기. 상태 세 가지를 보드 세 장으로 나눠 그린다.

  A 투어 미선택  상단 예약 버튼으로 바로 들어온 경우. 상품 다섯 개를 편다.
  B 단품 선택됨  랜딩 카드에서 들어왔거나 A 에서 하나 고른 뒤. 목록이 칩
                한 줄로 접히고 그만큼 칸이 줄어든다.
  C 콤보 선택됨  패러세일링/제트스키 처럼 두 활동이 다른 날 열리는 상품.

콤보 규칙은 지어낸 것이 아니라 ReservationClientPage.tsx 의 combo_marine
분기 그대로다.
  - 콤보 세부 옵션 3가지 ($210 / $210 / $310)
  - 거북이 스노클링 시간 1부(07:30) / 2부(10:30)
  - secondaryDate: 주말·공휴일 불가, 1차 투어 날짜와 같은 날 불가
  - secondaryPickupLocationName + 픽업 장소를 한 번 더 받는다

그래서 콤보는 '날짜 -> 숙소' 묶음이 두 벌이다. 두 벌을 순서대로 늘어놓으면
어느 날짜가 어느 활동인지 흐려지므로, 활동별로 묶어 제목을 붙였다.
"""
import io, sys
sys.path.insert(0, ".")
from _sian1_base import (T, TOURS, TOTALS, PICK_CSS, pick_row, page, icon,
                         I_X, I_ARROW, I_MINUS, I_PLUS, I_LOCK, I_CHECK,
                         I_LEFT, I_RIGHT, I_DOWN)

# 1차 투어와 같은 날임을 알리는 x. 칸 전체를 가로지른다. 크기는 CSS 가
# 칸에 맞춰 늘리므로 여기 숫자는 자리표시일 뿐이다.
I_CLASH = icon('<path d="M4 4l16 16M20 4L4 20"></path>', 24, 1.8)

# ────────────────────────────── 공통 조각 ──────────────────────────────

# 2026년 10월: 1일이 목요일이다. 일월화수목 순이므로 앞을 네 칸 비운다.
# (예전 보드는 두 칸만 비워 17일이 목요일에 찍혔다. 요약의 '(토)' 와 어긋났다.)
LEAD = 4
PAST = set(range(1, 12))          # 12일 이후만 예약 가능한 시점으로 가정
FULL = {18, 23, 30}               # 남은 자리가 선택 인원보다 적은 날
WEEKEND = {3, 4, 10, 11, 17, 18, 24, 25, 31}   # 토·일


def month_grid(sel=None, blocked=(), note=None, cell=34, year=2026, month=10,
               clash=None):
    """블록 처리한 날은 취소선으로 남긴다. 흐리게만 두면 며칠이 막혔는지
    읽히지 않아 '인원에 맞는 날짜만' 이라는 규칙 자체가 전달되지 않는다.

    clash 는 1차 투어와 같은 날이라 막힌 날이다. 마감된 날과 막힌 이유가
    다르므로 표시도 달라야 한다. 취소선 대신 x 를 올린다."""
    dows = "".join(f'<span class="dow">{d}</span>' for d in "일월화수목금토")
    cells = ['<span class="d"></span>'] * LEAD
    for d in range(1, 32):
        cls, mark = "d", ""
        num = str(d)
        if d == clash:
            cls += " clash"
            mark = f"<i>{I_CLASH}</i>"
            num = f"<em>{d}</em>"
        elif d in blocked:
            cls += " no"
        if d == sel:
            cls += " on"
        cells.append(f'<span class="{cls}">{num}{mark}</span>')
    return (f'<div class="cal" style="--cell:{cell}px">'
            + cal_head(year, month) +
            f'<div class="cgrid">{dows}{"".join(cells)}</div>'
            + (f'<p class="chelp">{note}</p>' if note else "") + '</div>')


def cal_head(year=2026, month=10):
    """년·월을 직접 고른다. 화살표만 두면 내년 일정을 잡는 사람이 열두 번을
    눌러야 한다. 화살표는 옆 달로 한 칸씩 갈 때만 쓰도록 남긴다."""
    return (f'<div class="cmon">'
            f'<span class="sels">'
            f'<span class="sel"><b>{year}년</b>{I_DOWN}</span>'
            f'<span class="sel"><b>{month}월</b>{I_DOWN}</span></span>'
            f'<span class="mnav"><span class="marr">{I_LEFT}</span>'
            f'<span class="marr">{I_RIGHT}</span></span></div>')


def field(label, value, ph=False, help=None):
    return (f'<div class="f"><label>{label}</label>'
            f'<div class="{"in" if ph else "in filled"}">{value}</div>'
            + (f'<p class="help">{help}</p>' if help else "") + "</div>")


def pax_row(label, sub, count, minus_off=False):
    off = " off" if minus_off else ""
    return (f'<div class="prow"><span class="plab"><b>{label}</b>'
            + (f'<i>{sub}</i>' if sub else "") + "</span>"
            f'<span class="stepper"><span class="stp{off}">{I_MINUS}</span>'
            f'<b class="n">{count}</b><span class="stp">{I_PLUS}</span></span></div>')


def pax_block():
    """라벨 왼쪽, 스테퍼 오른쪽. 한 줄에 축이 하나다. 상자도 하나로 합쳐
    두 줄 사이를 실선으로만 나눈다."""
    return ('<div class="pax">'
            + pax_row(T['adultPax'], None, 2)
            + pax_row(T['childPax'], '[아동 요금 확정 필요]', 0, minus_off=True)
            + "</div>")


def tour_list(sel=0, mobile=False):
    out = []
    for i, (name, when, price, img) in enumerate(TOURS):
        total, per = TOTALS[i]
        out.append(f'<li><div class="t{" on" if i == sel else ""}">'
                   f'<img src="{img}" alt="">'
                   f'<span class="tt"><b>{name}</b><i>{when}</i></span>'
                   f'<span class="pr"><em>{total}</em><u>{per}</u></span></div></li>')
    return f'<ul class="tours{" one" if mobile else ""}">{"".join(out)}</ul>'


def chip(idx, sub):
    """고른 상품을 한 줄로 접는다. 목록 다섯 줄이 이 한 줄이 되면서
    아래 칸들이 그만큼 위로 올라온다."""
    name, when, price, img = TOURS[idx]
    return (f'<div class="chip"><img src="{img}" alt="">'
            f'<span class="ct"><b>{name}</b><i>{sub}</i></span>'
            f'<span class="chg">바꾸기</span></div>')


def glab(text, note=None):
    return (f'<div class="glab"><b>{text}</b>'
            + (f'<i>{note}</i>' if note else "") + "</div>")


# 콤보 세부 옵션 - ReservationClientPage.tsx 의 세 가지 그대로
COMBO_OPTS = [
    ("거북이 스노클링 + 패러세일링", "$210", True),
    ("거북이 스노클링 + 제트 스키", "$210", False),
    ("거북이 스노클링 + 패러세일링 + 제트스키", "$310", False),
]
COMBO_TIMES = [("1부", "07:30 AM", True), ("2부", "10:30 AM", False)]


def combo_opts():
    rows = "".join(
        f'<li><div class="opt{" on" if on else ""}"><span>{n}</span>'
        f'<em>{p}</em>{I_CHECK if on else ""}</div></li>'
        for n, p, on in COMBO_OPTS)
    return f'<ul class="opts">{rows}</ul>'


def combo_times():
    rows = "".join(
        f'<li><div class="opt{" on" if on else ""}"><span>{n}</span>'
        f'<em>{h}</em>{I_CHECK if on else ""}</div></li>'
        for n, h, on in COMBO_TIMES)
    return f'<ul class="opts two-up">{rows}</ul>'


# ────────────────────────────── 스타일 ──────────────────────────────

BASE = """
.x{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;color:var(--muted);background:var(--paper)}
.grp+.grp{margin-top:__GAP__px}
.glab{display:flex;align-items:baseline;gap:9px;margin-bottom:12px;flex-wrap:wrap}
.glab b{font-family:'SUIT',system-ui,sans-serif;font-size:__LAB__px;font-weight:800;
  color:var(--ink)}
.glab i{font-style:normal;font-size:12px;color:var(--muted)}

/* 상품 목록 - 다섯 개라 마지막 하나가 두 칸을 쓴다. 빈 칸은 남기지 않는다. */
.tours{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tours li:last-child{grid-column:1 / -1}
.tours.one{display:block}
.tours.one li+li{margin-top:8px}
.t{display:flex;align-items:center;gap:11px;padding:10px;border-radius:14px;
  border:1px solid var(--line);background:#fff;min-height:64px}
.t.on{border-color:var(--ink);background:var(--paper);box-shadow:inset 0 0 0 1px var(--ink)}
.t img{width:42px;height:42px;border-radius:10px;object-fit:cover}
.t .tt{flex:1;min-width:0}
.t b{display:block;font-size:13px;font-weight:700;color:var(--ink);line-height:1.35}
.t i{display:block;font-style:normal;font-size:11px;color:var(--muted);margin-top:3px}
.t .pr{text-align:right;white-space:nowrap}
.t .pr em{display:block;font-style:normal;font-family:'SUIT',system-ui,sans-serif;
  font-size:14px;font-weight:800;color:var(--ink)}
.t .pr u{display:block;text-decoration:none;font-size:10.5px;color:var(--muted);margin-top:2px}

/* 접힌 상품 칩 - 목록 다섯 줄이 이 한 줄로 줄어든다 */
.chip{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:14px;
  background:var(--soft)}
.chip img{width:50px;height:50px;border-radius:10px;object-fit:cover}
.chip .ct{flex:1;min-width:0}
.chip b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:14px;
  font-weight:800;color:var(--ink);line-height:1.35}
.chip i{display:block;font-style:normal;font-size:11.5px;color:var(--muted);margin-top:3px}
/* 글자는 작지만 손가락으로 누르는 것이라 타깃 크기를 따로 맞춘다 */
.chg{display:flex;align-items:center;min-height:44px;padding:0 6px;font-size:12.5px;
  font-weight:700;color:var(--ink);text-decoration:underline;text-underline-offset:3px;
  white-space:nowrap}

/* 콤보 세부 옵션 · 스노클링 시간 */
.opts li+li{margin-top:8px}
.opts.two-up{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.opts.two-up li+li{margin-top:0}
.opt{display:flex;align-items:center;gap:10px;min-height:52px;padding:0 14px;
  border-radius:14px;border:1px solid var(--line);background:#fff}
.opt.on{border-color:var(--ink);background:var(--paper);box-shadow:inset 0 0 0 1px var(--ink)}
.opt span{flex:1;min-width:0;font-size:13px;font-weight:700;color:var(--ink);line-height:1.35}
.opt em{font-style:normal;font-family:'SUIT',system-ui,sans-serif;font-size:13.5px;
  font-weight:800;color:var(--ink);white-space:nowrap}
.opt svg{color:var(--ink)}

/* 인원 - 라벨과 스테퍼를 한 줄에, 상자는 하나. 라벨은 위, 숫자는 가운데,
   버튼은 양 끝으로 벌려 두면 눈이 좇을 축이 셋이 되어 흩어져 보인다. */
.pax{border:1px solid var(--line);border-radius:14px}
.prow{display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:9px 8px 9px 15px}
.prow+.prow{border-top:1px solid var(--line)}
.plab{min-width:0}
.plab b{display:block;font-size:13.5px;font-weight:700;color:var(--ink)}
.plab i{display:block;font-style:normal;font-size:11.5px;color:var(--muted);margin-top:2px}
.stepper{display:flex;align-items:center;gap:2px;flex:none}
.stp{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff}
.stp.off{color:#9AA0A6}
.stepper .n{min-width:36px;text-align:center;font-family:'SUIT',system-ui,sans-serif;
  font-size:19px;font-weight:800;color:var(--ink)}

.cal{border:1px solid var(--line);border-radius:14px;padding:13px 15px 15px}
.cmon{display:flex;align-items:center;justify-content:space-between;gap:10px;
  margin-bottom:10px;flex-wrap:wrap}
.sels{display:flex;gap:6px;min-width:0}
/* 실제로는 select 다. 보드에서는 모양만 세운다. */
.sel{display:flex;align-items:center;gap:5px;height:44px;padding:0 11px 0 13px;
  border:1px solid var(--line);border-radius:12px;background:#fff}
.sel b{font-family:'SUIT',system-ui,sans-serif;font-size:13.5px;font-weight:800;
  color:var(--ink);white-space:nowrap}
.sel svg{color:var(--muted)}
.mnav{display:flex;gap:2px;flex:none}
.marr{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;color:var(--ink);background:var(--paper)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}
.cgrid .dow{font-size:11px;font-weight:700;color:var(--muted);padding:3px 0 5px}
.cgrid .d{height:var(--cell);display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:600;color:var(--ink);border-radius:10px}
.cgrid .d.no{color:var(--muted);text-decoration:line-through;text-decoration-thickness:1px}
/* 1차 투어와 같은 날. 자리가 없어 막힌 날(취소선)과 이유가 달라 표시도
   다르다. 숫자는 읽히게 두고 x 를 모서리에 올린다. */
.cgrid .d.clash{position:relative;color:var(--text);font-weight:700;
  background:rgba(210,89,26,.11)}
.cgrid .d.clash i{position:absolute;inset:0;display:block;color:var(--food);
  pointer-events:none}
.cgrid .d.clash i svg{width:100%;height:100%;display:block}
/* 숫자를 x 위로. 칸을 채운 x 아래 깔리면 며칠인지 읽히지 않는다. */
.cgrid .d.clash em{position:relative;z-index:1;font-style:normal}
.cgrid .d.on{background:var(--ink);color:#fff;font-weight:800}
.chelp{margin-top:9px;font-size:11.5px;color:var(--muted);line-height:1.5}

/* 인원을 바꾸면 달력이 조용히 바뀐다. 무엇이 다시 계산됐는지 먼저 말한다. */
.recalc{display:block;margin-bottom:9px;padding:8px 12px;border-radius:12px;
  background:var(--soft);font-size:12px;color:var(--ink);line-height:1.5}
.recalc b{font-weight:800}

/* 활동별 묶음 - 콤보는 '날짜 + 숙소' 가 두 벌이다. 순서대로 늘어놓으면
   어느 날짜가 어느 활동인지 흐려지므로 활동 이름으로 묶는다. */
.act{border:1px solid var(--line);border-radius:14px;padding:0 0 15px;overflow:hidden}
.act+.act{margin-top:12px}
.ahead{display:flex;align-items:center;gap:9px;padding:11px 15px;background:var(--soft);
  border-bottom:1px solid var(--line)}
.ano{width:22px;height:22px;border-radius:50%;background:var(--ink);color:#fff;flex:none;
  display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:800;
  font-family:'SUIT',system-ui,sans-serif}
.ahead b{font-family:'SUIT',system-ui,sans-serif;font-size:13.5px;font-weight:800;color:var(--ink)}
.ahead i{font-style:normal;font-size:11.5px;color:var(--muted)}
.abody{padding:14px 15px 0}
.abody .cal{border:none;padding:0}
.asub{margin:14px 0 0;padding-top:14px;border-top:1px solid var(--line)}

.f+.f{margin-top:12px}
.f label{display:block;font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:6px}
.f .in{min-height:46px;border:1px solid var(--line);border-radius:12px;background:#fff;
  display:flex;align-items:center;gap:8px;padding:0 13px;font-size:13.5px;color:var(--muted)}
.f .in.filled{color:var(--ink);font-weight:600}
.f .help{margin-top:6px;font-size:11.5px;color:var(--muted);line-height:1.5}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
""" + PICK_CSS


CSS_D = """
.wrap{position:relative;z-index:2;padding:46px 0;display:flex;justify-content:center}
.modal{width:1080px;background:#fff;border-radius:22px;box-shadow:var(--e3);overflow:hidden}
.m-top{display:flex;align-items:center;justify-content:space-between;
  padding:20px 28px;border-bottom:1px solid var(--line)}
.m-top h1{font-family:'SUIT',system-ui,sans-serif;font-size:20px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.cols{display:grid;grid-template-columns:1fr 372px}
.left{padding:26px 28px 30px}
""" + BASE.replace("__GAP__","26").replace("__LAB__","15") + """
/* 인원 - 데스크탑은 왼쪽 칸이 652px 라 한 줄에 하나씩 두면 라벨과 스테퍼
   사이가 450px 가까이 빈다. 두 줄을 좌우로 나눠 그 여백을 없앤다.
   모바일은 폭이 좁아 위아래 그대로가 맞다. */
.pax{display:grid;grid-template-columns:1fr 1fr}
.prow{padding:11px 10px 11px 16px}
.prow+.prow{border-top:none;border-left:1px solid var(--line)}

/* 요약 레일 - 이 판의 핵심. 인원을 바꾸면 여기 금액이 바로 바뀐다. */
.side{background:var(--soft);border-left:1px solid var(--line);padding:26px 24px 28px}
.s-tour{display:flex;gap:11px;align-items:center}
.s-tour img{width:52px;height:52px;border-radius:10px;object-fit:cover}
.s-tour b{font-family:'SUIT',system-ui,sans-serif;font-size:14px;font-weight:800;
  color:var(--ink);line-height:1.35}
.s-list{margin-top:18px}
.s-list li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:13px}
.s-list li span{color:var(--muted)}
.s-list li b{font-weight:700;color:var(--ink);text-align:right}
.s-rule{height:1px;background:var(--line);margin:14px 0}
.s-sum li{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:var(--text)}
.s-sum li b{font-weight:700;color:var(--ink)}
.s-total{margin-top:14px;padding-top:14px;border-top:1px solid var(--line);
  display:flex;align-items:baseline;justify-content:space-between}
.s-total span{font-size:13.5px;font-weight:700;color:var(--ink)}
.s-total b{font-family:'SUIT',system-ui,sans-serif;font-size:27px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.cur{display:flex;gap:6px;margin-top:14px}
.cur a{flex:1;height:44px;border-radius:99px;border:1px solid var(--line);background:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;
  color:var(--muted)}
.cur a.on{background:var(--ink);border-color:var(--ink);color:#fff}
.pay{margin-top:14px;height:54px;border-radius:99px;background:var(--ink);color:#fff;
  display:flex;align-items:center;justify-content:center;gap:9px;
  font-size:15.5px;font-weight:800;font-family:'SUIT',system-ui,sans-serif}
.pay.wait{background:var(--line);color:var(--text)}
.safe{display:flex;gap:7px;margin-top:12px;font-size:11.5px;color:var(--muted);line-height:1.55}
.safe svg{margin-top:2px}
.s-note{margin-top:6px;font-size:11.5px;color:var(--text);line-height:1.5}
.s-empty{margin-top:16px;padding:14px;border-radius:12px;background:#fff;
  border:1px dashed var(--line);font-size:12.5px;color:var(--muted);line-height:1.6}
"""

CSS_M = """
.wrap{position:relative;z-index:2;padding:58px 0 0}
.modal{background:#fff;border-radius:22px 22px 0 0;box-shadow:var(--e3);overflow:hidden}
.m-top{display:flex;align-items:center;justify-content:space-between;
  padding:16px 18px;border-bottom:1px solid var(--line)}
.m-top h1{font-family:'SUIT',system-ui,sans-serif;font-size:17px;font-weight:800;color:var(--ink)}
.left{padding:20px 18px 24px}
""" + BASE.replace("__GAP__","24").replace("__LAB__","14.5") + """
.chip img{width:46px;height:46px}
.t img{width:44px;height:44px}
.cgrid{gap:1px}
/* 금액을 늘 보이게 하는 바. 실제로는 화면 아래에 고정된다. */
.bar{position:relative;background:#fff;border-top:1px solid var(--line);
  box-shadow:0 -10px 24px rgba(16,20,24,.08);padding:12px 18px 16px}
.bline{display:flex;align-items:baseline;justify-content:space-between}
.bline span{font-size:13px;font-weight:700;color:var(--text)}
.bline b{font-family:'SUIT',system-ui,sans-serif;font-size:24px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.bsub{margin-top:2px;font-size:11.5px;color:var(--muted);line-height:1.5}
.cur{display:flex;gap:6px;margin-top:10px}
.cur a{flex:1;height:44px;border-radius:99px;border:1px solid var(--line);background:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
  color:var(--muted)}
.cur a.on{background:var(--ink);border-color:var(--ink);color:#fff}
.pay{margin-top:10px;height:52px;border-radius:99px;background:var(--ink);color:#fff;
  display:flex;align-items:center;justify-content:center;gap:9px;
  font-size:15px;font-weight:800;font-family:'SUIT',system-ui,sans-serif}
.pay.wait{background:var(--line);color:var(--text)}
.safe{display:flex;gap:7px;margin-top:10px;font-size:11px;color:var(--muted);line-height:1.5}
.safe svg{margin-top:1px}
"""

# ────────────────────────────── 본문 ──────────────────────────────

RECALC = ('<p class="recalc">성인 2명 기준으로 10월에 고를 수 있는 날짜는 '
          '<b>17개</b>입니다.</p>')

GUEST = f"""
        <div class="two">
          {field(T['name_label'], '김오션')}
          {field(T['email_label'], 'hioceanstar@gmail.com')}
        </div>
        {field(T['phone_label'], 'hioceanstar')}"""

GUEST_M = f"""
        {field(T['name_label'], '김오션')}
        {field(T['email_label'], 'hioceanstar@gmail.com')}
        {field(T['phone_label'], 'hioceanstar')}"""


def stay_fields():
    return (field(T['hotel_label'], '하얏트 리젠시 와이키키 비치 리조트',
                  help=T['hotel_helper']) + pick_row())


def single_body(mobile, picked):
    """A(미선택) 와 B(단품 선택됨) 는 같은 뼈대를 쓴다. 다른 것은 첫 칸뿐이다."""
    guest = GUEST_M if mobile else GUEST
    cell = 38 if mobile else 34
    if picked:
        first = (f'<div class="grp">{glab(T["step1"])}'
                 + chip(0, '1부 07:30-11:30 · 2부 10:30-14:30') + '</div>'
                 + f'<div class="grp">{glab("거북이 스노클링 시간 선택", "픽업 포함 시간")}'
                 + combo_times() + '</div>')
    else:
        first = (f'<div class="grp">{glab(T["step1"], "성인 1인 기준")}'
                 + tour_list(sel=None, mobile=mobile) + '</div>')
    return f"""
      {first}
      <div class="grp">{glab(T['step2'], '24개월 미만 무료')}{pax_block()}</div>
      <div class="grp">{glab(T['step3'])}
        {RECALC}{month_grid(sel=17 if picked else None,
                            blocked=PAST | FULL, cell=cell)}</div>
      <div class="grp">{glab(T['step4'])}
        {stay_fields()}{guest}</div>"""


def combo_body(mobile, kind="marine"):
    """C·D - 두 활동이 다른 날에 열린다. 날짜와 숙소를 활동별로 두 벌 받는다.

    marine  패러세일링/제트스키. ReservationClientPage 의 combo_marine 분기 그대로.
    surf    서핑. 코드에는 아직 분기가 없어 marine 의 구조만 그대로 따르되,
            marine 에만 있는 것(세부 옵션 3가지, 주말·공휴일 불가)은 넣지 않는다.
            서핑의 운휴 규칙은 아직 못 받았으므로 확인 문구로 남긴다.
    """
    guest = GUEST_M if mobile else GUEST
    cell = 34 if mobile else 30
    surf = kind == "surf"

    if surf:
        head = (f'<div class="grp">{glab(T["step1"])}'
                + chip(4, "두 활동이 서로 다른 날에 열립니다") + "</div>")
        sec_name, sec_rule = "서핑 강습", "[운영 시간 확정 필요]"
        sec_sel, sec_blocked = 21, PAST
        sec_note = ("※ 서핑의 운휴 요일은 아직 받지 못했습니다. 지금은 스노클링과 "
                    "같은 날만 막아 두었습니다.")
    else:
        head = (f'<div class="grp">{glab(T["step1"])}'
                + chip(2, "두 활동이 서로 다른 날에 열립니다") + "</div>"
                + f'<div class="grp">{glab("콤보 세부 옵션 선택")}{combo_opts()}</div>')
        sec_name, sec_rule = "패러세일링 / 제트스키", "주말 및 공휴일 불가"
        sec_sel, sec_blocked = 20, PAST | WEEKEND
        sec_note = "※ 픽업 장소가 스노클링과 다를 수 있어 숙소를 한 번 더 확인합니다."

    return f"""
      {head}
      <div class="grp">{glab('거북이 스노클링 시간 선택', '픽업 포함 시간')}{combo_times()}</div>
      <div class="grp">{glab(T['step2'], '24개월 미만 무료')}{pax_block()}</div>
      <div class="grp">{glab('날짜와 픽업', '활동마다 따로 받습니다')}
        <div class="act">
          <div class="ahead"><span class="ano">1</span>
            <b>거북이 스노클링</b><i>1부 07:30-11:30</i></div>
          <div class="abody">
            {RECALC}{month_grid(sel=17, blocked=PAST | FULL, cell=cell)}
            <div class="asub">{stay_fields()}</div>
          </div>
        </div>
        <div class="act">
          <div class="ahead"><span class="ano">2</span>
            <b>{sec_name}</b><i>{sec_rule}</i></div>
          <div class="abody">
            <p class="recalc">스노클링 날짜와 <b>같은 날은 고를 수 없습니다.</b>
              달력에서 ✕ 로 표시한 10월 17일입니다.</p>
            {month_grid(sel=sec_sel, blocked=sec_blocked, cell=cell, note=sec_note,
                        clash=17)}
            <div class="asub">{stay_fields()}</div>
          </div>
        </div>
      </div>
      <div class="grp">{glab('예약자 정보')}{guest}</div>"""


# ────────────────────────────── 요약 레일 ──────────────────────────────

def side(state):
    if state == "A":
        return f"""<aside class="side">
      <div class="s-empty">투어를 고르면 날짜와 금액이 여기에 쌓입니다.
        인원을 넣으면 실제 결제 금액이 계산됩니다.</div>
      <div class="s-total"><span>{T['total_payment']}</span><b class="n">-</b></div>
      <div class="cur"><a class="on">KRW</a><a>USD</a></div>
      <div class="pay wait">투어를 먼저 골라주세요</div>
      <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
    </aside>"""
    if state == "B":
        rows = """<li><span>날짜</span><b>2026-10-17 (토)</b></li>
        <li><span>시간</span><b>1부 07:30-11:30</b></li>
        <li><span>인원</span><b>성인 2 · 아동 0</b></li>
        <li><span>픽업</span><b>하얏트 리젠시 앞</b></li>"""
        return f"""<aside class="side">
      <div class="s-tour"><img src="{TOURS[0][3]}" alt=""><b>{TOURS[0][0]}</b></div>
      <ul class="s-list">{rows}</ul>
      <div class="s-rule"></div>
      <ul class="s-sum"><li><span>성인 2 × ₩151,570</span><b class="n">₩303,140</b></li></ul>
      <div class="s-total"><span>{T['total_payment']}</span><b class="n">₩303,140</b></div>
      <div class="cur"><a class="on">KRW</a><a>USD</a></div>
      <div class="pay">{T['checkout_btn']} {I_ARROW}</div>
      <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
    </aside>"""
    if state == "D":
        # 서핑 콤보 $160 (운영자). 원화는 $×1,377.9 임시값.
        rows = """<li><span>인원</span><b>성인 2 · 아동 0</b></li>
        <li><span>스노클링 날짜</span><b>10-17 (토) 1부</b></li>
        <li><span>스노클링 픽업</span><b>하얏트 리젠시 앞</b></li>
        <li><span>서핑 날짜</span><b>10-21 (수)</b></li>
        <li><span>서핑 픽업</span><b>하얏트 리젠시 앞</b></li>"""
        idx, per, tot = 4, "성인 2 × ₩220,460", "₩440,920"
        note = ""
    else:
        rows = """<li><span>옵션</span><b>패러세일링 ($210)</b></li>
        <li><span>인원</span><b>성인 2 · 아동 0</b></li>
        <li><span>스노클링 날짜</span><b>10-17 (토) 1부</b></li>
        <li><span>스노클링 픽업</span><b>하얏트 리젠시 앞</b></li>
        <li><span>패러세일링 날짜</span><b>10-20 (화)</b></li>
        <li><span>패러세일링 픽업</span><b>하얏트 리젠시 앞</b></li>"""
        idx, per, tot = 2, "성인 2 × ₩289,360", "₩578,720"
        note = ""
    return f"""<aside class="side">
      <div class="s-tour"><img src="{TOURS[idx][3]}" alt=""><b>{TOURS[idx][0]}</b></div>
      <ul class="s-list">{rows}</ul>
      <div class="s-rule"></div>
      <ul class="s-sum"><li><span>{per}</span><b class="n">{tot}</b></li></ul>
      <div class="s-total"><span>{T['total_payment']}</span><b class="n">{tot}</b></div>
      {note}
      <div class="cur"><a class="on">KRW</a><a>USD</a></div>
      <div class="pay">{T['checkout_btn']} {I_ARROW}</div>
      <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
    </aside>"""


def bar(state):
    if state == "A":
        return f"""<div class="bar">
    <div class="bline"><span>{T['total_payment']}</span><b class="n">-</b></div>
    <p class="bsub">투어를 고르면 금액이 계산됩니다.</p>
    <div class="cur"><a class="on">KRW</a><a>USD</a></div>
    <div class="pay wait">투어를 먼저 골라주세요</div>
    <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
  </div>"""
    if state == "B":
        sub = f"{TOURS[0][0]} · 2026-10-17 (토) 성인 2명"
        tot = "₩303,140"
    elif state == "D":
        sub = "서핑 · 스노클링 10-17 (토), 서핑 10-21 (수)"
        tot = "₩440,920"
    else:
        sub = "패러세일링 · 스노클링 10-17 (토), 패러세일링 10-20 (화)"
        tot = "₩578,720"
    return f"""<div class="bar">
    <div class="bline"><span>{T['total_payment']}</span><b class="n">{tot}</b></div>
    <p class="bsub">{sub}</p>
    <div class="cur"><a class="on">KRW</a><a>USD</a></div>
    <div class="pay">{T['checkout_btn']} {I_ARROW}</div>
    <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
  </div>"""


# ────────────────────────────── 조립 ──────────────────────────────

def build(state, mobile, title, out):
    if state in ("C", "D"):
        body = combo_body(mobile, "surf" if state == "D" else "marine")
    else:
        body = single_body(mobile, state == "B")
    top = (f'<div class="m-top"><h1>{T["title"]}</h1>'
           f'<span class="x">{I_X}</span></div>')
    if mobile:
        html = (f'<div class="wrap"><div class="modal">{top}'
                f'<div class="left">{body}</div>{bar(state)}</div></div>')
        css, width = CSS_M, 375
    else:
        html = (f'<div class="wrap"><div class="modal">{top}'
                f'<div class="cols"><div class="left">{body}</div>'
                f'{side(state)}</div></div></div>')
        css, width = CSS_D, 1440
    io.open(out, "w", encoding="utf-8").write(page(title, css, html, width))
    print(out)


build("A", False, "시안 1 · 투어 미선택 — 데스크탑", "Sian1A.dc.html")
build("A", True,  "시안 1 · 투어 미선택 — 모바일",   "Sian1A_M.dc.html")
build("B", False, "시안 1 · 단품 선택됨 — 데스크탑", "Sian1B.dc.html")
build("B", True,  "시안 1 · 단품 선택됨 — 모바일",   "Sian1B_M.dc.html")
build("C", False, "시안 1 · 콤보 · 패러세일링/제트스키 — 데스크탑", "Sian1C.dc.html")
build("C", True,  "시안 1 · 콤보 · 패러세일링/제트스키 — 모바일",   "Sian1C_M.dc.html")
build("D", False, "시안 1 · 콤보 · 서핑 — 데스크탑", "Sian1D.dc.html")
build("D", True,  "시안 1 · 콤보 · 서핑 — 모바일",   "Sian1D_M.dc.html")
