# -*- coding: utf-8 -*-
"""시안 1 예약 창 영문 보드. 한글 보드(build_sian1.py 결과)를 옮김 표로 바꿔 찍는다.

문구는 src/locales/en.ts 의 bookingModal 값을 먼저 쓰고(Select Tour, Enter Passengers,
Booker Name, Checkout, …), 나머지는 같은 말투로 옮겼다. 영문 판은 달러로 보여 주고
통화 전환은 USD 쪽을 켜 둔다(KRW 는 달러 × 1,377.9 로 만든 값이라 되돌리면 정확히 맞다).
옮긴 뒤 화면에 한글이 남으면 멈춘다.
"""
import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

BOARDS = [("Sian1A", "시안 1 · 투어 미선택"), ("Sian1B", "시안 1 · 단품 선택됨"),
          ("Sian1C", "시안 1 · 콤보 · 패러세일링/제트스키"), ("Sian1D", "시안 1 · 콤보 · 서핑")]

MONEY = [("₩1,653,480 ~", "$1,200 ~"), ("₩151,570", "$110"), ("₩206,690", "$150"),
         ("₩289,360", "$210"), ("₩220,460", "$160"), ("₩303,140", "$220"),
         ("₩440,920", "$320"), ("₩578,720", "$420")]

# 긴 것부터. 날짜는 요일 글자보다 먼저 바꾼다.
REPL = [
    ("투어를 고르면 날짜와 금액이 여기에 쌓입니다.\n        인원을 넣으면 실제 결제 금액이 계산됩니다.",
     "Your dates and price build up here once you pick a tour.\n        Add passengers to see the actual total."),
    ("※ 구글 자동완성으로 숙소를 치시면 가장 가까운 장소를 추천해 드립니다.",
     "* Type your hotel into Google autocomplete and we will suggest the closest pickup spot."),
    ("※ 픽업 장소가 스노클링과 다를 수 있어 숙소를 한 번 더 확인합니다.",
     "* Pickup may differ from snorkeling, so we ask for your hotel again."),
    ("패러세일링 · 스노클링 10-17 (토), 패러세일링 10-20 (화)",
     "Parasailing · Snorkeling Sat, Oct 17 · Parasailing Tue, Oct 20"),
    ("와이키키 거북이 스노클링 · 2026-10-17 (토) 성인 2명",
     "Waikiki Turtle Snorkeling · Sat, Oct 17, 2026 · 2 adults"),
    ("안전하게 온라인 예약이 완료되며 현장 결제는 지원하지 않습니다.",
     "Safe online booking is completed; on-site payments are not supported."),
    ("숙소주소 입력 (주소 입력시 가장 가까운 픽업장소 자동 추천)",
     "Your hotel (we suggest the nearest pickup point)"),
    ("서핑 · 스노클링 10-17 (토), 서핑 10-21 (수)",
     "Surfing · Snorkeling Sat, Oct 17 · Surfing Wed, Oct 21"),
    ("1부 07:30-11:30 · 2부 10:30-14:30", "Session 1 07:30-11:30<br>Session 2 10:30-14:30"),   # 영문은 길어 2부에서 줄을 나눈다
    ("성인 2명 기준으로 10월에 고를 수 있는 날짜는", "For 2 adults, the dates you can pick in October:"),
    ("※ 서핑의 운휴 요일은 아직 받지 못했습니다.", "* We don't have the surf closing days yet."),
    ("지금은 스노클링과 같은 날만 막아 두었습니다.", "For now only the snorkeling date is blocked."),
    ("[단독] 프라이빗 와이키키 거북이 스노클링", "[Private] Waikiki Turtle Snorkeling Trip"),
    ("거북이 스노클링 + 패러세일링 / 제트스키", "Turtle Snorkeling + Parasailing / Jet Ski"),
    ("거북이 스노클링 + 패러세일링 + 제트스키", "Turtle Snorkeling + Parasailing + Jet Ski"),
    ("<i>2시간</i>", "<i>2 hours</i>"),   # 단독 · 인원은 이름 [Private] 과 오른쪽 팀 요금에 이미 있어 뺐다
    ("선셋·와인 &amp; 와이키키 거북이 스노클링", "Sunset &amp; Wine Waikiki Turtle Snorkeling"),
    ("선셋·와인 & 와이키키 거북이 스노클링", "Sunset & Wine Waikiki Turtle Snorkeling"),
    ("서핑 하루 5회 07:30-14:30", "Surfing 5 times a day 07:30-14:30"),
    ("연락처 (카카오톡 ID 또는 연락처)", "Contact Number (Phone or WhatsApp)"),
    ("하얏트 리젠시 와이키키 비치 리조트", "Hyatt Regency Waikiki Beach Resort"),
    ("두 활동이 서로 다른 날에 열립니다", "The two activities run on different days"),
    ("투어를 고르면 금액이 계산됩니다.", "Pick a tour to see the price."),
    ("거북이 스노클링 + 제트 스키", "Turtle Snorkeling + Jet Ski"),
    ("거북이 스노클링 + 패러세일링", "Turtle Snorkeling + Parasailing"),
    ("같은 날은 고를 수 없습니다.", "the same day can't be picked."),
    ("표시한 10월 17일입니다.", "is October 17."),
    ("패러/제트 9:30-2:00", "Parasail/Jet 9:30-2:00"),
    ("2026-10-17 (토)", "Sat, Oct 17, 2026"),
    ("와이키키 하얏트 리젠시 앞", "Hyatt Regency Waikiki (front)"),
    ("거북이 스노클링 시간 선택", "Choose a snorkeling session"),
    ("1부 07:30-11:30", "Session 1 07:30-11:30"),
    ("[운영 시간 확정 필요]", "[Hours to be confirmed]"),
    ("[아동 요금 확정 필요]", "[Child fare to be confirmed]"),
    ("와이키키 거북이 스노클링", "Waikiki Turtle Snorkeling"),
    ("이메일 (바우처 수신용)", "Email (For receiving vouchers)"),
    ("거북이 스노클링 + 서핑", "Turtle Snorkeling + Surfing"),
    ("패러세일링 ($210)", "Parasailing ($210)"),
    ("10-17 (토) 1부", "Sat, Oct 17 · Session 1"),
    ("패러세일링 / 제트스키", "Parasailing / Jet Ski"),
    ("팀 요금 · 1-10명", "Team fare · 1-10 guests"),
    ("활동마다 따로 받습니다", "Asked separately for each activity"),
    ("투어를 먼저 골라주세요", "Please pick a tour first"),
    ("주말 및 공휴일 불가", "No weekends or public holidays"),
    ("예약자 성함(한국어)", "Booker Name"),
    ("성인 2 · 아동 0", "2 adults · 0 children"),
    ("콤보 세부 옵션 선택", "Choose a combo option"),
    ("아동 (만3-6세)", "Child (Age 3-6)"),
    ("24개월 미만 무료", "Under 24 months free"),
    ("시즌별 시간 변동", "Time varies by season"),
    ("10-20 (화)", "Tue, Oct 20"), ("10-21 (수)", "Wed, Oct 21"),
    ("하얏트 리젠시 앞", "Hyatt Regency (front)"),
    ("패러세일링 날짜", "Parasailing date"), ("패러세일링 픽업", "Parasailing pickup"),
    ("픽업 포함 시간", "Times include pickup"),
    ("예약 정보 입력", "Enter Booking Info"),
    ("스노클링 날짜와", "On the snorkeling date,"),
    ("성인 1인 기준", "Price per adult"),
    ("스노클링 날짜", "Snorkeling date"), ("스노클링 픽업", "Snorkeling pickup"),
    ("총 결제 금액", "Total Payment"),
    ("예약자 정보", "Booker details"), ("날짜와 픽업", "Dates and pickup"),
    ("다른 곳으로", "Change"), ("서핑 픽업", "Surfing pickup"), ("서핑 날짜", "Surfing date"),
    ("서핑 강습", "Surf lesson"), ("거북이 스노클링", "Turtle snorkeling"),
    ("인원 입력", "Enter Passengers"), ("날짜 선택", "Select Date"), ("투어 선택", "Select Tour"),
    ("투어 예약", "Tour Booking"), ("픽업 장소", "Pickup"), ("결제하기", "Checkout"),
    ("성인 1인", "Per adult"),
    ("2026년", "2026"), ("10월", "October"),
    ("달력에서", "Marked"), ("✕ 로", "✕ on the calendar"), ("입니다.", "."),
    ("17개", "17"), ("바꾸기", "Change"), ("김오션", "John Doe"),
    ("성인 2 ×", "2 adults ×"),
    ("<span>시간</span>", "<span>Session</span>"), ("<span>인원</span>", "<span>Guests</span>"),
    ("<span>옵션</span>", "<span>Option</span>"), ("<span>픽업</span>", "<span>Pickup</span>"),
    ("<span>날짜</span>", "<span>Date</span>"),
    ('"1부"', '"Session 1"'), (">1부<", ">Session 1<"), (">2부<", ">Session 2<"),
    (">성인<", ">Adult<"), (">1부 ", ">Session 1 "), (">2부 ", ">Session 2 "),
]
DOW = dict(zip("일월화수목금토", ["S", "M", "T", "W", "T", "F", "S"]))


def translate(body):
    for a, b in MONEY + REPL:
        body = body.replace(a, b)
    body = re.sub(r'(<span class="dow">)([일월화수목금토])(</span>)', lambda m: m[1] + DOW[m[2]] + m[3], body)
    body = body.replace('<a class="on">KRW</a><a>USD</a>', '<a>KRW</a><a class="on">USD</a>')
    return body


def visible_korean(html):
    body = html[html.index("</helmet>"):]
    body = re.sub(r"<style.*?</style>", "", body, flags=re.S)
    txt = re.findall(r">([^<>]*[가-힣][^<>]*)<", body)
    txt += re.findall(r'(?:alt|placeholder|aria-label|value)="([^"]*[가-힣][^"]*)"', body)
    return sorted(set(t.strip() for t in txt))


OUT = []
for stem, title in BOARDS:
    for mob in (False, True):
        src = f"{stem}{'_M' if mob else ''}.dc.html"
        dst = f"{stem}_EN{'_M' if mob else ''}.dc.html"
        h = io.open(os.path.join(HERE, src), encoding="utf-8").read()
        i = h.index("</helmet>")
        head, body = h[:i], translate(h[i:])
        head = re.sub(r"<title>[^<]*</title>",
                      f"<title>{title} · 영문 — {'모바일' if mob else '데스크탑'}</title>", head, count=1)
        # 영문은 'Session 1' 이 한글 '1부'보다 길어 좁은 칸에서 숫자만 다음 줄로 떨어졌다. 한 줄로 묶는다.
        extra = ".opt span,.opt em{white-space:nowrap}"
        if mob:   # 폰의 두 칸짜리는 한 줄에 다 안 들어가 칸이 화면 밖으로 밀렸다. 이름 위 · 시간 아래로 쌓는다.
            extra += (".opts.two-up{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}"
                      ".two-up .opt{flex-wrap:wrap;row-gap:2px;padding:9px 14px}"
                      ".two-up .opt span{flex:0 0 100%}")
        head = head.replace("</style>", extra + "</style>", 1)
        out = (head + body).replace("<html>", '<html lang="en">', 1)
        left = visible_korean(out)
        assert not left, f"{dst}: 안 옮긴 한글 {left}"
        io.open(os.path.join(HERE, dst), "w", encoding="utf-8").write(out)
        OUT.append(dst)
        print(f"{dst:<22} {len(out):>7} bytes")

import build_detail as D      # 폰트 서브셋 도구(불러오면 상세 보드도 다시 찍힌다)
D.embed_fonts_en(OUT)
