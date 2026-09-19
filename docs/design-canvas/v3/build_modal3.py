# -*- coding: utf-8 -*-
"""시안 3 - 카드에서 바로. 상품을 이미 들고 들어와 4단계를 2단계로 줄인다.

추천 프로그램 카드의 '예약하기' 를 눌러 들어오면 어떤 투어인지는 이미
정해져 있다. 지금 모달은 그 상태에서도 1단계에서 상품을 다시 고르게 한다.
그 단계를 없애고, 남은 것을 '언제 · 몇 명' 과 '예약 정보' 둘로 묶었다.
"""
import io, sys
sys.path.insert(0, ".")
from _modal_base import (T, TOURS, page, I_X, I_ARROW, I_MINUS, I_PLUS, I_LOCK,
                         I_PIN, I_LEFT)

NAME, WHEN, PRICE, IMG = TOURS[0]

CSS = """
.wrap{position:relative;z-index:2;display:flex;%(wrap)s}
.col{display:flex;flex-direction:column;align-items:center;gap:12px}
.cap{font-family:'SUIT',system-ui,sans-serif;font-size:%(cap)dpx;font-weight:800;
  color:rgba(255,255,255,.92)}
/* 데스크탑은 오른쪽에서 밀려 나오는 서랍, 모바일은 아래에서 올라오는 시트다.
   둘 다 페이지를 가리지 않고 옆(아래)에 붙어, 고르던 카드가 계속 보인다. */
.panel{width:%(pw)dpx;background:#fff;box-shadow:var(--e3);overflow:hidden;
  border-radius:%(pr)s;display:flex;flex-direction:column}
.p-top{display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid var(--line)}
.p-top h1{font-family:'SUIT',system-ui,sans-serif;font-size:16.5px;font-weight:800;color:var(--ink)}
.x{width:44px;height:44px;border-radius:50%%;display:flex;align-items:center;
  justify-content:center;color:var(--muted);background:var(--paper)}
.body{padding:18px 20px 20px;flex:1}

/* 이미 고른 상품. 다시 고르게 하지 않고, 바꿀 길만 작게 남긴다. */
.chosen{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;
  background:var(--soft)}
.chosen img{width:54px;height:54px;border-radius:10px;object-fit:cover}
.chosen .ct{flex:1;min-width:0}
.chosen b{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:14px;
  font-weight:800;color:var(--ink);line-height:1.35}
.chosen i{display:block;font-style:normal;font-size:11.5px;color:var(--muted);margin-top:4px}
/* 링크지만 손가락으로 누르는 것이라 글자 크기가 아니라 타깃 크기를 맞춘다. */
.chg{display:flex;align-items:center;min-height:44px;padding:0 6px;
  font-size:12.5px;font-weight:700;color:var(--ink);text-decoration:underline;
  text-underline-offset:3px;white-space:nowrap}

.lab{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:13.5px;
  font-weight:800;color:var(--ink);margin:20px 0 10px}
.pax{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pbox{border:1px solid var(--line);border-radius:14px;padding:11px 13px}
.pbox span{display:block;font-size:12px;font-weight:700;color:var(--text)}
.prow{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.stp{width:44px;height:44px;border-radius:50%%;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff}
.stp.off{color:#9AA0A6}
.prow b{font-family:'SUIT',system-ui,sans-serif;font-size:19px;font-weight:800;color:var(--ink)}

/* 달력 한 장을 펼치지 않고 가까운 날짜만 띠로 민다. 여행자는 보통 이번 주
   안에서 고르고, 띠는 달력보다 세로를 훨씬 덜 먹는다. */
.strip{display:flex;gap:7px;overflow-x:auto;padding-bottom:10px}
/* 보드의 다른 가로 스크롤러와 같은 규칙 - 막대만 남기고 화살표는 없앤다. */
.strip::-webkit-scrollbar{height:6px}
.strip::-webkit-scrollbar-button{display:none;width:0;height:0}
.strip::-webkit-scrollbar-track{border-radius:99px;background:rgba(16,20,24,.12)}
.strip::-webkit-scrollbar-thumb{border-radius:99px;background:var(--ink)}
@supports not selector(::-webkit-scrollbar){
  .strip{scrollbar-width:thin;scrollbar-color:var(--ink) rgba(16,20,24,.12)}
}
.day{flex:0 0 auto;width:52px;height:64px;border-radius:14px;border:1px solid var(--line);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  background:#fff}
.day u{text-decoration:none;font-size:11px;font-weight:700;color:var(--muted)}
.day b{font-family:'SUIT',system-ui,sans-serif;font-size:17px;font-weight:800;color:var(--ink)}
.day.on{background:var(--ink);border-color:var(--ink)}
.day.on u{color:rgba(255,255,255,.7)}.day.on b{color:#fff}
/* 비활성 날짜도 읽혀야 한다. 흐리게만 두면 며칠이 마감인지 알 수 없어
   '인원에 맞는 날짜만 활성화' 라는 규칙 자체가 전달되지 않는다.
   회색은 읽히는 값으로 올리고, 못 고르는 날이라는 건 취소선이 말한다. */
.day.no u{color:var(--muted)}
.day.no b{color:var(--muted);text-decoration:line-through;text-decoration-thickness:1px}
.dhelp{margin-top:9px;font-size:11.5px;color:var(--muted);line-height:1.5}

.f+.f{margin-top:12px}
.f label{display:block;font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px}
.f .in{min-height:46px;border:1px solid var(--line);border-radius:12px;background:#fff;
  display:flex;align-items:center;gap:8px;padding:0 13px;font-size:13.5px;color:var(--muted)}
.f .in.filled{color:var(--ink);font-weight:600}
.f .help{margin-top:6px;font-size:11.5px;color:var(--muted);line-height:1.5}

.foot{border-top:1px solid var(--line);padding:14px 20px 18px;background:#fff}
.fline{display:flex;align-items:baseline;justify-content:space-between}
.fline span{font-size:13px;font-weight:700;color:var(--text)}
.fline b{font-family:'SUIT',system-ui,sans-serif;font-size:23px;font-weight:800;color:var(--ink)}
.fsub{margin-top:3px;font-size:11.5px;color:var(--muted)}
.cur{display:flex;gap:6px;margin-top:10px}
.cur a{flex:1;height:44px;border-radius:99px;border:1px solid var(--line);background:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted)}
.cur a.on{background:var(--ink);border-color:var(--ink);color:#fff}
.row{display:flex;gap:9px;margin-top:11px}
.back{height:52px;padding:0 18px;border-radius:99px;border:1px solid var(--line);
  display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:var(--ink);background:#fff}
.go{flex:1;height:52px;border-radius:99px;background:var(--ink);color:#fff;
  display:flex;align-items:center;justify-content:center;gap:9px;
  font-size:15px;font-weight:800;font-family:'SUIT',system-ui,sans-serif}
.safe{display:flex;gap:7px;margin-top:10px;font-size:11px;color:var(--muted);line-height:1.5}
"""

DAYS = [("금",16,""),("토",17,"on"),("일",18,"no"),("월",19,""),("화",20,""),
        ("수",21,""),("목",22,""),("금",23,"no"),("토",24,"")]

def strip():
    return "".join(f'<div class="day {c}"><u>{d}</u><b class="n">{n}</b></div>'
                   for d,n,c in DAYS)

def field(label, value, ph=False, help=None, ic=""):
    return (f'<div class="f"><label>{label}</label>'
            f'<div class="{"in" if ph else "in filled"}">{ic}{value}</div>'
            + (f'<p class="help">{help}</p>' if help else "") + "</div>")

def screen1():
    return f"""
<div class="panel">
  <div class="p-top"><h1>{T['title']}</h1><span class="x">{I_X}</span></div>
  <div class="body">
    <div class="chosen"><img src="{IMG}" alt="">
      <span class="ct"><b>{NAME}</b><i>{WHEN} · {PRICE} / 인</i></span>
      <span class="chg">바꾸기</span></div>
    <span class="lab">{T['step2']}</span>
    <div class="pax">
      <div class="pbox"><span>{T['adultPax']}</span><div class="prow">
        <span class="stp">{I_MINUS}</span><b class="n">2</b><span class="stp">{I_PLUS}</span></div></div>
      <div class="pbox"><span>{T['childPax']}</span><div class="prow">
        <span class="stp off">{I_MINUS}</span><b class="n">0</b><span class="stp">{I_PLUS}</span></div></div>
    </div>
    <span class="lab">{T['step3']}</span>
    <div class="strip">{strip()}</div>
    <p class="dhelp">{T['pax_notice'].replace('{pax}','2')}</p>
  </div>
  <div class="foot">
    <div class="fline"><span>{T['total_payment']}</span><b class="n">₩303,140</b></div>
    <p class="fsub">성인 2 × ₩151,570</p>
    <div class="row"><div class="go">다음 {I_ARROW}</div></div>
  </div>
</div>"""

def screen2():
    return f"""
<div class="panel">
  <div class="p-top"><h1>{T['title']}</h1><span class="x">{I_X}</span></div>
  <div class="body">
    <div class="chosen"><img src="{IMG}" alt="">
      <span class="ct"><b>{NAME}</b><i>2026-10-17 (토) · 성인 2</i></span>
      <span class="chg">바꾸기</span></div>
    <span class="lab">{T['step4']}</span>
    {field(T['hotel_label'], T['hotel_placeholder'], True, T['hotel_helper'])}
    {field(T['pickup_label'], '와이키키 · 하얏트 리젠시 앞', ic=I_PIN)}
    {field(T['name_label'], '김오션')}
    {field(T['email_label'], 'hioceanstar@gmail.com')}
    {field(T['phone_label'], 'hioceanstar')}
  </div>
  <div class="foot">
    <div class="fline"><span>{T['total_payment']}</span><b class="n">₩303,140</b></div>
    <div class="cur"><a class="on">KRW</a><a>USD</a></div>
    <div class="row"><div class="back">{I_LEFT} 이전</div>
      <div class="go">{T['checkout_btn']} {I_ARROW}</div></div>
    <p class="safe">{I_LOCK}<span>{T['safe_notice']}</span></p>
  </div>
</div>"""

def build(width, pw, pr, wrap, cap, title, out):
    css = CSS % dict(pw=pw, pr=pr, wrap=wrap, cap=cap)
    body = (f'<div class="col"><p class="cap">1단계 언제 · 몇 명</p>{screen1()}</div>'
            f'<div class="col"><p class="cap">2단계 예약 정보</p>{screen2()}</div>')
    io.open(out,"w",encoding="utf-8").write(page(title, css, f'<div class="wrap">{body}</div>', width))
    print(out)

build(1440, 460, "22px", "justify-content:center;gap:56px;padding:48px 0 84px;align-items:flex-start",
      16, "시안 3 · 카드에서 바로 — 데스크탑", "Modal3.dc.html")
build(375, 339, "22px", "flex-direction:column;align-items:center;gap:26px;padding:30px 0 66px",
      13, "시안 3 · 카드에서 바로 — 모바일", "Modal3_M.dc.html")
