# -*- coding: utf-8 -*-
"""시안 1 - 한 장에 다 보기. 단계를 없애고 금액을 처음부터 옆에 세운다."""
import io, sys
sys.path.insert(0, ".")
from _modal_base import (T, TOURS, page, I_X, I_ARROW, I_MINUS, I_PLUS, I_LOCK, I_PIN)

CSS_D = """
.wrap{position:relative;z-index:2;padding:50px 0;display:flex;justify-content:center}
.modal{width:1080px;background:#fff;border-radius:22px;box-shadow:var(--e3);overflow:hidden}
.m-top{display:flex;align-items:center;justify-content:space-between;
  padding:20px 28px;border-bottom:1px solid var(--line)}
.m-top h1{font-family:'SUIT',system-ui,sans-serif;font-size:20px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.x{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;color:var(--muted);background:var(--paper)}
.cols{display:grid;grid-template-columns:1fr 372px}
.left{padding:26px 28px 30px}
.grp+.grp{margin-top:26px}
.glab{display:flex;align-items:baseline;gap:9px;margin-bottom:12px}
.glab b{font-family:'SUIT',system-ui,sans-serif;font-size:15px;font-weight:800;
  color:var(--ink)}
.glab i{font-style:normal;font-size:12.5px;color:var(--muted)}

/* 투어 - 5개라 마지막 하나가 두 칸을 쓴다. 빈 칸을 남기지 않는다. */
.tours{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tours li:last-child{grid-column:1 / -1}
.t{display:flex;align-items:center;gap:11px;padding:10px;border-radius:14px;
  border:1px solid var(--line);background:#fff}
.t.on{border-color:var(--ink);background:var(--paper);box-shadow:inset 0 0 0 1px var(--ink)}
.t img{width:42px;height:42px;border-radius:10px;object-fit:cover}
.t .tt{flex:1;min-width:0}
.t b{display:block;font-size:13px;font-weight:700;color:var(--ink);line-height:1.35}
.t i{display:block;font-style:normal;font-size:11px;color:var(--muted);margin-top:3px}
.t em{font-style:normal;font-family:'SUIT',system-ui,sans-serif;font-size:14px;
  font-weight:800;color:var(--ink);white-space:nowrap}

/* 인원 - 숫자를 직접 치는 대신 누르는 단추로. 오타가 안 난다. */
.pax{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pbox{border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.pbox span{display:block;font-size:12.5px;font-weight:700;color:var(--text)}
.prow{display:flex;align-items:center;justify-content:space-between;margin-top:9px}
.stp{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff}
.stp.off{color:#9AA0A6}
.prow b{font-family:'SUIT',system-ui,sans-serif;font-size:20px;font-weight:800;
  color:var(--ink)}

/* 날짜 */
.cal{border:1px solid var(--line);border-radius:14px;padding:14px 16px 16px}
.cmon{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.cmon b{font-family:'SUIT',system-ui,sans-serif;font-size:14px;font-weight:800;color:var(--ink)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}
.cgrid .dow{font-size:11px;font-weight:700;color:var(--muted);padding:4px 0 6px}
.cgrid .d{height:34px;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:600;color:var(--ink);border-radius:10px}
/* 비활성 날짜도 읽혀야 한다. 흐리게만 두면 며칠이 마감인지 알 수 없어
   '인원에 맞는 날짜만 활성화' 라는 규칙 자체가 전달되지 않는다.
   회색은 읽히는 값으로 올리고, 못 고르는 날이라는 건 취소선이 말한다. */
.cgrid .d.no{color:var(--muted);text-decoration:line-through;text-decoration-thickness:1px}
.cgrid .d.on{background:var(--ink);color:#fff;font-weight:800}
.chelp{margin-top:10px;font-size:11.5px;color:var(--muted);line-height:1.5}

/* 예약 정보 */
.f+.f{margin-top:12px}
.f label{display:block;font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:6px}
.f .in{height:44px;border:1px solid var(--line);border-radius:12px;background:#fff;
  display:flex;align-items:center;gap:8px;padding:0 13px;font-size:13.5px;color:var(--muted)}
.f .in.filled{color:var(--ink);font-weight:600}
.f .help{margin-top:6px;font-size:11.5px;color:var(--muted);line-height:1.5}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}

/* 요약 - 이 판의 핵심. 인원을 바꾸면 여기 금액이 바로 바뀐다. */
.side{background:var(--soft);border-left:1px solid var(--line);padding:26px 24px 28px;
  display:flex;flex-direction:column}
.s-tour{display:flex;gap:11px;align-items:center}
.s-tour img{width:52px;height:52px;border-radius:10px;object-fit:cover}
.s-tour b{font-family:'SUIT',system-ui,sans-serif;font-size:14px;font-weight:800;
  color:var(--ink);line-height:1.35}
.s-list{margin-top:18px}
.s-list li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:13px}
.s-list li span{color:var(--muted)}
.s-list li b{font-weight:700;color:var(--ink);text-align:right}
.s-rule{height:1px;background:var(--line);margin:14px 0}
.s-sum li{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;
  color:var(--text)}
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
.safe{display:flex;gap:7px;margin-top:12px;font-size:11.5px;color:var(--muted);
  line-height:1.55}
.safe svg{margin-top:2px;color:var(--muted)}
"""

def tour_items(sel=0):
    out = []
    for i, (name, when, price, img) in enumerate(TOURS):
        out.append(
            f'<li><div class="t{" on" if i==sel else ""}">'
            f'<img src="{img}" alt="">'
            f'<span class="tt"><b>{name}</b><i>{when}</i></span>'
            f'<em>{price}</em></div></li>')
    return "".join(out)

def calendar(sel=17):
    dows = "".join(f'<span class="dow">{d}</span>' for d in "일월화수목금토")
    cells = ['<span class="d"></span>'] * 2          # 10월 1일이 수요일이라 두 칸 비움
    # 흐린 날짜는 두 가지다. 12일 이전은 지난 날, 그 뒤의 몇몇은 남은 자리가
    # 선택한 인원보다 적은 날이다. 아래 안내 문구가 말하는 규칙을 실제로 보인다.
    FULL = {18, 23, 30}
    for d in range(1, 32):
        cls = "d"
        if d < 12 or d in FULL: cls += " no"
        if d == sel: cls += " on"
        cells.append(f'<span class="{cls}">{d}</span>')
    return (f'<div class="cal"><div class="cmon"><b>2026년 10월</b>'
            f'<span style="color:var(--muted);font-size:12px">← →</span></div>'
            f'<div class="cgrid">{dows}{"".join(cells)}</div>'
            f'<p class="chelp">{T["pax_notice"].replace("{pax}","2")}</p></div>')

def field(label, value, placeholder=False, help=None, ic=""):
    cls = "in" if placeholder else "in filled"
    return (f'<div class="f"><label>{label}</label>'
            f'<div class="{cls}">{ic}{value}</div>'
            + (f'<p class="help">{help}</p>' if help else "") + '</div>')

BODY_D = f"""
<div class="wrap"><div class="modal">
  <div class="m-top"><h1>{T['title']}</h1><span class="x">{I_X}</span></div>
  <div class="cols">
    <div class="left">
      <div class="grp">
        <div class="glab"><b>{T['step1']}</b></div>
        <ul class="tours">{tour_items()}</ul>
      </div>
      <div class="grp">
        <div class="glab"><b>{T['step2']}</b></div>
        <div class="pax">
          <div class="pbox"><span>{T['adultPax']}</span><div class="prow">
            <span class="stp">{I_MINUS}</span><b class="n">2</b><span class="stp">{I_PLUS}</span>
          </div></div>
          <div class="pbox"><span>{T['childPax']}</span><div class="prow">
            <span class="stp off">{I_MINUS}</span><b class="n">0</b><span class="stp">{I_PLUS}</span>
          </div></div>
        </div>
      </div>
      <div class="grp">
        <div class="glab"><b>{T['step3']}</b></div>
        {calendar()}
      </div>
      <div class="grp">
        <div class="glab"><b>{T['step4']}</b></div>
        {field(T['hotel_label'], T['hotel_placeholder'], True, T['hotel_helper'])}
        {field(T['pickup_label'], '와이키키 · 하얏트 리젠시 앞', ic=I_PIN)}
        <div class="two" style="margin-top:12px">
          {field(T['name_label'], '김오션')}
          {field(T['email_label'], 'hioceanstar@gmail.com')}
        </div>
        {field(T['phone_label'], 'hioceanstar')}
      </div>
    </div>

    <aside class="side">
      <div class="s-tour"><img src="{TOURS[0][3]}" alt="">
        <b>{TOURS[0][0]}</b></div>
      <ul class="s-list">
        <li><span>날짜</span><b>2026-10-17 (토)</b></li>
        <li><span>시간</span><b>1부 08:00-11:00</b></li>
        <li><span>인원</span><b>성인 2 · 아동 0</b></li>
        <li><span>픽업</span><b>하얏트 리젠시 앞</b></li>
      </ul>
      <div class="s-rule"></div>
      <ul class="s-sum">
        <li><span>{T['adultPax']} 2 × ₩151,570</span><b class="n">₩303,140</b></li>
      </ul>
      <div class="s-total"><span>{T['total_payment']}</span><b class="n">₩303,140</b></div>
      <div class="cur"><a class="on">KRW</a><a>USD</a></div>
      <div class="pay">{T['checkout_btn']} {I_ARROW}</div>
      <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
    </aside>
  </div>
</div></div>
"""

io.open("Modal1.dc.html", "w", encoding="utf-8").write(
    page("시안 1 · 한 장에 다 보기 — 데스크탑", CSS_D, BODY_D, 1440))
print("Modal1.dc.html")


# ───────────────────────────── 모바일 375 ─────────────────────────────
CSS_M = """
.wrap{position:relative;z-index:2;padding:64px 0 0}
.sheet{background:#fff;border-radius:22px 22px 0 0;box-shadow:var(--e3);overflow:hidden}
.m-top{display:flex;align-items:center;justify-content:space-between;
  padding:16px 18px;border-bottom:1px solid var(--line)}
.m-top h1{font-family:'SUIT',system-ui,sans-serif;font-size:17px;font-weight:800;
  color:var(--ink)}
.x{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;color:var(--muted);background:var(--paper)}
.body{padding:20px 18px 24px}
.grp+.grp{margin-top:24px}
.glab b{font-family:'SUIT',system-ui,sans-serif;font-size:14.5px;font-weight:800;
  color:var(--ink);display:block;margin-bottom:11px}

.tours li+li{margin-top:8px}
.t{display:flex;align-items:center;gap:10px;padding:10px;border-radius:14px;
  border:1px solid var(--line);background:#fff;min-height:64px}
.t.on{border-color:var(--ink);background:var(--paper);box-shadow:inset 0 0 0 1px var(--ink)}
.t img{width:44px;height:44px;border-radius:10px;object-fit:cover}
.t .tt{flex:1;min-width:0}
.t b{display:block;font-size:12.5px;font-weight:700;color:var(--ink);line-height:1.35}
.t i{display:block;font-style:normal;font-size:11px;color:var(--muted);margin-top:3px}
.t em{font-style:normal;font-family:'SUIT',system-ui,sans-serif;font-size:13px;
  font-weight:800;color:var(--ink);white-space:nowrap}

.pax{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pbox{border:1px solid var(--line);border-radius:14px;padding:11px 12px}
.pbox span{display:block;font-size:12px;font-weight:700;color:var(--text)}
.prow{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.stp{width:44px;height:44px;border-radius:50%;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff}
.stp.off{color:#9AA0A6}
.prow b{font-family:'SUIT',system-ui,sans-serif;font-size:19px;font-weight:800;color:var(--ink)}

.cal{border:1px solid var(--line);border-radius:14px;padding:12px 12px 14px}
.cmon{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.cmon b{font-family:'SUIT',system-ui,sans-serif;font-size:13.5px;font-weight:800;color:var(--ink)}
.cgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;text-align:center}
.cgrid .dow{font-size:10.5px;font-weight:700;color:var(--muted);padding:3px 0 5px}
.cgrid .d{height:38px;display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:600;color:var(--ink);border-radius:10px}
/* 비활성 날짜도 읽혀야 한다. 흐리게만 두면 며칠이 마감인지 알 수 없어
   '인원에 맞는 날짜만 활성화' 라는 규칙 자체가 전달되지 않는다.
   회색은 읽히는 값으로 올리고, 못 고르는 날이라는 건 취소선이 말한다. */
.cgrid .d.no{color:var(--muted);text-decoration:line-through;text-decoration-thickness:1px}
.cgrid .d.on{background:var(--ink);color:#fff;font-weight:800}
.chelp{margin-top:9px;font-size:11px;color:var(--muted);line-height:1.5}

.f+.f{margin-top:12px}
.f label{display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px}
.f .in{min-height:48px;border:1px solid var(--line);border-radius:12px;background:#fff;
  display:flex;align-items:center;gap:8px;padding:0 13px;font-size:13.5px;color:var(--muted)}
.f .in.filled{color:var(--ink);font-weight:600}
.f .help{margin-top:6px;font-size:11px;color:var(--muted);line-height:1.5}

/* 금액을 늘 보이게 하는 바. 실제로는 화면 아래에 고정돼 스크롤과 무관하게
   남는다. 보드는 정지 화면이라 여기서는 문서 끝에 놓아 모양만 보인다. */
.bar{position:relative;background:#fff;border-top:1px solid var(--line);
  box-shadow:0 -10px 24px rgba(16,20,24,.08);padding:12px 18px 16px}
.bline{display:flex;align-items:baseline;justify-content:space-between}
.bline span{font-size:13px;font-weight:700;color:var(--text)}
.bline b{font-family:'SUIT',system-ui,sans-serif;font-size:24px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.bsub{margin-top:2px;font-size:11.5px;color:var(--muted)}
.cur{display:flex;gap:6px;margin-top:10px}
.cur a{flex:1;height:44px;border-radius:99px;border:1px solid var(--line);background:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;
  color:var(--muted)}
.cur a.on{background:var(--ink);border-color:var(--ink);color:#fff}
.pay{margin-top:10px;height:52px;border-radius:99px;background:var(--ink);color:#fff;
  display:flex;align-items:center;justify-content:center;gap:9px;
  font-size:15px;font-weight:800;font-family:'SUIT',system-ui,sans-serif}
.safe{display:flex;gap:7px;margin-top:10px;font-size:11px;color:var(--muted);line-height:1.5}
.safe svg{margin-top:1px}
"""

def tour_items_m(sel=0):
    out=[]
    for i,(name,when,price,img) in enumerate(TOURS):
        out.append(f'<li><div class="t{" on" if i==sel else ""}"><img src="{img}" alt="">'
                   f'<span class="tt"><b>{name}</b><i>{when}</i></span><em>{price}</em></div></li>')
    return "".join(out)

BODY_M = f"""
<div class="wrap"><div class="sheet">
  <div class="m-top"><h1>{T['title']}</h1><span class="x">{I_X}</span></div>
  <div class="body">
    <div class="grp"><div class="glab"><b>{T['step1']}</b></div>
      <ul class="tours">{tour_items_m()}</ul></div>
    <div class="grp"><div class="glab"><b>{T['step2']}</b></div>
      <div class="pax">
        <div class="pbox"><span>{T['adultPax']}</span><div class="prow">
          <span class="stp">{I_MINUS}</span><b class="n">2</b><span class="stp">{I_PLUS}</span>
        </div></div>
        <div class="pbox"><span>{T['childPax']}</span><div class="prow">
          <span class="stp off">{I_MINUS}</span><b class="n">0</b><span class="stp">{I_PLUS}</span>
        </div></div>
      </div></div>
    <div class="grp"><div class="glab"><b>{T['step3']}</b></div>{calendar()}</div>
    <div class="grp"><div class="glab"><b>{T['step4']}</b></div>
      {field(T['hotel_label'], T['hotel_placeholder'], True, T['hotel_helper'])}
      {field(T['pickup_label'], '와이키키 · 하얏트 리젠시 앞', ic=I_PIN)}
      {field(T['name_label'], '김오션')}
      {field(T['email_label'], 'hioceanstar@gmail.com')}
      {field(T['phone_label'], 'hioceanstar')}
    </div>
  </div>
  <div class="bar">
    <div class="bline"><span>{T['total_payment']}</span><b class="n">₩303,140</b></div>
    <p class="bsub">{TOURS[0][0]} · 2026-10-17 (토) · 성인 2</p>
    <div class="cur"><a class="on">KRW</a><a>USD</a></div>
    <div class="pay">{T['checkout_btn']} {I_ARROW}</div>
    <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
  </div>
</div></div>
"""

io.open("Modal1_M.dc.html","w",encoding="utf-8").write(
    page("시안 1 · 한 장에 다 보기 — 모바일", CSS_M, BODY_M, 375))
print("Modal1_M.dc.html")
