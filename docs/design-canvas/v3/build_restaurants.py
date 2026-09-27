# -*- coding: utf-8 -*-
"""맛집 추천 페이지 보드(한/영). 데스크탑 1440 · 모바일 375.

문안은 운영 중인 사이트의 맛집 페이지(src/app/(ko)/kr/restaurants/page.tsx)를 옮긴
_restaurants.py. 투어를 마친 손님이 배에서 QR 로 여는 페이지라, 인사와 재예약 혜택
(웹사이트 예약 추가 할인 · 재방문/지인추천)을 맨 위에, 친구에게 넘길 QR 을 맨 끝에 둔다.

  - 히어로: 와이키키 시내 · 다이아몬드헤드 사진(FAQ 와 같은 파일 · 다른 자리라 용량이 늘지 않는다)
  - 인사 띠: 오늘 투어 인사 · 웹사이트 예약 추가 할인 · '재방문, 지인추천' 한마디
  - 분류 칩 → 분류마다 가게 카드(이름 · 설명 · 구글 지도 링크). 포케는 주문 팁 카드를 앞에 둔다.
  - 맺음: 마할로 인사 + 문의 버튼, 이 페이지 QR
꼴은 상세페이지(build_detail.py)의 토큰 · 내비 · 푸터 · 폰트 서브셋을 그대로 쓴다.
"""
import io, os
from urllib.parse import quote_plus
import build_detail as D          # 불러오면 상세 보드도 다시 찍힌다(결과는 같다)
import _detail_ko, _detail_en
import _restaurants as R

HERE = D.HERE
icon, I_ARROW, PI = D.icon, D.I_ARROW, D.PERK_ICONS
LANG = "ko"

I_PIN = icon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>'
             '<circle cx="12" cy="10" r="2.6"></circle>', 15, 1.8)
I_CHAT = icon('<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1'
              ' 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z"></path>', 18, 1.8)
I_MAIL = icon('<rect x="3.6" y="5.6" width="16.8" height="12.8" rx="2"></rect>'
              '<path d="M4.4 7l7.6 6 7.6-6"></path>', 18, 1.8)
I_TAG = icon('<path d="M3.8 12.6V4.8a1 1 0 0 1 1-1h7.8l7.6 7.6a1 1 0 0 1 0 1.4l-6.8 6.8a1 1 0 0 1-1.4 0z"></path>'
             '<circle cx="8.3" cy="8.3" r="1.4"></circle>', 22, 1.7)
I_HEART = icon('<path d="M12 20s-7.4-4.4-7.4-10a4.2 4.2 0 0 1 7.4-2.7A4.2 4.2 0 0 1 19.4 10c0 5.6-7.4 10-7.4 10z"></path>', 22, 1.7)
CAT_ICON = {
    "sushi": icon('<path d="M3 12c3-4.5 9-6 14-2l3.6-2.4-1.2 4.4 1.2 4.4L17 14c-5 4-11 2.5-14-2z"></path>'
                  '<circle cx="8" cy="11.2" r=".9" fill="currentColor"></circle>', 22, 1.7),
    "local": icon('<path d="M12 21v-9"></path><path d="M12 12c-1.5-3.5-5-5-8.5-4.2 2.2.4 4.6 1.8 5.6 4.2"></path>'
                  '<path d="M12 12c1.5-3.5 5-5 8.5-4.2-2.2.4-4.6 1.8-5.6 4.2"></path>'
                  '<path d="M12 12c-.4-3.6 1.6-6.6 4.8-7.8-1.6 1.6-2.6 3.8-2.4 6"></path>', 22, 1.7),
    "waikiki": icon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>'
                    '<circle cx="12" cy="10" r="2.6"></circle>', 22, 1.7),
    "poke": PI["bowl"],
    "dessert": icon('<path d="M8 10a4 4 0 1 1 8 0"></path><path d="M7 10h10l-5 11z"></path>', 22, 1.7),
}

TX = {
    "ko": dict(hero_alt="와이키키 시내와 다이아몬드헤드가 보이는 바다",
               h1='오션스타 <span class="hl">하와이 맛집</span>',
               sub="크루들이 직접 다니는 와이키키 · 호놀룰루 맛집을 모았어요.",
               hi_h="오늘 즐거운 투어 되셨길 바랍니다", hi_p="오션스타 많이많이 추천 부탁드립니다 😆",
               deal_h="웹사이트로 예약하면 추가 할인", deal_p="다음 투어는 오션스타 홈페이지에서 예약해 주세요.",
               tell_h="예약 때 이렇게 말씀해 주세요", tell_p='<b>재방문</b> 또는 <b>지인추천</b>',
               book="투어 예약하기", cats_aria="맛집 분류", places="곳", map="지도",
               end_h="하와이에서 더 맛있고 즐거운 여행 되세요", end_p="마할로! 🤙🏻 더 궁금한 점은 카카오톡으로 물어봐 주세요.",
               end_btn="카카오톡 문의", qr_h="친구에게 이 페이지 보내기", qr_p="휴대폰 카메라로 찍으면 바로 열려요.",
               qr_url="https://oceanstarhi.com/kr/restaurants", qr_alt="맛집 추천 페이지 QR 코드",
               k="맛집 추천", suffix=""),
    "en": dict(hero_alt="The sea off Waikiki with the city and Diamond Head",
               h1='OceanStar <span class="hl">food picks</span>',
               sub="Places our crew actually eat at around Waikiki and Honolulu.",
               hi_h="Hope you had a great tour today!", hi_p="Tell your friends about OceanStar.",
               deal_h="Extra discount when you book on our site", deal_p="Book your next tour on the OceanStar website.",
               tell_h="When you book, mention", tell_p='<b>Returning guest</b> or <b>Friend referral</b>',
               book="Book a Tour", cats_aria="Food categories", places="", map="Map",
               end_h="Enjoy great food in Hawaii!", end_p="Mahalo! Questions? Send us an email or give us a call.",
               end_btn="Email Us", qr_h="Share this page", qr_p="Point your phone camera here to open it.",
               qr_url="https://oceanstarhi.com/restaurants", qr_alt="QR code for this page",
               k="맛집 추천", suffix=" · 영문"),
}


def t(k):
    return TX[LANG][k]


def data():
    return R.EN if LANG == "en" else R.KO


def maps(name):
    return "https://www.google.com/maps/search/?api=1&query=" + quote_plus(name.replace("’", "'") + " Honolulu")


def qr_svg():
    """이 페이지 주소의 QR(segno). 없으면 자리만 남긴다."""
    try:
        import segno
    except ImportError:
        return '<span class="qr-miss">QR</span>'
    svg = segno.make(t("qr_url"), error="m").svg_inline(scale=4, border=2, dark="#101418", light="#ffffff")
    return svg.replace("<svg ", f'<svg role="img" aria-label="{t("qr_alt")}" class="qr" ', 1)


def hero(mobile):
    return f"""<section class="hero rs-hero">
  <img src="hero_waikiki.jpg" alt="{t("hero_alt")}" class="hero-img">
  <span class="veil"></span>
  {D.nav(mobile, active=-1)}
  <div class="hero-in">
    <h1>{t("h1")}</h1>
    <p class="rs-sub">{t("sub")}</p>
  </div>
</section>"""


def hello():
    return (f'<section class="hello rise">'
            f'<div class="hi"><b>{t("hi_h")}</b><span>{t("hi_p")}</span></div>'
            f'<div class="perk"><span class="ic">{I_TAG}</span><div><b>{t("deal_h")}</b><span>{t("deal_p")}</span></div></div>'
            f'<div class="perk"><span class="ic">{I_HEART}</span><div><b>{t("tell_h")}</b><span class="say">{t("tell_p")}</span></div></div>'
            f'<a href="#" class="book-pill">{t("book")} {I_ARROW}</a></section>')


def chips():
    on = ' class="on"'
    return (f'<nav class="chips" aria-label="{t("cats_aria")}">' +
            "".join(f'<a href="#{k}"{on if i == 0 else ""}>{CAT_ICON[k]}{title}<span class="n">{len(items)}</span></a>'
                    for i, (k, title, items) in enumerate(data())) + "</nav>")


def card(name, desc):
    d = f"<p>{desc}</p>" if desc else ""
    return (f'<article class="pl"><h3>{name}</h3>{d}'
            f'<a href="{maps(name)}" class="map">{I_PIN}{t("map")}</a></article>')


def sections():
    out = []
    for k, title, items in data():
        tip = ""
        if k == "poke":
            h, a, b = R.POKE_TIP[LANG]
            tip = f'<article class="pl tip"><span class="tip-h">{h}</span><b>{a}</b><p>{b}</p></article>'
        cards = tip + "".join(card(n, d) for n, d in items)
        out.append(f'<section class="cat rise" id="{k}"><div class="cat-h"><span class="ic">{CAT_ICON[k]}</span>'
                   f'<h2>{title}</h2><span class="n">{len(items)}{t("places")}</span></div>'
                   f'<div class="grid">{cards}</div></section>')
    return "".join(out)


def ending():
    btn = (f'<a href="http://pf.kakao.com/_yxfcExj" class="book-pill">{I_CHAT}{t("end_btn")}</a>' if LANG == "ko"
           else f'<a href="mailto:hioceanstar@gmail.com" class="book-pill">{I_MAIL}{t("end_btn")}</a>')
    return (f'<section class="ending rise"><div class="e-l"><h2>{t("end_h")}</h2><p>{t("end_p")}</p>{btn}</div>'
            f'<div class="e-r">{qr_svg()}<div><b>{t("qr_h")}</b><span>{t("qr_p")}</span></div></div></section>')


def page(mobile):
    return (hero(mobile) + hello() + f'<div class="rs-body">{chips()}{sections()}</div>' + ending() + D.foot())


CSS_COMMON = """
.rs-sub{color:rgba(255,255,255,.9)}
.hello{position:relative;z-index:6;background:#fff;border:1px solid var(--line);border-radius:22px;display:grid;align-items:center}
.hi b{display:block;font-family:'SUIT',system-ui,sans-serif;font-weight:800;color:var(--ink);letter-spacing:-.03em;line-height:1.3}
.hi span{display:block;margin-top:6px;color:var(--text)}
.perk{display:flex;align-items:center;gap:14px}
.perk .ic{flex:none;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;
  background:var(--soft);color:var(--sea)}
.perk div{display:flex;flex-direction:column;gap:3px;min-width:0}
.perk b{font-size:16px;color:var(--ink);line-height:1.4}
.perk span{font-size:14.5px;color:var(--text);line-height:1.55}
.perk .say b{display:inline;font-size:inherit;color:var(--sea-d)}
.hello .book-pill{justify-content:center}
.chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.chips a{flex:none;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 18px 0 14px;border-radius:999px;
  background:#fff;border:1px solid var(--line);font-weight:700;color:var(--text);white-space:nowrap}
.chips a svg{width:18px;height:18px;color:var(--sea)}
.chips a .n{font-size:13px;color:var(--muted)}
.chips a.on{background:var(--ink);border-color:var(--ink);color:#fff}
.chips a.on svg{color:var(--sky)}
.chips a.on .n{color:var(--sky-2)}
.cat-h{display:flex;align-items:center;gap:12px}
.cat-h .ic{flex:none;display:flex;align-items:center;justify-content:center;border-radius:14px;background:var(--soft);color:var(--sea)}
.cat-h h2{line-height:1.25}
.cat-h .n{font-weight:700;color:var(--muted)}
.grid{display:grid}
.pl{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:20px}
/* 가게 이름은 거의 영문이라 제목 글꼴(SUIT)의 얇은 영문 대신 본문 글꼴 굵게. */
.pl h3{font-family:'Pretendard',system-ui,sans-serif;font-weight:700;line-height:1.3;letter-spacing:-.01em}
.pl p{color:var(--text);word-break:keep-all;overflow-wrap:anywhere}
.map{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 13px;
  border-radius:999px;background:var(--paper);font-size:13.5px;font-weight:700;color:var(--deep)}
.map svg{color:var(--sea-d)}
.pl.tip{background:var(--ink);border-color:var(--ink);color:#fff}
.tip-h{align-self:flex-start;height:26px;padding:0 10px;display:inline-flex;align-items:center;border-radius:999px;
  background:rgba(255,255,255,.14);font-size:12.5px;font-weight:700;color:var(--sky-2)}
.pl.tip b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;color:#fff;line-height:1.45}
.pl.tip p{color:rgba(255,255,255,.82)}
.ending{background:#fff;border:1px solid var(--line);border-radius:22px;display:grid;align-items:center}
.e-l h2{line-height:1.25}
.e-l p{color:var(--text)}
.e-l .book-pill{justify-content:center;gap:8px}
.e-l .book-pill svg{width:auto;height:auto;padding:0;background:none;color:#fff}
.e-r{display:flex;align-items:center;gap:18px;border-radius:18px;background:var(--paper)}
.e-r .qr{flex:none;border-radius:10px;background:#fff}
.e-r div{display:flex;flex-direction:column;gap:4px}
.e-r b{font-size:16px;color:var(--ink)}
.e-r span{font-size:14px;line-height:1.55;color:var(--text)}
.ending + .foot{margin-top:96px}
"""

CSS_RD = """
.rs-hero{height:440px}
.rs-hero .hero-img{object-position:50% 6%}
.rs-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.42) 0,rgba(9,16,22,.2) 90px,rgba(9,16,22,0) 150px),
  linear-gradient(100deg,rgba(9,16,22,.72) 0%,rgba(9,16,22,.48) 36%,rgba(9,16,22,.12) 64%,rgba(9,16,22,.04) 100%)}
.rs-hero .hero-in{top:156px;text-shadow:0 1px 14px rgba(9,16,22,.4)}
.rs-hero .hero-in h1{margin-top:0;font-size:58px}
.rs-sub{margin-top:14px;font-size:19px;line-height:1.7}
.hello{margin:-70px var(--pad) 0;padding:28px 30px;grid-template-columns:1.25fr 1fr 1fr auto;gap:0 30px}
.hello > * + *{padding-left:30px;border-left:1px solid var(--line)}
.hello > .book-pill{border-left:0;padding:0 24px;height:52px;font-size:15.5px}
.hi b{font-size:22px}
.hi span{font-size:15px}
.rs-body{padding:72px var(--pad) 0}
.cat{margin-top:56px}
.cat-h .ic{width:48px;height:48px}
.cat-h h2{font-size:32px}
.cat-h .n{font-size:16px}
.grid{margin-top:22px;grid-template-columns:repeat(3,1fr);gap:16px}
.pl{min-height:168px;padding:24px 24px 20px;gap:10px}
.pl h3{font-size:21px}
.pl p{font-size:16px;line-height:1.7}
.pl.tip b{font-size:18px}
.ending{margin:112px var(--pad) 0;padding:40px 44px;grid-template-columns:1fr auto;gap:48px}
.e-l h2{font-size:34px}
.e-l p{margin-top:12px;font-size:17px;line-height:1.75}
.e-l .book-pill{margin-top:24px;height:54px;padding:0 28px;font-size:16px}
.e-r{padding:20px 26px 20px 20px;max-width:420px}
.e-r .qr{width:132px;height:132px}
"""

CSS_RM = """
.rs-hero{height:400px}
.rs-hero .hero-img{object-position:62% 0%}
.rs-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.62) 0%,rgba(9,16,22,.46) 60%,rgba(9,16,22,.26) 100%)}
.rs-hero .hero-in{top:108px;text-align:center;text-shadow:0 1px 14px rgba(9,16,22,.45)}
.rs-hero .hero-in h1{margin-top:0;font-size:38px}
.rs-sub{margin:12px auto 0;max-width:28ch;font-size:16px;line-height:1.7;text-wrap:balance}
.hello{margin:-84px var(--pad) 0;padding:22px 20px;gap:16px}
.hello > .perk{padding-top:16px;border-top:1px solid var(--line)}
.hello > .book-pill{height:54px;font-size:16px}
.hi{text-align:center}
.hi b{font-size:20px}
.hi span{font-size:15px}
.rs-body{padding:48px 0 0}
.chips{padding:0 var(--pad) 4px}
.chips::after{content:"";flex:none;width:8px}
.chips a{height:44px;font-size:14.5px}
.cat{margin-top:44px;padding:0 var(--pad)}
.cat-h .ic{width:42px;height:42px;border-radius:12px}
.cat-h h2{font-size:24px}
.cat-h .n{font-size:15px}
.grid{margin-top:16px;gap:10px}
.pl{padding:18px 18px 16px;gap:8px}
.pl h3{font-size:18.5px}
.pl p{font-size:15.5px;line-height:1.7}
.map{margin-top:4px}
.pl.tip b{font-size:16.5px}
.ending{margin:64px var(--pad) 0;padding:28px 20px 20px;gap:24px;text-align:center}
.e-l h2{font-size:25px}
.e-l p{margin-top:10px;font-size:15.5px;line-height:1.75;text-wrap:balance}
.e-l .book-pill{margin-top:20px;height:54px;padding:0 20px;font-size:16px;width:100%}
.e-r{padding:16px;text-align:left}
.e-r .qr{width:104px;height:104px}
.ending + .foot{margin-top:64px}
"""


def build(mobile, lang):
    global LANG
    LANG = lang
    D.C = _detail_en if lang == "en" else _detail_ko     # 내비 · 푸터 문구도 같은 언어로
    css = (D.CSS_M if mobile else D.CSS_D) + CSS_COMMON + (CSS_RM if mobile else CSS_RD)
    title = f"{t('k')}{t('suffix')} — {'모바일' if mobile else '데스크탑'}"
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
<div class="page food">
{D.bind_su(page(mobile))}
</div>
</x-dc>
</body>
</html>
"""
    name = f"Food{'En' if lang == 'en' else 'Ko'}{'_M' if mobile else ''}.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")
    return name


OUT = [build(m, "ko") for m in (False, True)]
D.embed_fonts_exact(OUT)
OUT_EN = [build(m, "en") for m in (False, True)]
D.embed_fonts_en(OUT_EN)
D.C = _detail_ko
