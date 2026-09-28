# -*- coding: utf-8 -*-
"""폰 더보기(≡) 메뉴를 연 화면(한/영). 모바일 375 한 장씩.

폰 머리에서 '내 예약 관리' 알약을 뺐다(운영자 요청). 머리엔 로고 · 언어 · 더보기만 남고,
'내 예약 관리'는 이 메뉴 안에서 설명과 함께 한 줄로 크게 보인다.
메뉴 항목은 운영 중인 사이트의 폰 메뉴(ReservationClientPage.tsx: Home · 투어 · 고객후기 · FAQ)에
리뉴얼에서 새로 생긴 페이지(맛집 추천, 투어 상세 다섯)를 더했다.
뒤 화면은 거북이 스노클링 상세 첫 화면을 어둡게 깔아 '열린 메뉴'임을 보인다.
"""
import io, os
import build_detail as D          # 불러오면 상세 보드도 다시 찍힌다(결과는 같다)
import _detail_ko, _detail_en

HERE = D.HERE
icon, I_ARROW = D.icon, D.I_ARROW
LANG = "ko"

I_X = icon('<path d="M6 6l12 12M18 6L6 18"></path>', 20, 2)
I_TICKET = icon('<path d="M4 7.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13'
                'A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"></path><path d="M14 6.5v11" stroke-dasharray="1.6 2"></path>', 22, 1.7)
I_CHEV = icon('<path d="M9 5l7 7-7 7"></path>', 16, 2)
I_CHAT = icon('<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1'
              ' 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z"></path>', 16, 1.8)

TX = {
    "ko": dict(aria="메뉴", close="메뉴 닫기", langs=("한국어", "EN"), on=0,
               links=["Home", "투어", "고객후기", "FAQ", "맛집 추천"],
               tours=["거북이 스노클링", "선셋 거북이 스노클링", "스노클링 + 패러 · 제트", "프라이빗 크루즈", "서핑 레슨"],
               mg_h="내 예약 관리", mg_p="예약 확인 · 날짜 변경 · 취소",
               book="투어 예약하기", contact="카카오톡 문의", hours="하와이 현지 기준 월~토 09:00~17:00",
               title="모바일 메뉴 (더보기) 열림"),
    "en": dict(aria="Menu", close="Close menu", langs=("한국어", "EN"), on=1,
               links=["Home", "Tours", "Reviews", "FAQ", "Food picks"],
               tours=["Turtle Snorkeling", "Sunset Turtle Snorkeling", "Snorkel + Parasail / Jet Ski",
                      "Private Cruise", "Surf Lesson"],
               mg_h="Manage My Booking", mg_p="Check, change or cancel",
               book="Book a Tour", contact="Email us", hours="Mon - Sat 09:00 - 17:00, Hawaii time",
               title="모바일 메뉴 (더보기) 열림 · 영문"),
}


def t(k):
    return TX[LANG][k]


def drawer():
    on = ' class="on"'
    langs = "".join(f'<a href="#"{on if i == t("on") else ""}>{x}</a>' for i, x in enumerate(t("langs")))
    tours = "".join(f'<li><a href="#">{x}</a></li>' for x in t("tours"))
    links = []
    for i, x in enumerate(t("links")):
        if i == 1:
            links.append(f'<li class="grp"><a href="#" class="lk">{x}</a><ul class="sub">{tours}</ul></li>')
        else:
            links.append(f'<li><a href="#" class="lk">{x}</a></li>')
    contact = (f'<a href="http://pf.kakao.com/_yxfcExj">{I_CHAT}{t("contact")}</a>' if LANG == "ko"
               else f'<a href="mailto:hioceanstar@gmail.com">{I_CHAT}{t("contact")}</a>')
    return (f'<div class="dim"></div><nav class="drawer" aria-label="{t("aria")}">'
            f'<div class="dr-h"><span class="seg">{langs}</span>'
            f'<button class="dr-x" aria-label="{t("close")}">{I_X}</button></div>'
            f'<ul class="links">{"".join(links)}</ul>'
            f'<a href="#" class="mg"><span class="ic">{I_TICKET}</span><span class="mg-t"><b>{t("mg_h")}</b>'
            f'<span>{t("mg_p")}</span></span>{I_CHEV}</a>'
            f'<div class="dr-f"><a href="#" class="book-pill">{t("book")} {I_ARROW}</a>'
            f'<p class="ct">{contact}<span>{t("hours")}</span></p></div></nav>')


CSS = """
.board-menu{position:relative;height:812px;overflow:hidden}
.dim{position:absolute;inset:0;z-index:20;background:rgba(9,16,22,.55)}
.drawer{position:absolute;z-index:21;top:0;right:0;bottom:0;width:318px;background:#fff;display:flex;flex-direction:column;
  padding:14px 20px 24px;box-shadow:-18px 0 40px rgba(9,16,22,.18)}
.dr-h{display:flex;align-items:center;justify-content:space-between}
.seg{display:inline-flex;padding:4px;border-radius:999px;background:var(--soft)}
.seg a{display:inline-flex;align-items:center;height:36px;padding:0 14px;border-radius:999px;font-size:14px;font-weight:700;color:var(--text)}
.seg a.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(16,20,24,.12)}
.dr-x{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border:0;border-radius:50%;
  background:var(--soft);color:var(--ink)}
.links{margin-top:18px}
.links > li + li{border-top:1px solid var(--line)}
.lk{display:flex;align-items:center;min-height:52px;font-family:'SUIT',system-ui,sans-serif;font-size:20px;font-weight:800;
  color:var(--ink);letter-spacing:-.02em}
.sub{margin:-4px 0 10px;padding-left:14px;border-left:2px solid var(--sky)}
.sub a{display:flex;align-items:center;min-height:36px;font-size:15px;font-weight:600;color:var(--text)}
.mg{display:flex;align-items:center;gap:12px;margin-top:14px;padding:14px 14px 14px 12px;border-radius:16px;background:#E4F3F8}
.mg .ic{flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;
  background:#fff;color:var(--sea-d)}
.mg-t{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.mg-t b{font-size:16.5px;color:var(--ink)}
.mg-t span{font-size:13.5px;color:var(--text)}
.mg > svg{color:var(--sea-d)}
.dr-f{margin-top:auto;display:flex;flex-direction:column;gap:14px}
.dr-f .book-pill{justify-content:center;height:54px;font-size:16px}
.ct{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px;color:var(--muted)}
.ct a{display:inline-flex;align-items:center;gap:6px;font-size:14.5px;font-weight:700;color:var(--ink)}
"""


def build(lang):
    global LANG
    LANG = lang
    D.C = _detail_en if lang == "en" else _detail_ko
    css = D.CSS_M + CSS
    under = D.hero(True)
    html = f"""<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>{t("title")}</title>
  <style>{D.fonts()}{css}
  </style>
</helmet>
<div class="page">
<div class="board-menu">{D.bind_su(under)}{drawer()}</div>
</div>
</x-dc>
</body>
</html>
"""
    name = f"Menu{'En' if lang == 'en' else 'Ko'}_M.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")
    return name


D.embed_fonts_exact([build("ko")])
D.embed_fonts_en([build("en")])
D.C = _detail_ko
