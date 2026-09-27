# -*- coding: utf-8 -*-
"""FAQ 페이지 보드(한/영). 데스크탑 1440 · 모바일 375.

문안은 운영 중인 사이트의 FAQ(src/components/landing/FAQSection.tsx)를 옮긴 _faq.py.
지금 사이트는 분류 탭을 눌러야 그 분류 질문만 보이는데, 여기서는 한 페이지에 모든
분류를 차례로 싣고 왼쪽(폰은 위쪽) 분류 목록으로 건너뛰게 했다. 찾는 질문이 어느 분류에
있는지 몰라도 훑어 내려가며 찾을 수 있다.

  - 히어로: 와이키키 드론 사진(예약 창 배경과 같은 파일이라 캔버스 용량이 늘지 않는다),
    제목 · 검색 칸
  - 먼저 알면 좋은 네 가지: 수영 · 나이 · 환불 · 거북이 보장
  - 질문은 <details> 로 접고 편다. 보드에는 첫 질문과 환불 규정만 펴 둔다.
  - 환불 규정은 줄글 대신 세 칸 표(내용은 원문 그대로)
  - 끝에 문의 띠, 그 아래 공통 푸터

꼴은 상세페이지(build_detail.py)의 토큰 · 내비 · 푸터 · 폰트 서브셋을 그대로 쓴다.
"""
import io, os
import build_detail as D          # 불러오면 상세 보드도 다시 찍힌다(결과는 같다)
import _detail_ko, _detail_en
import _faq

HERE = D.HERE
icon, I_ARROW, PI = D.icon, D.I_ARROW, D.PERK_ICONS
LANG = "ko"

I_SEARCH = icon('<circle cx="11" cy="11" r="6.6"></circle><path d="M16 16l4.2 4.2"></path>', 20, 2)
I_PLUS = icon('<path d="M12 6v12M6 12h12"></path>', 16, 2.2)
I_CHAT = icon('<path d="M12 4.6c-4.6 0-8.2 2.9-8.2 6.5 0 2.3 1.5 4.3 3.8 5.5l-.8 3.2 3.6-2.3c.5.1 1 .1 1.6.1'
              ' 4.6 0 8.2-2.9 8.2-6.5S16.6 4.6 12 4.6z"></path>', 18, 1.8)
I_MAIL = icon('<rect x="3.6" y="5.6" width="16.8" height="12.8" rx="2"></rect>'
              '<path d="M4.4 7l7.6 6 7.6-6"></path>', 18, 1.8)

TX = {
    "ko": dict(hero_alt="와이키키 앞바다에 떠 있는 오션스타 보트와 다이아몬드헤드",
               h1='자주 묻는 <span class="hl">질문</span>',
               sub="예약 전에 가장 많이 물어보시는 것들을 분류별로 모았어요.",
               search="멀미, 픽업, 환불처럼 궁금한 말을 검색해 보세요", search_aria="질문 검색",
               search_m="멀미, 픽업, 환불 검색",
               quick=[("float", "수영 못해도 괜찮아요", "크루가 물속에서 옆에"),
                      ("guide", "만 24개월부터", "보호자와 함께 타요"),
                      ("cal", "7일 전 전액 환불", "하와이 현지 시각 기준"),
                      ("turtle", "거북이 100% 보장", "못 보면 재방문 혜택")],
               quick_aria="먼저 알면 좋은 것", cats="분류", cats_aria="FAQ 분류", unit="개",
               ask_h="원하는 답이 없으신가요?",
               ask_p="카카오톡으로 물어보시면 한국어로 바로 답해 드려요.<br>하와이 현지 기준 월~토 09:00~17:00",
               ask_a="카카오톡 문의", ask_b="이메일 보내기",
               k="FAQ", suffix=""),
    "en": dict(hero_alt="OceanStar boat off Waikiki with Diamond Head behind",
               h1='Questions, <span class="hl">answered</span>',
               sub="What guests ask us most before booking, sorted by topic.",
               search="Search seasickness, pickup, refunds…", search_aria="Search questions",
               search_m="Search pickup, refunds…",
               quick=[("float", "Non-swimmers welcome", "Crew beside you in the water"),
                      ("guide", "Ages 2 and up", "Minors with a guardian"),
                      ("cal", "Full refund 7+ days out", "Based on Hawaii time"),
                      ("turtle", "Turtles guaranteed", "Or a perk next visit")],
               quick_aria="Good to know", cats="Topics", cats_aria="FAQ topics", unit="",
               ask_h="Still have a question?",
               ask_p="Message us and we’ll get back to you quickly.<br>Mon - Sat 09:00 - 17:00, Hawaii time",
               ask_a="Email Us", ask_b="Call +1 808-308-1792",
               k="FAQ", suffix=" · 영문"),
}


def t(k):
    return TX[LANG][k]


def data():
    return _faq.EN if LANG == "en" else _faq.KO


def hero(mobile):
    return f"""<section class="hero fq-hero">
  <img src="hero_waikiki.jpg" alt="{t("hero_alt")}" class="hero-img">
  <span class="veil"></span>
  {D.nav(mobile, active=3)}
  <div class="hero-in">
    <h1>{t("h1")}</h1>
    <p class="fq-sub">{t("sub")}</p>
    <label class="search">{I_SEARCH}<input placeholder="{t("search_m" if mobile else "search")}" aria-label="{t("search_aria")}"></label>
  </div>
</section>"""


def quick():
    cells = "".join(f'<li><span class="ic">{PI[k]}</span><div><b>{h}</b><span>{s}</span></div></li>'
                    for k, h, s in t("quick"))
    return f'<ul class="quick" aria-label="{t("quick_aria")}">{cells}</ul>'


def refund():
    rows = "".join(f'<div class="rf-c {c}"><span>{w}</span><b>{v}</b></div>'
                   for w, v, c in _faq.REFUND_ROWS[LANG])
    return f'<div class="refund">{rows}</div><p class="rf-note">{_faq.REFUND_NOTE[LANG]}</p>'


def qa(q, a, open_):
    body = refund() if a == _faq.REFUND else f"<p>{a}</p>"
    return (f'<details{" open" if open_ else ""}><summary><span class="qm">Q</span>'
            f'<span class="qt">{q}</span><span class="pm">{I_PLUS}</span></summary>'
            f'<div class="ans">{body}</div></details>')


def groups():
    out = []
    for gi, (cat, items) in enumerate(data()):
        rows = "".join(qa(q, a, (gi == 0 and qi == 0) or a == _faq.REFUND)
                       for qi, (q, a) in enumerate(items))
        out.append(f'<section class="grp" id="c{gi}"><div class="grp-h"><h2>{cat}</h2>'
                   f'<span class="n">{len(items)}{t("unit")}</span></div>'
                   f'<div class="qa">{rows}</div></section>')
    return "".join(out)


def cats(mobile):
    on = ' class="on"'
    links = "".join(f'<a href="#c{i}"{on if i == 0 else ""}>{c}'
                    f'<span class="n">{len(items)}</span></a>'
                    for i, (c, items) in enumerate(data()))
    if mobile:
        return f'<nav class="chips" aria-label="{t("cats_aria")}">{links}</nav>'
    return (f'<aside class="cats"><span class="cats-h">{t("cats")}</span>'
            f'<nav aria-label="{t("cats_aria")}">{links}</nav></aside>')


def ask():
    first = (f'<a href="http://pf.kakao.com/_yxfcExj" class="book-pill">{I_CHAT}{t("ask_a")}</a>'
             if LANG == "ko" else
             f'<a href="mailto:hioceanstar@gmail.com" class="book-pill">{I_MAIL}{t("ask_a")}</a>')
    second = (f'<a href="mailto:hioceanstar@gmail.com" class="line-pill">{I_MAIL}{t("ask_b")}</a>'
              if LANG == "ko" else
              f'<a href="tel:+18083081792" class="line-pill">{t("ask_b")}</a>')
    return (f'<section class="ask rise"><div><h2>{t("ask_h")}</h2><p>{t("ask_p")}</p></div>'
            f'<div class="ask-b">{first}{second}</div></section>')


def page(mobile):
    main = (f'<div class="fq-body">{cats(mobile)}<div class="grps">{groups()}</div></div>')
    return hero(mobile) + quick() + main + ask() + D.foot()


CSS_COMMON = """
.fq-sub{color:rgba(255,255,255,.9)}
.search{display:flex;align-items:center;gap:12px;background:#fff;border-radius:999px;color:var(--muted);
  box-shadow:0 10px 30px rgba(9,16,22,.18)}
.search input{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;color:var(--ink)}
.search input::placeholder{color:#6B7076}
.quick{position:relative;z-index:6;background:#fff;border:1px solid var(--line);border-radius:22px;display:grid}
.quick li{display:flex;align-items:center;gap:14px}
.quick .ic{flex:none;display:flex;align-items:center;justify-content:center;border-radius:14px;
  background:var(--soft);color:var(--sea)}
.quick div{display:flex;flex-direction:column;gap:3px;min-width:0}
.quick b{font-weight:700;color:var(--ink);line-height:1.35}
.quick div span{color:var(--muted);line-height:1.5}
.cats a,.chips a{display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:999px;
  font-weight:700;color:var(--text);white-space:nowrap}
.cats a .n,.chips a .n{font-size:13px;font-weight:700;color:var(--muted)}
.cats a.on,.chips a.on{background:var(--ink);color:#fff}
.cats a.on .n,.chips a.on .n{color:var(--sky-2)}
.grp-h{display:flex;align-items:baseline;gap:10px}
.grp-h h2{line-height:1.25}
.grp-h .n{font-weight:700;color:var(--muted)}
.qa{background:#fff;border:1px solid var(--line);border-radius:22px;overflow:hidden}
details + details{border-top:1px solid var(--line)}
summary{display:flex;align-items:flex-start;list-style:none;cursor:pointer;color:var(--ink)}
summary::-webkit-details-marker{display:none}
.qm{flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;
  background:var(--soft);font-family:'SUIT',system-ui,sans-serif;font-weight:800;color:var(--sea-d)}
.qt{flex:1;min-width:0;font-weight:700;text-wrap:balance}
.pm{flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;
  border:1px solid var(--line);color:var(--ink);transition:transform .2s ease}
details[open] .pm{transform:rotate(45deg);background:var(--ink);border-color:var(--ink);color:#fff}
details[open] .qm{background:var(--sea-d);color:#fff}
.ans p{color:var(--text);word-break:keep-all;overflow-wrap:anywhere}
.refund{display:grid;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.rf-c{display:flex;background:var(--paper)}
.rf-c span{font-size:14px;font-weight:700;color:var(--muted)}
.rf-c b{font-family:'SUIT',system-ui,sans-serif;font-weight:800;letter-spacing:-.02em}
.rf-c.ok b{color:var(--sea-d)}
.rf-c.mid b{color:var(--ink)}
.rf-c.no b{color:var(--food-d)}
.rf-note{font-size:14px!important;line-height:1.7!important;color:var(--muted)!important}
.ask{background:#fff;border:1px solid var(--line);border-radius:22px;display:flex}
.ask h2{line-height:1.25}
.ask p{color:var(--text)}
.ask-b{display:flex}
.ask .book-pill{justify-content:center;gap:8px}
.ask .book-pill svg{width:auto;height:auto;padding:0;background:none;color:#fff}
.line-pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;
  border:1px solid #CFCCC4;background:#fff;font-weight:700;color:var(--ink);white-space:nowrap}
"""

CSS_FD = """
.fq-hero{height:500px}
.fq-hero .hero-img{object-position:50% 38%}
/* 내비가 밝은 하늘 · 시내 위에 앉아 위쪽 띠를 한 겹 더 덮는다. */
.fq-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.42) 0,rgba(9,16,22,.2) 90px,rgba(9,16,22,0) 150px),
  linear-gradient(100deg,rgba(9,16,22,.72) 0%,rgba(9,16,22,.5) 34%,rgba(9,16,22,.14) 62%,rgba(9,16,22,.06) 100%)}
.fq-hero .hero-in{top:160px;text-shadow:0 1px 14px rgba(9,16,22,.4)}
.fq-hero .hero-in h1{margin-top:0;font-size:60px}
.fq-sub{margin-top:16px;font-size:19px;line-height:1.7}
.search{width:560px;height:60px;margin-top:30px;padding:0 24px;text-shadow:none}
.search input{font-size:16.5px}
.quick{margin:-58px var(--pad) 0;grid-template-columns:repeat(4,1fr)}
.quick li{padding:26px 26px}
.quick li + li{border-left:1px solid var(--line)}
.quick .ic{width:48px;height:48px}
.quick b{font-size:17px}
.quick div span{font-size:14.5px}
.fq-body{display:grid;grid-template-columns:260px 1fr;gap:0 64px;align-items:start;padding:96px var(--pad) 0}
.cats{position:sticky;top:28px}
.cats-h{display:block;margin:0 0 12px 18px;font-size:13px;font-weight:800;letter-spacing:.06em;color:var(--muted)}
.cats nav{display:flex;flex-direction:column;gap:4px}
.cats a{height:48px;padding:0 18px;font-size:15.5px}
.grp + .grp{margin-top:64px}
.grp-h h2{font-size:30px}
.grp-h .n{font-size:16px}
.qa{margin-top:20px}
summary{gap:18px;padding:24px 26px 24px 28px}
.qm{width:34px;height:34px;font-size:15px}
.qt{padding-top:4px;font-size:18px;line-height:1.5}
.pm{width:34px;height:34px}
.ans{padding:0 76px 28px 80px}
.ans p{max-width:68ch;font-size:16.5px;line-height:1.85}
.refund{grid-template-columns:repeat(3,1fr)}
.rf-c{flex-direction:column;gap:6px;padding:20px 22px}
.rf-c + .rf-c{border-left:1px solid var(--line)}
.rf-c b{font-size:21px}
.rf-note{margin-top:14px}
.ask{margin:112px var(--pad) 0;padding:44px 48px;align-items:center;justify-content:space-between;gap:40px}
.ask h2{font-size:34px}
.ask p{margin-top:12px;font-size:17px;line-height:1.75}
.ask-b{gap:12px}
.ask .book-pill,.line-pill{height:56px;padding:0 28px;font-size:16px}
.ask + .foot{margin-top:96px}
"""

CSS_FM = """
.fq-hero{height:436px}
.fq-hero .hero-img{object-position:52% 50%}
.fq-hero .veil{background:linear-gradient(180deg,rgba(9,16,22,.6) 0%,rgba(9,16,22,.5) 55%,
  rgba(9,16,22,.22) 80%,rgba(9,16,22,.3) 100%)}
.fq-hero .hero-in{top:104px;text-align:center;text-shadow:0 1px 14px rgba(9,16,22,.45)}
.fq-hero .hero-in h1{margin-top:0;font-size:40px}
.fq-sub{margin:12px auto 0;max-width:30ch;font-size:16.5px;line-height:1.7;text-wrap:balance}
.search{height:54px;margin-top:24px;padding:0 18px;text-align:left;text-shadow:none}
.search input{font-size:16px}
.quick{margin:-52px var(--pad) 0;grid-template-columns:1fr 1fr}
.quick li{flex-direction:column;align-items:flex-start;gap:12px;padding:18px 16px}
.quick li:nth-child(2n){border-left:1px solid var(--line)}
.quick li:nth-child(n+3){border-top:1px solid var(--line)}
.quick .ic{width:42px;height:42px;border-radius:12px}
.quick b{font-size:15.5px}
.quick div span{font-size:13.5px}
.fq-body{padding:48px 0 0}
.chips{display:flex;gap:8px;overflow-x:auto;padding:0 var(--pad) 4px;scrollbar-width:none}
.chips::after{content:"";flex:none;width:8px}
.chips a{flex:none;height:44px;padding:0 16px;font-size:14.5px;background:#fff;border:1px solid var(--line)}
.chips a.on{border-color:var(--ink)}
.grps{padding:0 var(--pad)}
.grp{padding-top:44px}
.grp-h h2{font-size:24px}
.grp-h .n{font-size:15px}
.qa{margin-top:16px}
summary{gap:12px;padding:18px 16px 18px 16px}
.qm{width:28px;height:28px;font-size:13.5px}
.qt{padding-top:2px;font-size:16.5px;line-height:1.5}
.pm{width:28px;height:28px}
.pm svg{width:14px;height:14px}
.ans{padding:0 16px 20px 56px}
.ans p{font-size:16px;line-height:1.8}
.refund{grid-template-columns:1fr}
.rf-c{align-items:center;justify-content:space-between;gap:10px;padding:14px 16px}
.rf-c + .rf-c{border-top:1px solid var(--line)}
.rf-c b{font-size:17px;text-align:right}
.rf-note{margin-top:12px}
.ask{margin:64px var(--pad) 0;padding:28px 22px;flex-direction:column;text-align:center;gap:22px}
.ask h2{font-size:26px}
.ask p{margin-top:10px;font-size:16px;line-height:1.75;text-wrap:balance}
.ask-b{flex-direction:column;gap:10px}
.ask .book-pill,.line-pill{height:54px;padding:0 20px;font-size:16px}
.ask + .foot{margin-top:64px}
"""


def build(mobile, lang):
    global LANG
    LANG = lang
    D.C = _detail_en if lang == "en" else _detail_ko     # 내비 · 푸터 문구도 같은 언어로
    css = (D.CSS_M if mobile else D.CSS_D) + CSS_COMMON + (CSS_FM if mobile else CSS_FD)
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
<div class="page faq">
{D.bind_su(page(mobile))}
</div>
</x-dc>
</body>
</html>
"""
    name = f"Faq{'En' if lang == 'en' else 'Ko'}{'_M' if mobile else ''}.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")
    return name


OUT = [build(m, "ko") for m in (False, True)]
D.embed_fonts_exact(OUT)
OUT_EN = [build(m, "en") for m in (False, True)]
D.embed_fonts_en(OUT_EN)
D.C = _detail_ko
