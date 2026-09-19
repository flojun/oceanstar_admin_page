# -*- coding: utf-8 -*-
"""예약 모달 시안이 함께 쓰는 뼈대 - 폰트 · 토큰 · 공통 부품.

문구는 전부 src/locales/ko.ts 의 bookingModal 값 그대로다. 상품과 가격은
시안 B 비교표와 같은 값을 쓴다. 지어낸 문구는 없다.
"""
import io, re, os

HERE = os.path.dirname(os.path.abspath(__file__))

def fonts():
    s = io.open(os.path.join(HERE, "SianB.dc.html"), encoding="utf-8").read()
    return re.search(r'/\*__FONTS__\*/.*?/\*__FONTS_END__\*/', s, re.S).group(0)

TOKENS = """
:root{
  --ink:#101418; --paper:#F6F5F2; --soft:#EFEDE8; --sky:#7FD4E8; --sea:#1E9DC4;
  --deep:#0D5C7A; --food:#D2591A;
  --text:#4A4F55; --muted:#646A70; --line:#E2E0DA;
  --e1:0 2px 8px rgba(16,20,24,.05), 0 16px 40px rgba(16,20,24,.08);
  --e2:0 8px 22px rgba(16,20,24,.10), 0 30px 70px rgba(16,20,24,.16);
  --e3:0 24px 60px rgba(16,20,24,.22), 0 60px 140px rgba(16,20,24,.28);
}
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,h4,p,ul,li,figure{margin:0;padding:0}
ul{list-style:none}
a{text-decoration:none;color:inherit}
img{display:block;max-width:100%}
svg{flex:none}
.n{font-variant-numeric:tabular-nums}
.hd{font-family:'SUIT',system-ui,sans-serif}
"""

# ko.ts bookingModal 그대로
T = dict(
    title="투어 예약",
    step1="투어 선택", step2="인원 입력", step3="날짜 선택", step4="예약 정보 입력",
    totalPax="총 탑승 인원", adultPax="성인", childPax="아동 (만3-6세)",
    pax_notice="선택하신 {pax}명 인원에 맞춰 예약 가능한 날짜만 활성화됩니다.",
    hotel_label="숙소입력 (가장 가까운 픽업 장소 자동 추천)",
    hotel_placeholder="머무시는 숙소/호텔 주소 입력",
    hotel_helper="※ 구글 자동완성으로 숙소를 치시면 가장 가까운 장소를 추천해 드립니다.",
    pickup_label="픽업 장소 선택",
    pickup_placeholder="가까운 장소가 추천되거나 직접 골라주세요",
    name_label="예약자 성함(한국어)",
    email_label="이메일 (바우처 수신용)",
    phone_label="연락처 (카카오톡 ID 또는 연락처)",
    total_payment="총 결제 금액", checkout_btn="결제하기",
    safe_notice="안전하게 온라인 예약이 완료되며 현장 결제는 지원하지 않습니다.",
)

# 시안 B 비교표와 같은 상품·가격
TOURS = [
    ("와이키키 거북이 스노클링",              "1부 08:00-11:00 · 2부 11:00-14:00", "₩151,570", "turtle.jpg"),
    ("선셋·와인 & 와이키키 거북이 스노클링",   "시즌별 시간 변동",                   "₩206,690", "sunset.jpg"),
    ("거북이 스노클링 + 패러세일링 / 제트스키", "패러/제트 9:30-2:00",               "₩289,360", "parasail.jpg"),
    ("[단독] 프라이빗 와이키키 거북이 스노클링", "1~4인 기준 (인원별 상이) / 팀",      "₩2,066,850 ~", "board.jpg"),
    ("거북이 스노클링 + 서핑",                "[운영 시간 확정 필요]",              "₩261,018", "surf.jpg"),
]

def icon(path, size=18, sw=1.7, fill="none"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{path}</svg>')

I_X      = icon('<path d="M6 6l12 12M18 6L6 18"></path>', 20)
I_CHECK  = icon('<path d="M4 12.5l5 5L20 6.5"></path>', 16, 2.2)
I_ARROW  = icon('<path d="M7 17L17 7M17 7H9M17 7v8"></path>', 15)
I_RIGHT  = icon('<path d="M9 6l6 6-6 6"></path>', 16, 2)
I_LEFT   = icon('<path d="M15 6l-6 6 6 6"></path>', 16, 2)
I_MINUS  = icon('<path d="M5 12h14"></path>', 16, 2)
I_PLUS   = icon('<path d="M12 5v14M5 12h14"></path>', 16, 2)
I_LOCK   = icon('<path d="M6 10V8a6 6 0 0 1 12 0v2"></path>'
                '<rect x="4" y="10" width="16" height="10" rx="2.5"></rect>', 14)
I_PIN    = icon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>'
                '<circle cx="12" cy="10" r="2.6"></circle>', 16)


# 성인 2명 기준 총액. 1인 요금이 아니라 실제 낼 돈으로 고르게 한다.
# Baymard: 한 장이냐 여러 단계냐보다 무엇을 얼마나 묻느냐가 전환을 가른다.
TOTALS = {
    0: ("\u20a9303,140",     "1인 \u20a9151,570"),
    1: ("\u20a9413,380",     "1인 \u20a9206,690"),
    2: ("\u20a9578,720",     "1인 \u20a9289,360"),
    3: ("\u20a92,066,850 ~", "팀 단위 · 인원별 상이"),
    4: ("[원화 정가 확정 필요]", "1인 \u20a9261,018 상당"),
}

# 숙소 한 칸에서 픽업 장소가 따라 나온다. ko.ts 의 hotel_helper 가 이미
# '가장 가까운 장소를 추천해 드립니다' 라고 약속하므로, 픽업을 따로 고르게
# 하는 칸은 그 약속을 스스로 부정하는 칸이다. 결과로 보여 주고 고칠 길만 남긴다.
PICK_CSS = """
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
"""

def pick_row(place="와이키키 하얏트 리젠시 앞"):
    return (f'<div class="pick">{I_PIN}'
            f'<span class="pk"><i>픽업 장소</i><u>{place}</u></span>'
            f'<a>다른 곳으로</a></div>')


def page(title, css, body, width, bg="rgba(16,20,24,.58)"):
    return f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>{title}</title>
  <style>{fonts()}{TOKENS}
.page{{width:{width}px;background:#0E1418;position:relative;overflow:hidden;
  font-family:'Pretendard',system-ui,sans-serif;color:var(--text);word-break:keep-all;
  -webkit-font-smoothing:antialiased}}
/* 뒤에 깔리는 페이지. 모달이 무엇 위에 뜨는지 보이라고 히어로를 눌러 깐다. */
.behind{{position:absolute;inset:0;background:url(hero_waikiki.jpg) center/cover}}
.scrim{{position:absolute;inset:0;background:{bg}}}
{css}
  </style>
</helmet>
<div class="page">
  <span class="behind"></span><span class="scrim"></span>
{body}
</div>
</x-dc>
</body>
</html>
"""
