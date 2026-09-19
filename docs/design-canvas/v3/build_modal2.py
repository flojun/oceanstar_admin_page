# -*- coding: utf-8 -*-
"""시안 2 - 한 번에 하나씩. 4단계를 3단계로 줄이고 한 화면에 한 가지만 묻는다.

인원과 날짜를 한 단계로 묶은 것은 취향이 아니라 실제 의존 관계다. 예약
가능한 날짜가 인원 수에 따라 달라지므로(ko.ts pax_notice), 따로 물으면
날짜를 고른 뒤 인원을 바꿨을 때 고른 날짜가 무효가 된다.

재검토 반영
- 상품별 총액은 _modal_base.TOTALS 로 옮겨 세 안이 같은 값을 쓴다.
- 숙소와 픽업 두 칸을 한 칸으로 합쳤다. 입력 항목 9개 -> 8개.
- 3단계 총액이 입력칸 아래에 묻혀 있었다. 버튼과 같은 바닥 칸으로 올려,
  채우는 동안 금액이 계속 보이게 했다.
"""
import io, sys
sys.path.insert(0, ".")
from _modal_base import (T, TOURS, TOTALS, PICK_CSS, pick_row, page,
                         I_X, I_ARROW, I_MINUS, I_PLUS, I_LOCK,
                         I_PIN, I_LEFT, I_CHECK)

STEPS = ["언제 · 몇 명", "어떤 투어", "예약 정보"]

CSS = """
.wrap{position:relative;z-index:2;padding:%(padtop)dpx 0 %(padbot)dpx;
  display:flex;flex-direction:column;align-items:center;gap:%(gap)dpx}
.cap{font-family:'SUIT',system-ui,sans-serif;font-size:%(cap)dpx;font-weight:800;
  color:rgba(255,255,255,.92);letter-spacing:-.01em}
.modal{width:%(mw)s;background:#fff;border-radius:22px;box-shadow:var(--e3);overflow:hidden}
.m-top{display:flex;align-items:center;justify-content:space-between;
  padding:16px 22px;border-bottom:1px solid var(--line)}
.m-top h1{font-family:'SUIT',system-ui,sans-serif;font-size:17px;font-weight:800;color:var(--ink)}
.x{width:44px;height:44px;border-radius:50%%;display:flex;align-items:center;
  justify-content:center;color:var(--muted);background:var(--paper)}

/* 진행 막대 - 몇 개 중 몇 번째인지, 무엇이 남았는지 한눈에 */
.prog{display:flex;gap:8px;padding:14px 22px 0}
.prog div{flex:1}
.prog .rail{height:4px;border-radius:99px;background:var(--line)}
.prog .on .rail{background:var(--ink)}
.prog .done .rail{background:var(--ink)}
.prog span{display:block;margin-top:8px;font-size:11.5px;font-weight:700;color:var(--muted)}
.prog .on span{color:var(--ink)}
.body{padding:20px 22px 22px}
.q{font-family:'SUIT',system-ui,sans-serif;font-size:%(q)dpx;font-weight:800;
  color:var(--ink);letter-spacing:-.02em;line-height:1.35}
.qs{margin-top:7px;font-size:13px;color:var(--muted);line-height:1.6}

.pax{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
.pbox{border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.pbox span{display:block;font-size:12.5px;font-weight:700;color:var(--text)}
.prow{display:flex;align-items:center;justify-content:space-between;margin-top:9px}
.stp{width:44px;height:44px;border-radius:50%%;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff}
.stp.off{color:#9AA0A6}
.prow b{font-family:'SUIT',system-ui,sans-serif;font-size:21px;font-weight:800;color:var(--ink)}

.cal{border:1px solid var(--line);border-radius:14px;padding:13px 14px 15px;margin-top:14px}
.cmon{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.cmon b{font-family:'SUIT',system-ui,sans-serif;font-size:13.5px;font-weight:800;color:var(--ink)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}
.cgrid .dow{font-size:11px;font-weight:700;color:var(--muted);padding:3px 0 5px}
.cgrid .d{height:%(cell)dpx;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:600;color:var(--ink);border-radius:10px}
/* 비활성 날짜도 읽혀야 한다. 흐리게만 두면 며칠이 마감인지 알 수 없어
   '인원에 맞는 날짜만 활성화' 라는 규칙 자체가 전달되지 않는다.
   회색은 읽히는 값으로 올리고, 못 고르는 날이라는 건 취소선이 말한다. */
.cgrid .d.no{color:var(--muted);text-decoration:line-through;text-decoration-thickness:1px}
.cgrid .d.on{background:var(--ink);color:#fff;font-weight:800}
.chelp{margin-top:9px;font-size:11.5px;color:var(--muted);line-height:1.5}

/* 2단계 - 고른 인원으로 계산한 총액을 상품마다 바로 보여 준다 */
.tl{margin-top:16px}
.tl li+li{margin-top:9px}
.tr{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;
  border:1px solid var(--line);background:#fff;min-height:72px}
.tr.on{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink);background:var(--paper)}
.tr.off{opacity:.5}
.tr img{width:50px;height:50px;border-radius:10px;object-fit:cover}
.tr .tt{flex:1;min-width:0}
.tr b{display:block;font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.35}
.tr i{display:block;font-style:normal;font-size:11.5px;color:var(--muted);margin-top:3px}
.tr .pr{text-align:right;white-space:nowrap}
.tr .pr em{display:block;font-style:normal;font-family:'SUIT',system-ui,sans-serif;
  font-size:15px;font-weight:800;color:var(--ink)}
.tr .pr u{display:block;text-decoration:none;font-size:11px;color:var(--muted);margin-top:3px}
.tick{width:24px;height:24px;border-radius:50%%;background:var(--ink);color:#fff;
  display:flex;align-items:center;justify-content:center}

.f+.f{margin-top:12px}
.f label{display:block;font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:6px}
.f .in{min-height:46px;border:1px solid var(--line);border-radius:12px;background:#fff;
  display:flex;align-items:center;gap:8px;padding:0 13px;font-size:13.5px;color:var(--muted)}
.f .in.filled{color:var(--ink);font-weight:600}
.f .help{margin-top:6px;font-size:11.5px;color:var(--muted);line-height:1.5}
.fields{margin-top:16px}

.tot{margin-top:18px;padding:14px 16px;border-radius:14px;background:var(--soft);
  display:flex;align-items:baseline;justify-content:space-between}
.tot span{font-size:13px;font-weight:700;color:var(--ink)}
.tot b{font-family:'SUIT',system-ui,sans-serif;font-size:24px;font-weight:800;color:var(--ink)}
.cur{display:flex;gap:6px;margin-top:10px}
.cur a{flex:1;height:44px;border-radius:99px;border:1px solid var(--line);background:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;color:var(--muted)}
.cur a.on{background:var(--ink);border-color:var(--ink);color:#fff}
.safe{display:flex;gap:7px;margin-top:11px;font-size:11.5px;color:var(--muted);line-height:1.55}

/* 마지막 단계의 바닥 칸 - 금액과 버튼을 한 덩어리로 둔다.
   입력칸 아래에 금액을 두면 다 채우기 전까지 얼마인지 안 보인다. */
.foot{border-top:1px solid var(--line);padding:14px 22px 18px}
.fline{display:flex;align-items:baseline;justify-content:space-between}
.fline span{font-size:13px;font-weight:700;color:var(--text)}
.fline b{font-family:'SUIT',system-ui,sans-serif;font-size:24px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.foot .nav{padding:11px 0 0}
.nav{display:flex;gap:10px;align-items:center;padding:0 22px 20px}
.pick{margin-top:8px;display:flex;align-items:center;gap:9px;padding:7px 12px;
  border-radius:12px;background:var(--soft)}
.pick>svg{color:var(--sea)}
.pk{flex:1;min-width:0}
.pk i{display:block;font-style:normal;font-size:10.5px;font-weight:700;color:var(--muted)}
.pk u{display:block;text-decoration:none;font-size:12.5px;font-weight:700;
  color:var(--ink);line-height:1.35;margin-top:1px}
.pick a{display:flex;align-items:center;min-height:44px;padding:0 2px;font-size:11.5px;
  font-weight:700;color:var(--ink);text-decoration:underline;text-underline-offset:3px;
  white-space:nowrap}

.back{height:52px;padding:0 20px;border-radius:99px;border:1px solid var(--line);
  display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;color:var(--ink);
  background:#fff}
.next{flex:1;height:52px;border-radius:99px;background:var(--ink);color:#fff;
  display:flex;align-items:center;justify-content:center;gap:9px;
  font-size:15.5px;font-weight:800;font-family:'SUIT',system-ui,sans-serif}
"""

def prog(active):
    out=[]
    for i,s in enumerate(STEPS):
        cls = "on" if i==active else ("done" if i<active else "")
        out.append(f'<div class="{cls}"><div class="rail"></div><span>{i+1}. {s}</span></div>')
    return f'<div class="prog">{"".join(out)}</div>'

def calendar(cell=36, sel=17):
    dows="".join(f'<span class="dow">{d}</span>' for d in "일월화수목금토")
    cells=['<span class="d"></span>']*2
    FULL={18,23,30}
    for d in range(1,32):
        cls="d"
        if d<12 or d in FULL: cls+=" no"
        if d==sel: cls+=" on"
        cells.append(f'<span class="{cls}">{d}</span>')
    return (f'<div class="cal"><div class="cmon"><b>2026년 10월</b>'
            f'<span style="color:var(--muted);font-size:12px">← →</span></div>'
            f'<div class="cgrid">{dows}{"".join(cells)}</div>'
            f'<p class="chelp">{T["pax_notice"].replace("{pax}","2")}</p></div>')

def field(label, value, ph=False, help=None, ic=""):
    return (f'<div class="f"><label>{label}</label>'
            f'<div class="{"in" if ph else "in filled"}">{ic}{value}</div>'
            + (f'<p class="help">{help}</p>' if help else "") + "</div>")

# 2단계 목록 - 성인 2명 기준 총액(_modal_base.TOTALS). 값이 없는 상품은
# 지어내지 않고 그대로 노출한다.
STATE = {0: "on", 4: "off"}

def tour_rows():
    out=[]
    for idx in range(len(TOURS)):
        name,when,_,img = TOURS[idx]
        total, per = TOTALS[idx]
        state = STATE.get(idx, "")
        tick = f'<span class="tick">{I_CHECK}</span>' if state=="on" else ""
        out.append(f'<li><div class="tr {state}"><img src="{img}" alt="">'
                   f'<span class="tt"><b>{name}</b><i>{when}</i></span>'
                   f'<span class="pr"><em>{total}</em><u>{per}</u></span>{tick}</div></li>')
    return "".join(out)

def step1():
    return f"""
  {prog(0)}
  <div class="body">
    <h2 class="q">언제, 몇 분이 가시나요?</h2>
    <p class="qs">예약 가능한 날짜는 인원 수에 따라 달라집니다. 그래서 두 가지를 함께 여쭙니다.</p>
    <div class="pax">
      <div class="pbox"><span>{T['adultPax']}</span><div class="prow">
        <span class="stp">{I_MINUS}</span><b class="n">2</b><span class="stp">{I_PLUS}</span></div></div>
      <div class="pbox"><span>{T['childPax']}</span><div class="prow">
        <span class="stp off">{I_MINUS}</span><b class="n">0</b><span class="stp">{I_PLUS}</span></div></div>
    </div>
    {calendar()}
  </div>
  <div class="nav"><div class="next">다음 {I_ARROW}</div></div>"""

def step2():
    return f"""
  {prog(1)}
  <div class="body">
    <h2 class="q">어떤 투어로 하시겠어요?</h2>
    <p class="qs">2026-10-17 (토) · 성인 2명 기준 총액입니다.</p>
    <ul class="tl">{tour_rows()}</ul>
  </div>
  <div class="nav"><div class="back">{I_LEFT} 이전</div><div class="next">다음 {I_ARROW}</div></div>"""

def step3():
    return f"""
  {prog(2)}
  <div class="body">
    <h2 class="q">픽업 장소와 연락처를 알려주세요</h2>
    <p class="qs">{TOURS[0][0]} · 2026-10-17 (토) 성인 2명</p>
    <div class="fields">
      {field(T['hotel_label'], '하얏트 리젠시 와이키키 비치 리조트', help=T['hotel_helper'])}
      {pick_row()}
      {field(T['name_label'], '김오션')}
      {field(T['email_label'], 'hioceanstar@gmail.com')}
      {field(T['phone_label'], 'hioceanstar')}
    </div>
    <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
  </div>
  <div class="foot">
    <div class="fline"><span>{T['total_payment']}</span><b class="n">₩303,140</b></div>
    <div class="cur"><a class="on">KRW</a><a>USD</a></div>
    <div class="nav"><div class="back">{I_LEFT} 이전</div>
      <div class="next">{T['checkout_btn']} {I_ARROW}</div></div>
  </div>"""

def build(width, mw, padtop, padbot, gap, cap, q, cell, title, out):
    css = CSS % dict(padtop=padtop, padbot=padbot, gap=gap, cap=cap, mw=mw, q=q, cell=cell)
    body = ""
    for i, mk in enumerate((step1, step2, step3)):
        body += (f'<p class="cap">{i+1}단계 {STEPS[i]}</p>'
                 f'<div class="modal"><div class="m-top"><h1>{T["title"]}</h1>'
                 f'<span class="x">{I_X}</span></div>{mk()}</div>')
    io.open(out,"w",encoding="utf-8").write(
        page(title, css, f'<div class="wrap">{body}</div>', width))
    print(out)

build(1440, "680px", 44, 64, 40, 15, 23, 36, "시안 2 · 한 번에 하나씩 — 데스크탑", "Modal2.dc.html")
build(375,  "339px", 28, 40, 26, 13, 20, 34, "시안 2 · 한 번에 하나씩 — 모바일", "Modal2_M.dc.html")
