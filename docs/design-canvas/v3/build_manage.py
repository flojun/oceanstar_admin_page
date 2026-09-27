# -*- coding: utf-8 -*-
"""내 예약 관리 페이지 보드(한/영). 데스크탑 1440 · 모바일 375, 화면 셋.

운영 중인 사이트(src/components/booking/ManageBookingClient.tsx, 문구는 locales 의
manage.*)의 흐름을 그대로 옮겼다.
  1. 조회 — 예약 번호(영숫자 6자리) + 예약 때 쓴 이메일 (/api/verify-booking)
  2. 상세 — 상태 · 투어 · 날짜(D-day) · 인원 · 픽업. 투어 7일 전(하와이 시각)까지는
     날짜 · 픽업 장소를 수수료 없이 직접 바꾼다(/api/reschedule, 관리자 확인 후 확정).
     7일 안쪽이면 변경 버튼 자리에 카카오톡 문의가 선다.
  3. 취소 — 환불 규정 확인 · 동의 후 취소 요청(/api/cancel). 지금 사이트는 규정 창과
     최종 확인 창이 두 번 뜨는데, 여기서는 한 창에 '지금 취소하면 얼마 돌려받는지'를
     먼저 크게 보이고 동의 체크 → 요청 한 번으로 줄였다.

보드의 예약은 보기용이다(예약번호 · 이름 · 날짜 모두 지어낸 값, 오늘 = 2026-09-27).
꼴은 상세페이지(build_detail.py)의 토큰 · 내비 · 푸터 · 폰트 서브셋을 그대로 쓴다.
"""
import io, os
import build_detail as D          # 불러오면 상세 보드도 다시 찍힌다(결과는 같다)
import _detail_ko, _detail_en

HERE = D.HERE
icon, I_ARROW, PI = D.icon, D.I_ARROW, D.PERK_ICONS
LANG = "ko"

I_CHECK = icon('<path d="M5 12.5l4.2 4.2L19 7"></path>', 16, 2.2)
I_X = icon('<path d="M6 6l12 12M18 6L6 18"></path>', 18, 2)
I_LEFT = icon('<path d="M15 5l-7 7 7 7"></path>', 16, 2)
I_RIGHT = icon('<path d="M9 5l7 7-7 7"></path>', 16, 2)
I_PIN = D.I_PIN
I_CLOCK = D.I_CLOCK
I_CHAT = icon('<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1'
              ' 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z"></path>', 18, 1.8)
I_SHIELD = icon('<path d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6z"></path>'
                '<path d="M8.8 12.2l2.2 2.2 4.4-4.6"></path>', 18, 1.8)
I_SWAP = icon('<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"></path>', 18, 1.8)
I_ALERT = icon('<path d="M12 4l9 16H3z"></path><path d="M12 10v4.5M12 17.2v.3"></path>', 18, 1.8)

TX = {
    "ko": dict(
        hero_alt="와이키키 바다에 떠 있는 오션스타 보트",
        h1='내 <span class="hl">예약 관리</span>',
        sub="예약을 확인하고, 날짜 · 픽업 장소를 바꾸거나 취소할 수 있어요.",
        # 조회
        f_h="예약 조회", f_p="예약 정보 보호를 위해 예약 번호와 이메일을 입력해 주세요.",
        res_num="예약 번호 (영숫자 6자리)", res_ph="예: MA7MY5", email="이메일 주소",
        email_ph="예약 시 입력한 이메일", submit="예약 조회하기",
        f_help="예약 번호는 예약 확정 후 받으신 바우처(메일 · 카카오톡)에 있어요.",
        f_lost="예약 번호를 잊으셨나요?", f_lost_a="카카오톡으로 문의",
        can_h="여기서 할 수 있는 일",
        can=[("cal", "날짜 · 픽업 장소 변경", "투어 7일 전까지 수수료 없이 직접 바꿀 수 있어요."),
             ("check", "예약 상태 확인", "예약확정 · 취소요청 같은 진행 상황을 바로 봐요."),
             ("guide", "예약 취소", "규정을 확인하고 바로 취소를 요청할 수 있어요.")],
        rule_h="취소 · 환불 규정", rule_note="하와이 현지 시각 기준",
        # 상세
        bk_no="예약 번호", status="예약확정", dday="D-20",
        rows=[("투어", "와이키키 거북이 스노클링 · 1부"),
              ("날짜", '2026년 10월 17일 (토) <span class="mg-mt">투어 20일 전</span>'),
              ("인원", "성인 2명"),
              ("픽업", '하얏트 리젠시 앞 <span class="mg-mt">07:30 픽업</span>'),
              ("예약자", "김오션")],
        act_h="예약 변경 · 취소",
        notice='<b>10월 10일(토)까지</b> 날짜와 픽업 장소를 수수료 없이 직접 바꿀 수 있어요.',
        notice_s="그 뒤로는 카카오톡 채널로 문의해 주세요. (하와이 현지 시각 기준)",
        resched_btn="날짜 · 픽업 장소 변경", cancel_link="예약 취소",
        within_h="투어 7일 안쪽이면", within_p="변경 버튼 대신 카카오톡 문의 버튼이 보여요.",
        kakao="카카오톡으로 문의",
        # 일정 변경
        rs_h="날짜 · 픽업 장소 변경", rs_p="바꿀 것만 고르세요. 관리자 확인 후 최종 확정됩니다.",
        date_h="새로운 투어 날짜", month="2026년 10월", dows="일월화수목금토",
        legend=[("cur", "지금 예약일"), ("sel", "새로 고른 날"), ("off", "휴무 (일요일)")],
        pick_h="픽업 장소", hotel_label="머무시는 숙소 (구글 자동완성)",
        hotel="하얏트 리젠시 와이키키 비치 리조트",
        rec_b="하얏트 리젠시 앞", rec_s="걸어서 약 2분 · 1부 07:30 픽업",
        rec_tag="가까운 픽업 장소",
        sum_h="변경 내용", before="10월 17일 (토)", after="10월 24일 (토)",
        pick_same="픽업 장소는 그대로 (하얏트 리젠시 앞)",
        back="돌아가기", submit_rs="변경 신청하기",
        # 취소
        c_h="예약 취소", c_p="취소 전에 아래 환불 규정을 꼭 확인해 주세요.",
        c_now="지금 취소하면 · 투어 20일 전", c_big="전액 환불",
        refund=[("여행 7일 전까지", "전액 환불", "ok"), ("여행 6~3일 전", "요금의 50% 공제", "mid"),
                ("여행 2일 전 ~ 당일", "취소 · 환불 불가", "no")],
        c_rule="여행일은 하와이 현지 시각 기준입니다. 본 상품은 국외여행 표준약관 제6조(특약)에 따라 "
               "일반 소비자분쟁해결기준과 다른 취소수수료가 적용됩니다.",
        agree="위 규정을 확인했고, 취소에 동의합니다.",
        c_go="취소 요청하기", c_final="취소 요청은 되돌릴 수 없어요. 관리자 확인 후 처리됩니다.",
        close="닫기", k_look="조회", k_detail="상세 · 일정 변경", k_cancel="취소 창", suffix=""),
    "en": dict(
        hero_alt="OceanStar boat on the sea off Waikiki",
        h1='Manage <span class="hl">my booking</span>',
        sub="Check your booking, change the date or pickup, or cancel.",
        f_h="Find your booking", f_p="Please enter your booking number and email to protect your information.",
        res_num="Booking Number (6 Alphanumerics)", res_ph="e.g., MA7MY5", email="Email Address",
        email_ph="Email entered during booking", submit="Search Booking",
        f_help="Your booking number is on the voucher we sent after confirmation (email or WhatsApp).",
        f_lost="Forgot your booking number?", f_lost_a="Email us",
        can_h="What you can do here",
        can=[("cal", "Change date or pickup", "Free of charge, up to 7 days before your tour."),
             ("check", "Check your status", "See whether it is confirmed or a cancellation is pending."),
             ("guide", "Cancel your booking", "Review the policy and request a cancellation.")],
        rule_h="Cancellation & refund", rule_note="Based on Hawaii time",
        bk_no="Booking number", status="Confirmed", dday="D-20",
        rows=[("Tour", "Waikiki Turtle Snorkeling · Session 1"),
              ("Date", 'Sat, Oct 17, 2026 <span class="mg-mt">20 days left</span>'),
              ("Guests", "2 adults"),
              ("Pickup", 'Hyatt Regency (front) <span class="mg-mt">07:30 pickup</span>'),
              ("Booker", "John Doe")],
        act_h="Change or cancel",
        notice='You can change the date and pickup yourself, free of charge, <b>until Sat, Oct 10</b>.',
        notice_s="After that, please contact us via KakaoTalk or WhatsApp. (Hawaii time)",
        resched_btn="Change date or pickup", cancel_link="Cancel booking",
        within_h="Within 7 days of the tour", within_p="a contact button replaces the change button.",
        kakao="Contact us",
        rs_h="Change date or pickup", rs_p="Pick only what you want to change. It is final after our team confirms.",
        date_h="New tour date", month="October 2026", dows="SMTWTFS",
        legend=[("cur", "Current date"), ("sel", "New date"), ("off", "Closed (Sunday)")],
        pick_h="Pickup location", hotel_label="Your hotel (Google autocomplete)",
        hotel="Hyatt Regency Waikiki Beach Resort",
        rec_b="Hyatt Regency (front)", rec_s="About a 2 minute walk · Session 1 pickup 07:30",
        rec_tag="Closest pickup",
        sum_h="Your change", before="Sat, Oct 17", after="Sat, Oct 24",
        pick_same="Pickup stays the same (Hyatt Regency, front)",
        back="Go back", submit_rs="Request change",
        c_h="Cancel booking", c_p="Please review the refund policy below before you cancel.",
        c_now="If you cancel now · 20 days before", c_big="Full refund",
        refund=[("7+ days before", "100% refund", "ok"), ("3-6 days before", "50% refund", "mid"),
                ("2 days or less", "No refund", "no")],
        c_rule="Tour dates are based on local Hawaii time.",
        agree="I have read the policy above and agree to cancel.",
        c_go="Request cancellation", c_final="A cancellation request can't be undone. Our team will process it after review.",
        close="Close", k_look="조회", k_detail="상세 · 일정 변경", k_cancel="취소 창", suffix=" · 영문"),
}


def t(k):
    return TX[LANG][k]


def hero(mobile):
    return f"""<section class="hero mg-hero">
  <img src="private_boat.webp" alt="{t("hero_alt")}" class="hero-img">
  <span class="veil"></span>
  {D.nav(mobile, active=-1)}
  <div class="hero-in">
    <h1>{t("h1")}</h1>
    <p class="mg-sub">{t("sub")}</p>
  </div>
</section>"""


def refund_rows(now=None):
    return "".join(f'<div class="rf-c {c}{" here" if c == now else ""}"><span>{w}</span><b>{v}</b></div>'
                   for w, v, c in t("refund"))


# ── 1. 조회 ─────────────────────────────────────────────────────────────
def lookup(mobile):
    form = f"""<form class="card look rise">
  <h2>{t("f_h")}</h2><p class="card-p">{t("f_p")}</p>
  <div class="fld"><label>{t("res_num")}</label>
    <input class="oid" placeholder="{t("res_ph")}" maxlength="6" aria-label="{t("res_num")}"></div>
  <div class="fld"><label>{t("email")}</label>
    <input type="email" placeholder="{t("email_ph")}" aria-label="{t("email")}"></div>
  <a href="#" class="book-pill go">{t("submit")}</a>
  <p class="help">{t("f_help")}</p>
  <p class="lost">{t("f_lost")} <a href="#">{t("f_lost_a")} {I_ARROW}</a></p>
</form>"""
    cans = "".join(f'<li><span class="ic">{PI[k]}</span><div><b>{h}</b><span>{s}</span></div></li>'
                   for k, h, s in t("can"))
    side = f"""<aside class="card side rise">
  <h3>{t("can_h")}</h3><ul class="cans">{cans}</ul>
  <div class="mini"><div class="mini-h"><b>{t("rule_h")}</b><span>{t("rule_note")}</span></div>
    <div class="refund">{refund_rows()}</div></div>
</aside>"""
    return f'<section class="mg-body look-w">{form}{side}</section>'


# ── 2. 상세 ─────────────────────────────────────────────────────────────
def summary():
    rows = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in t("rows"))
    return f"""<article class="card sum rise">
  <div class="sum-h"><div><span class="lab">{t("bk_no")}</span><b class="bno">MA7MY5</b></div>
    <div class="tags"><span class="st">{I_CHECK}{t("status")}</span><span class="dd">{t("dday")}</span></div></div>
  <dl class="rows">{rows}</dl>
</article>"""


def actions(open_):
    return f"""<aside class="card act rise">
  <h3>{t("act_h")}</h3>
  <p class="note">{I_CLOCK}<span>{t("notice")}<small>{t("notice_s")}</small></span></p>
  <a href="#" class="book-pill rs{" on" if open_ else ""}">{I_SWAP}{t("resched_btn")}</a>
  <a href="#" class="cx">{t("cancel_link")}</a>
  <div class="within"><b>{t("within_h")}</b> {t("within_p")}
    <span class="line-pill ghost">{I_CHAT}{t("kakao")}</span></div>
</aside>"""


def calendar():
    offset, days = 4, 31                       # 2026-10-01 은 목요일
    cells = [f'<span class="dow">{d}</span>' for d in t("dows")]
    cells += ['<span class="blank"></span>'] * offset
    for d in range(1, days + 1):
        dow = (offset + d - 1) % 7
        cls = "off" if dow == 0 else ("cur" if d == 17 else ("sel" if d == 24 else ""))
        cells.append(f'<span class="d {cls}">{d}</span>')
    legend = "".join(f'<span class="lg {k}"><i></i>{v}</span>' for k, v in t("legend"))
    return (f'<div class="cal"><div class="cal-h"><b>{t("month")}</b>'
            f'<span class="cal-n"><button aria-label="prev">{I_LEFT}</button>'
            f'<button aria-label="next">{I_RIGHT}</button></span></div>'
            f'<div class="cal-g">{"".join(cells)}</div><div class="legend">{legend}</div></div>')


def resched():
    return f"""<section class="card rsp rise">
  <div class="rsp-h"><h2>{t("rs_h")}</h2><p class="card-p">{t("rs_p")}</p></div>
  <div class="rsp-g">
    <div><h3 class="sub-h">{I_CLOCK}{t("date_h")}</h3>{calendar()}</div>
    <div>
      <h3 class="sub-h">{I_PIN}{t("pick_h")}</h3>
      <div class="fld"><label>{t("hotel_label")}</label><input value="{t("hotel")}" aria-label="{t("hotel_label")}"></div>
      <div class="rec"><span class="tag">{t("rec_tag")}</span><b>{I_PIN}{t("rec_b")}</b><span>{t("rec_s")}</span></div>
      <div class="chg"><span class="chg-h">{t("sum_h")}</span>
        <div class="chg-r"><s>{t("before")}</s>{I_RIGHT}<b>{t("after")}</b></div>
        <span class="chg-s">{t("pick_same")}</span></div>
      <div class="btns"><a href="#" class="line-pill">{t("back")}</a>
        <a href="#" class="book-pill">{t("submit_rs")}</a></div>
    </div>
  </div>
</section>"""


def detail(mobile, open_=True):
    top = f'<section class="mg-body det-w">{summary()}{actions(open_)}</section>'
    return top + (f'<div class="mg-body">{resched()}</div>' if open_ else "")


# ── 3. 취소 창 ───────────────────────────────────────────────────────────
def cancel_modal(mobile):
    grab = '<span class="grab"></span>' if mobile else ""
    return (f'<div class="dim"></div><div class="modal{" sheet" if mobile else ""}" role="dialog" aria-label="{t("c_h")}">'
            f'{grab}<div class="m-h"><h2>{t("c_h")}</h2><button class="m-x" aria-label="{t("close")}">{I_X}</button></div>'
            f'<div class="m-b"><p class="card-p">{t("c_p")}</p>'
            f'<div class="now"><span>{t("c_now")}</span><b>{t("c_big")}</b></div>'
            f'<div class="refund">{refund_rows("ok")}</div>'
            f'<p class="rf-note">{t("c_rule")}</p>'
            f'<label class="agree"><span class="box on">{I_CHECK}</span>{t("agree")}</label>'
            f'<div class="m-btns"><a href="#" class="line-pill">{t("back")}</a>'
            f'<a href="#" class="danger">{t("c_go")}</a></div>'
            f'<p class="final">{I_ALERT}{t("c_final")}</p></div></div>')


CSS_COMMON = """
.mg-sub{color:rgba(255,255,255,.9)}
.card{background:#fff;border:1px solid var(--line);border-radius:22px}
.card h2{line-height:1.25}
.card-p{color:var(--text)}
.fld label{display:block;margin-bottom:8px;font-size:14.5px;font-weight:700;color:var(--ink)}
.fld input{width:100%;height:54px;padding:0 16px;border:1px solid #CFCCC4;border-radius:14px;background:#fff;
  font:inherit;font-size:16px;color:var(--ink)}
.fld input::placeholder{color:#6B7076}
.fld input.oid{font-family:'SUIT',system-ui,sans-serif;font-weight:800;letter-spacing:.24em;text-transform:uppercase}
.fld input.oid::placeholder{font-family:'Pretendard',system-ui,sans-serif;font-weight:400;letter-spacing:0;text-transform:none}
.look .book-pill.go,.btns .book-pill,.act .book-pill{justify-content:center;padding:0 24px}
.book-pill svg{width:auto;height:auto;padding:0;background:none;color:#fff}
.help{font-size:14px;line-height:1.65;color:var(--muted)}
.lost{font-size:14.5px;font-weight:600;color:var(--text)}
.lost a{display:inline-flex;align-items:center;gap:4px;font-weight:700;color:var(--sea-d)}
.cans li{display:flex;align-items:flex-start;gap:14px}
.cans .ic{flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:13px;
  background:var(--soft);color:var(--sea)}
.cans div{display:flex;flex-direction:column;gap:3px}
.cans b{font-size:16px;color:var(--ink)}
.cans div span{font-size:14.5px;line-height:1.6;color:var(--text)}
.mini{border-top:1px solid var(--line)}
.mini-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.mini-h b{font-size:15.5px;color:var(--ink)}
.mini-h span{font-size:13px;font-weight:600;color:var(--muted)}
.refund{display:grid;border:1px solid var(--line);border-radius:14px;overflow:hidden}
.rf-c{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--paper)}
.rf-c + .rf-c{border-top:1px solid var(--line)}
.rf-c span{font-size:14px;font-weight:700;color:var(--muted)}
.rf-c b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;letter-spacing:-.02em;text-align:right}
.rf-c.ok b{color:var(--sea-d)} .rf-c.mid b{color:var(--ink)} .rf-c.no b{color:var(--food-d)}
.rf-c.here{background:#E4F3F8;box-shadow:inset 3px 0 0 var(--sea-d)}
.rf-c.here span{color:var(--deep)}
/* 상세 */
.sum-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line)}
.lab{display:block;font-size:13px;font-weight:700;color:var(--muted)}
.bno{display:block;margin-top:4px;font-family:'SUIT',system-ui,sans-serif;font-weight:800;letter-spacing:.18em;color:var(--ink)}
.tags{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.st,.dd{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px;border-radius:999px;
  font-size:13.5px;font-weight:700;white-space:nowrap}
.st{background:#E4F3F8;color:var(--sea-d)}
.dd{background:var(--ink);color:#fff;font-family:'SUIT',system-ui,sans-serif;font-weight:800}
.rows div{display:grid;border-top:1px solid var(--line)}
.rows div:first-child{border-top:0}
.rows dt{font-size:14.5px;font-weight:700;color:var(--muted)}
.rows dd{font-weight:700;color:var(--ink);line-height:1.5}
.mg-mt{display:inline-block;margin-left:6px;font-size:14px;font-weight:600;color:var(--sea-d)}
.act h3{font-size:20px}
.note{display:flex;align-items:flex-start;gap:10px;border-radius:14px;background:var(--paper);color:var(--ink);line-height:1.65}
.note svg{flex:none;margin-top:3px;color:var(--sea-d)}
.note b{color:var(--ink)}
.note small{display:block;margin-top:4px;font-size:13.5px;color:var(--text)}
.book-pill.rs{gap:8px}
.book-pill.rs.on{background:var(--sea-d)}
.cx{align-self:center;font-size:14.5px;font-weight:700;color:var(--text);text-decoration:underline;
  text-underline-offset:4px;text-decoration-color:#C9C6BE}
.within{border-top:1px dashed var(--line);font-size:13.5px;line-height:1.6;color:var(--muted)}
.within b{color:var(--text)}
.line-pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;
  border:1px solid #CFCCC4;background:#fff;font-weight:700;color:var(--ink);white-space:nowrap}
.line-pill.ghost{display:flex;margin-top:10px;height:44px;font-size:14px;color:var(--text);border-style:dashed}
/* 일정 변경 */
.rsp{border-color:var(--sea-d);box-shadow:0 0 0 3px rgba(30,157,196,.12)}
.sub-h{display:flex;align-items:center;gap:8px;font-size:17px}
.sub-h svg{color:var(--sea-d)}
.cal{border:1px solid var(--line);border-radius:18px}
.cal-h{display:flex;align-items:center;justify-content:space-between}
.cal-h b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;color:var(--ink)}
.cal-n{display:flex;gap:6px}
.cal-n button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);
  border-radius:50%;background:#fff;color:var(--ink)}
.cal-g{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}
.cal-g .dow{font-size:12.5px;font-weight:700;color:var(--muted)}
.cal-g .d{display:flex;align-items:center;justify-content:center;margin:0 auto;border-radius:12px;
  font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
.cal-g .d.off{color:#B5B2AA;text-decoration:line-through}
.cal-g .d.cur{box-shadow:inset 0 0 0 2px var(--sea-d);color:var(--sea-d)}
.cal-g .d.sel{background:var(--ink);color:#fff}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;font-weight:600;color:var(--text)}
.lg{display:inline-flex;align-items:center;gap:6px}
.lg i{width:14px;height:14px;border-radius:4px}
.lg.cur i{box-shadow:inset 0 0 0 2px var(--sea-d)} .lg.sel i{background:var(--ink)}
.lg.off i{background:#E2E0DA}
.rec{display:grid;gap:4px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
.rec .tag{justify-self:start;height:24px;padding:0 9px;display:inline-flex;align-items:center;border-radius:999px;
  background:#E4F3F8;font-size:12.5px;font-weight:700;color:var(--sea-d)}
.rec b{display:flex;align-items:center;gap:6px;font-size:16px;color:var(--ink)}
.rec b svg{color:var(--sea-d)}
.rec > span:last-child{font-size:14px;color:var(--text)}
.chg{border-radius:14px;background:var(--ink);color:#fff}
.chg-h{display:block;font-size:13px;font-weight:700;color:rgba(255,255,255,.7)}
.chg-r{display:flex;align-items:center;gap:10px;margin-top:6px}
.chg-r s{color:rgba(255,255,255,.6);font-weight:600}
.chg-r b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;font-size:19px}
.chg-r svg{color:var(--sky)}
.chg-s{display:block;margin-top:6px;font-size:13.5px;color:rgba(255,255,255,.78)}
.btns{display:grid;grid-template-columns:1fr 1.6fr;gap:10px}
/* 취소 창 */
.board-modal{position:relative;overflow:hidden}
.dim{position:absolute;inset:0;background:rgba(16,20,24,.58);z-index:20}
.modal{position:absolute;z-index:21;background:#fff;overflow:hidden}
.m-h{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.m-x{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:0;
  border-radius:50%;background:var(--soft);color:var(--ink)}
.m-b{display:flex;flex-direction:column}
.now{display:flex;flex-direction:column;gap:4px;border-radius:16px;background:#E4F3F8}
.now span{font-size:13.5px;font-weight:700;color:var(--deep)}
.now b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;letter-spacing:-.02em;color:var(--sea-d)}
.rf-note{font-size:13.5px;line-height:1.7;color:var(--muted)}
.agree{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:14px;
  font-size:15px;font-weight:700;color:var(--ink)}
.box{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;
  border:1.5px solid #CFCCC4;color:transparent}
.box.on{background:var(--ink);border-color:var(--ink);color:#fff}
.m-btns{display:grid;grid-template-columns:1fr 1.4fr;gap:10px}
.danger{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:var(--food-d);
  color:#fff;font-weight:700}
.final{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;line-height:1.6;color:var(--text)}
.final svg{flex:none;margin-top:1px;color:var(--food-d)}
"""

CSS_MD = """
.mg-hero{height:400px}
.mg-hero .hero-img{object-position:50% 58%}
.mg-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.45) 0,rgba(9,16,22,.2) 110px,rgba(9,16,22,0) 170px),
  linear-gradient(100deg,rgba(9,16,22,.74) 0%,rgba(9,16,22,.5) 36%,rgba(9,16,22,.12) 66%,rgba(9,16,22,.04) 100%)}
.mg-hero .hero-in{top:150px;text-shadow:0 1px 14px rgba(9,16,22,.4)}
.mg-hero .hero-in h1{margin-top:0;font-size:56px}
.mg-sub{margin-top:14px;font-size:19px;line-height:1.7}
.mg-body{position:relative;z-index:6;padding:0 var(--pad)}
.look-w,.det-w{display:grid;grid-template-columns:1fr 420px;gap:20px;align-items:start;margin-top:-64px}
.card h2{font-size:28px}
.card-p{margin-top:8px;font-size:16px;line-height:1.7}
.look{display:flex;flex-direction:column;gap:20px;padding:36px 40px}
.look .card-p{margin-top:-12px}
.look .book-pill.go{height:56px;font-size:16.5px}
.side{display:flex;flex-direction:column;gap:22px;padding:30px 30px 28px}
.side h3{font-size:19px}
.cans{display:flex;flex-direction:column;gap:18px}
.mini{padding-top:20px;display:flex;flex-direction:column;gap:12px}
.rf-c{padding:12px 16px}
.rf-c b{font-size:16px}
.sum{padding:30px 34px 20px}
.sum-h{padding-bottom:22px}
.bno{font-size:30px}
.rows div{grid-template-columns:120px 1fr;gap:16px;padding:17px 0}
.rows dd{font-size:17px}
.act{display:flex;flex-direction:column;gap:16px;padding:28px 28px 24px}
.note{padding:16px 16px;font-size:15px}
.act .book-pill{height:54px;font-size:16px}
.within{padding-top:16px}
.rsp{margin-top:20px;padding:32px 36px 34px}
.rsp-g{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:26px}
.rsp-g > div{display:flex;flex-direction:column;gap:16px}
.cal{padding:18px 20px 16px}
.cal-n button{width:36px;height:36px}
.cal-g{margin-top:12px;row-gap:6px}
.cal-g .dow{padding:6px 0}
.cal-g .d{width:48px;height:42px;font-size:15.5px}
.legend{margin-top:12px}
.rec{padding:14px 16px}
.chg{padding:16px 18px}
.btns .line-pill,.btns .book-pill{height:54px;font-size:16px}
.board-modal{height:860px}
.modal{left:50%;top:64px;width:540px;transform:translateX(-50%);border-radius:24px}
.m-h{padding:20px 24px 18px 28px}
.m-h h2{font-size:22px}
.m-b{gap:16px;padding:22px 28px 26px}
.now{padding:16px 18px}
.now b{font-size:28px}
.agree{padding:14px 16px}
.m-btns .line-pill,.danger{height:54px;font-size:16px}
"""

CSS_MM = """
.mg-hero{height:360px}
.mg-hero .hero-img{object-position:62% 50%}
.mg-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.6) 0%,rgba(9,16,22,.45) 60%,rgba(9,16,22,.25) 100%)}
.mg-hero .hero-in{top:112px;text-align:center;text-shadow:0 1px 14px rgba(9,16,22,.45)}
.mg-hero .hero-in h1{margin-top:0;font-size:38px}
.mg-sub{margin:12px auto 0;max-width:28ch;font-size:16px;line-height:1.7;text-wrap:balance}
.mg-body{position:relative;z-index:6;padding:0 var(--pad)}
.look-w,.det-w{display:flex;flex-direction:column;gap:14px;margin-top:-72px}
.card h2{font-size:24px}
.card-p{margin-top:6px;font-size:15.5px;line-height:1.7}
.look{display:flex;flex-direction:column;gap:18px;padding:26px 20px}
.look .card-p{margin-top:-10px}
.look .book-pill.go{height:56px;font-size:16.5px}
.side{display:flex;flex-direction:column;gap:20px;padding:24px 20px}
.side h3{font-size:18px}
.cans{display:flex;flex-direction:column;gap:16px}
.mini{padding-top:18px;display:flex;flex-direction:column;gap:12px}
.rf-c{padding:12px 14px}
.rf-c b{font-size:15.5px}
.sum{padding:22px 20px 10px}
.sum-h{padding-bottom:18px}
.bno{font-size:26px}
.tags{flex-direction:column;align-items:flex-end}
.rows div{grid-template-columns:64px 1fr;gap:12px;padding:14px 0}
.rows dd{font-size:16px}
.mg-mt{display:block;margin:2px 0 0}
.act{display:flex;flex-direction:column;gap:14px;padding:22px 20px 20px}
.note{padding:14px;font-size:15px}
.act .book-pill{height:56px;font-size:16px}
.within{padding-top:14px}
.rsp{margin-top:14px;padding:24px 18px 22px}
.rsp-g{display:flex;flex-direction:column;gap:28px;margin-top:20px}
.rsp-g > div{display:flex;flex-direction:column;gap:14px}
.cal{padding:14px 8px 14px}
.cal-n button{width:40px;height:40px}
.cal-g{margin-top:10px;row-gap:4px}
.cal-g .dow{padding:6px 0}
.cal-g .d{width:36px;height:40px;font-size:15px}
.legend{margin-top:10px;padding:0 4px}
.rec{padding:14px}
.chg{padding:16px}
.btns .line-pill,.btns .book-pill{height:56px;font-size:16px}
.board-modal{height:812px}
.modal.sheet{left:0;right:0;bottom:0;top:64px;border-radius:24px 24px 0 0}
.grab{display:block;width:40px;height:5px;margin:10px auto 0;border-radius:3px;background:#D6D3CC}
.m-h{padding:8px 16px 14px 22px}
.m-h h2{font-size:20px}
.m-b{gap:14px;padding:18px 22px 24px}
.now{padding:14px 16px}
.now b{font-size:24px}
.agree{padding:14px;font-size:14.5px}
.m-btns .line-pill,.danger{height:54px;font-size:15.5px}
"""


def page(mobile, kind):
    if kind == "look":
        return hero(mobile) + lookup(mobile) + D.foot()
    if kind == "detail":
        return hero(mobile) + detail(mobile, True) + D.foot()
    body = hero(mobile) + detail(mobile, False)
    return f'<div class="board-modal">{body}{cancel_modal(mobile)}</div>'


def build(mobile, kind, lang):
    global LANG
    LANG = lang
    D.C = _detail_en if lang == "en" else _detail_ko     # 내비 · 푸터 문구도 같은 언어로
    css = (D.CSS_M if mobile else D.CSS_D) + CSS_COMMON + (CSS_MM if mobile else CSS_MD)
    label = {"look": t("k_look"), "detail": t("k_detail"), "cancel": t("k_cancel")}[kind]
    title = f"내 예약 관리 · {label}{t('suffix')} — {'모바일' if mobile else '데스크탑'}"
    html = f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>{title}</title>
  <style>{D.fonts()}{css}
  </style>
</helmet>
<div class="page manage">
{D.bind_su(page(mobile, kind))}
</div>
</x-dc>
</body>
</html>
"""
    stem = {"look": "Manage", "detail": "ManageDetail", "cancel": "ManageCancel"}[kind]
    name = f"{stem}{'En' if lang == 'en' else 'Ko'}{'_M' if mobile else ''}.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<24} {len(html):>7} bytes")
    return name


KINDS = ("look", "detail", "cancel")
OUT = [build(m, k, "ko") for k in KINDS for m in (False, True)]
D.embed_fonts_exact(OUT)
OUT_EN = [build(m, k, "en") for k in KINDS for m in (False, True)]
D.embed_fonts_en(OUT_EN)
D.C = _detail_ko
