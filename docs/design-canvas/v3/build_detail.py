# -*- coding: utf-8 -*-
"""상세페이지(한국어) 보드. 데스크탑 1440 · 모바일 375.

문안은 _detail_ko.py 에 모아 두었다(운영 중인 OTA 상세페이지에서 그대로 옮김).
꼴은 시안 B 와 같은 토큰·활자·모서리 값을 쓴다. 다만 랜딩과 같은 짜임을 반복하지
않도록 섹션마다 다른 배치를 썼다. 히어로는 사진 띠 + 겹쳐 올린 예약 카드,
특장점은 번호 격자, 시간은 주간 띠, 일정은 단계 흐름, 인증샷은 사진 격자다.

사진이 없는 자리는 회색 상자로 비워 두고 무엇이 필요한지 적어 두었다.
없는 사진을 만들어 넣지 않는다.
"""
import io, os, re
import _detail_ko as C

HERE = os.path.dirname(os.path.abspath(__file__))


def fonts():
    s = io.open(os.path.join(HERE, "SianB.dc.html"), encoding="utf-8").read()
    return re.search(r'/\*__FONTS__\*/.*?/\*__FONTS_END__\*/', s, re.S).group(0)


def icon(path, size=18, sw=1.7, fill="none"):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" '
            f'stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" '
            f'stroke-linejoin="round">{path}</svg>')


I_ARROW = icon('<path d="M7 17L17 7M17 7H9M17 7v8"></path>', 15)
I_CHECK = icon('<path d="M5 12.5l4.5 4.5L19 7"></path>', 19)
I_PLUS  = icon('<path d="M12 5v14M5 12h14"></path>', 13)
I_CLOCK = icon('<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.3V12l3.2 1.9"></path>')
I_STAR  = icon('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 '
               '5.8-.8z" fill="currentColor" stroke="none"></path>', 15)
I_PIN   = icon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"></path>'
               '<circle cx="12" cy="10" r="2.6"></circle>', 20)
I_HOTEL = icon('<path d="M5 20V5.6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20"></path>'
               '<path d="M15 11.2h3.4a1 1 0 0 1 1 1V20"></path><path d="M3 20h18"></path>'
               '<path d="M8.4 8.2h1M11.4 8.2h1M8.4 11.6h1M11.4 11.6h1M8.4 15h1M11.4 15h1"></path>', 20)
I_PH    = icon('<rect x="3.5" y="5" width="17" height="14" rx="2.4"></rect>'
               '<circle cx="9" cy="10.4" r="1.5"></circle>'
               '<path d="M4.6 17.2l4.1-4.1 3 3 3-2.6 4.7 4.2"></path>', 22, 1.5)
PERK_ICONS = {
    "van":    icon('<path d="M2.6 16.4V8.6a1 1 0 0 1 1-1h9.9v8.8H2.6z"></path>'
                   '<path d="M13.5 11h3.6l3.3 3.4v2h-6.9z"></path>'
                   '<circle cx="7" cy="16.6" r="2"></circle>'
                   '<circle cx="16.8" cy="16.6" r="2"></circle>', 24),
    "gear":   icon('<circle cx="7.8" cy="12" r="3.7"></circle>'
                   '<circle cx="16.2" cy="12" r="3.7"></circle>'
                   '<path d="M11.5 12h1M4.1 12H2.2M19.9 12h1.9"></path>', 24),
    "bowl":   icon('<path d="M3.4 10.6h17.2a8.6 8.6 0 0 1-17.2 0z"></path>'
                   '<path d="M8 7.6c0-1.2 1-1.6 1-2.7M12 7.3c0-1.4 1-1.8 1-3M16 7.6c0-1.2 1-1.6 1-2.7"></path>', 24),
    "camera": icon('<path d="M3.6 8.6h3l1.5-2.1h5.8l1.5 2.1h3a1 1 0 0 1 1 1v7.8a1 1 0 0 1-1 1'
                   'h-14.8a1 1 0 0 1-1-1V9.6a1 1 0 0 1 1-1z"></path>'
                   '<circle cx="12" cy="13.2" r="3.4"></circle>', 24),
}
STARS5 = I_STAR * 5


# ── 꼴 ────────────────────────────────────────────────────────────────
BASE = """
:root{
  --ink:#101418; --paper:#F6F5F2; --soft:#EFEDE8; --sky:#7FD4E8; --sea:#1E9DC4;
  --deep:#0D5C7A; --food:#D2591A;
  /* 흰 글씨를 얹는 색 띠용. --sea 위 흰 글씨는 3.15:1, --food 위는 4.05:1 로
     둘 다 AA 미달이라 같은 계열에서 한 단계씩 눌러 둔 값이다(4.83 / 4.66). */
  --sea-d:#177B9C; --food-d:#C45014;
  --sky-2:#A8E5F2;
  --text:#4A4F55; --muted:#646A70; --line:#E2E0DA;
  --e1:0 2px 8px rgba(16,20,24,.05), 0 16px 40px rgba(16,20,24,.08);
  --e2:0 8px 22px rgba(16,20,24,.10), 0 30px 70px rgba(16,20,24,.16);
}
*{box-sizing:border-box}
body{margin:0}
h1,h2,h3,h4,p,dl,dt,dd,figure,blockquote,ul,li{margin:0;padding:0}
ul{list-style:none}
a{text-decoration:none;color:inherit}
img{display:block;max-width:100%}
svg{flex:none}
.n{font-variant-numeric:tabular-nums}
.page{background:var(--paper);color:var(--text);
  font-family:'Pretendard',system-ui,sans-serif;word-break:keep-all;
  -webkit-font-smoothing:antialiased}
h1,h2,h3,h4{font-family:'SUIT',system-ui,sans-serif;color:var(--ink);letter-spacing:-.035em}
.hl{color:var(--sea)}

/* 알약 */
.pill{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 16px;
  border-radius:999px;background:#fff;border:1px solid var(--line);
  font-size:13px;font-weight:700;color:var(--ink)}
.book-pill{display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 10px 0 22px;
  border-radius:999px;background:var(--ink);color:#fff;font-size:14px;font-weight:700}
.book-pill svg{width:30px;height:30px;padding:7px;border-radius:50%;background:#fff;
  color:var(--ink);box-sizing:border-box}
.book-pill.light{background:#fff;color:var(--ink)}
.book-pill.light svg{background:var(--ink);color:#fff}

/* 사진이 아직 없는 자리. 무엇이 들어갈지 적어 둔다. */
.ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  background:repeating-linear-gradient(135deg,#E6E4DE 0 9px,#EFEDE8 9px 18px);
  border:1px dashed #C9C6BE;color:var(--text);text-align:center}
.ph b{font-size:11.5px;font-weight:700;letter-spacing:.02em}
.ph i{font-style:normal;font-size:10.5px;line-height:1.4;max-width:80%}
"""

CSS_D = BASE + """
.page{width:1440px;--pad:76px}
.sect{padding:104px var(--pad) 0}
.center{text-align:center}
.sect h2{font-size:46px;line-height:1.26}
.lede{margin-top:20px;font-size:16px;line-height:1.85;color:var(--text)}

/* 히어로 — 사진 띠 위에 내비, 그 아래 예약 카드를 겹쳐 올린다. 랜딩의
   전면 히어로와 달리 상세는 값과 시간이 첫 화면에 있어야 한다. */
.hero{position:relative;height:560px;overflow:hidden;background:var(--ink)}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(9,16,22,.56) 0%,rgba(9,16,22,.42) 30%,rgba(9,16,22,.48) 58%,rgba(9,16,22,.72) 100%)}
.nav{position:absolute;left:var(--pad);right:var(--pad);top:26px;z-index:5;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center}
.logo{height:44px;width:auto;filter:brightness(0) invert(1)}
.menu{display:flex;gap:4px;align-items:center;background:rgba(255,255,255,.16);
  border-radius:999px;padding:5px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.menu a{display:inline-flex;align-items:center;height:36px;padding:0 17px;border-radius:999px;
  font-size:13.5px;font-weight:600;color:rgba(255,255,255,.88)}
.menu a.on{background:#fff;color:var(--ink);font-weight:700}
.nav-r{display:flex;gap:10px;align-items:center;justify-self:end}
.lang-pill{display:inline-flex;align-items:center;height:46px;padding:0 20px;border-radius:999px;
  border:1px solid rgba(255,255,255,.44);color:#fff;font-size:13px;font-weight:700;letter-spacing:.06em}
.nav-r .book-pill{background:#fff;color:var(--ink)}
.nav-r .book-pill svg{background:var(--ink);color:#fff}
.hero-in{position:absolute;left:0;right:0;top:186px;z-index:3;text-align:center;color:#fff}
.eyebrow{display:inline-flex;align-items:center;height:32px;padding:0 18px;border-radius:999px;
  background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.34);
  font-size:12.5px;font-weight:600;color:#fff;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in h1{margin-top:22px;font-size:66px;line-height:1.16;color:#fff;font-weight:800}
.hero-in h1 .hl{color:var(--sky)}
.hero-in .rev{display:inline-flex;align-items:center;gap:9px;margin-top:22px;height:38px;
  padding:0 18px;border-radius:999px;background:rgba(16,20,24,.5);color:#fff;
  font-size:13.5px;font-weight:700;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in .rev svg{color:var(--sky)}

/* 예약 카드 */
.buy{position:relative;z-index:6;margin:-96px var(--pad) 0;padding:34px 38px;
  background:#fff;border-radius:22px;box-shadow:var(--e2);
  display:grid;grid-template-columns:1fr 344px;gap:0 44px;align-items:center}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:18px 34px}
.facts div{display:flex;flex-direction:column;gap:4px}
.facts dt{font-size:11.5px;font-weight:800;letter-spacing:.06em;color:var(--muted)}
.facts dd{font-size:15px;font-weight:700;color:var(--ink);line-height:1.45}
.buy-r{padding-left:38px;border-left:1px solid var(--line)}
.buy-r .amt{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:38px;
  font-weight:800;color:var(--ink);line-height:1;letter-spacing:-.03em}
.buy-r .amt-s{display:block;margin-top:7px;font-size:12.5px;color:var(--text)}
.buy-r .book-pill{margin-top:18px;width:100%;justify-content:space-between;height:54px;
  padding:0 10px 0 24px;font-size:15px}
.pure{grid-column:1 / -1;margin-top:26px;padding-top:20px;border-top:1px solid var(--line);
  display:flex;align-items:flex-start;gap:9px;font-size:13px;line-height:1.7;color:var(--text)}
.pure svg{color:var(--sea);margin-top:1px}

/* 가족 — 사진 오른쪽, 글 왼쪽 */
.fam{display:grid;grid-template-columns:1fr 520px;gap:80px;align-items:center}
.fam h2{font-size:42px;line-height:1.3}
.fam .tag{display:inline-flex;align-items:center;height:34px;margin-bottom:22px;padding:0 16px;
  border-radius:999px;background:var(--deep);color:#fff;font-size:12.5px;font-weight:700}
.fam p{margin-top:18px;font-size:17px;font-weight:700;color:var(--ink)}
.fam .hand{margin-top:10px;font-size:14px;font-weight:600;color:var(--deep)}
.fam .ph{height:360px;border-radius:22px}

/* 후기 */
.proof{display:grid;grid-template-columns:420px 1fr;gap:80px;align-items:start}
.proof h2{font-size:42px;line-height:1.26}
.score{display:flex;align-items:baseline;gap:12px;margin-top:24px}
.score b{font-family:'SUIT',system-ui,sans-serif;font-size:54px;font-weight:800;
  color:var(--ink);line-height:1}
.score .st{display:flex;gap:2px;color:var(--sea)}
.score i{font-style:normal;font-size:12.5px;color:var(--text)}
.rv-list{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.rv-c{padding:22px 24px 20px;background:#fff;border:1px solid var(--line);border-radius:18px;
  display:flex;flex-direction:column}
.rv-c .st{display:flex;gap:2px;color:var(--sea)}
.rv-c blockquote{margin-top:12px;font-size:13.5px;line-height:1.8;color:var(--text);
  display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.rv-c figcaption{margin-top:auto;padding-top:16px;display:flex;gap:10px;align-items:baseline;
  font-size:12.5px;font-weight:700;color:var(--ink)}
.rv-c figcaption i{font-style:normal;font-weight:500;color:var(--muted)}

/* 4가지 혜택 — 아이콘 2x2 */
.perks{margin-top:44px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.perk{padding:30px 32px;background:#fff;border:1px solid var(--line);border-radius:22px}
.perk .ic{display:flex;align-items:center;justify-content:center;width:52px;height:52px;
  border-radius:14px;background:var(--soft);color:var(--sea)}
.perk h3{margin-top:18px;font-size:20px;line-height:1.35}
.perk p{margin-top:9px;font-size:14.5px;line-height:1.8;color:var(--text)}

/* 6가지 특장점 — 번호 격자. 첫머리 주장 둘만 색을 준다. */
.feats{margin-top:44px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ft{padding:32px 34px 34px;background:#fff;border:1px solid var(--line);border-radius:22px}
.ft.key{background:var(--deep);border-color:var(--deep)}
.ft .no{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;
  padding:0 10px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:14px;font-weight:800;color:var(--deep);
  letter-spacing:.02em}
.ft.key .no{background:rgba(255,255,255,.16);color:#fff}
.ft h3{margin-top:16px;font-size:24px;line-height:1.3}
.ft .sub{margin-top:7px;font-size:15px;font-weight:700;color:var(--deep)}
.ft p{margin-top:14px;font-size:14.5px;line-height:1.85;color:var(--text)}
.ft .em{margin-top:14px;font-size:14.5px;line-height:1.8;font-weight:700;color:var(--deep)}
.ft.key h3{color:#fff}
.ft.key .sub{color:var(--sky-2)}
.ft.key p{color:rgba(255,255,255,.84)}
.ft.key .em{color:var(--sky-2)}

/* 투어 시간 — 주간 띠 */
.week{margin:36px auto 0;max-width:1020px;border-radius:18px;overflow:hidden;
  border:1px solid var(--line);background:#fff}
.wrow{display:grid;grid-template-columns:repeat(7,1fr)}
.whead span{padding:15px 0;text-align:center;font-size:14px;font-weight:700;color:var(--ink);
  background:var(--soft)}
.whead span:last-child{color:var(--muted)}
.slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  min-height:74px;color:#fff;text-align:center}
.slot b{font-size:14px;font-weight:700}
.slot em{font-style:normal;font-size:15px;font-weight:800;letter-spacing:-.01em;
  font-variant-numeric:tabular-nums}
.slot.sea{background:var(--sea-d)}
.slot.deep{background:var(--deep)}
.slot.food{background:var(--food-d)}
.rest{display:flex;align-items:center;justify-content:center;font-size:12.5px;
  font-weight:700;color:var(--muted);background:var(--soft)}
.tnote{margin:26px auto 0;max-width:1020px;display:flex;align-items:flex-start;gap:10px;
  padding:18px 22px;border-radius:14px;background:#fff;border:1px solid var(--line);
  font-size:13.5px;line-height:1.8;color:var(--text)}
.tnote svg{color:var(--sea);margin-top:2px}
.tlist{margin:16px auto 0;max-width:1020px;text-align:left}
.tlist li{position:relative;padding-left:16px;font-size:13.5px;line-height:1.95;color:var(--muted)}
.tlist li::before{content:"";position:absolute;left:2px;top:12px;width:4px;height:4px;
  border-radius:50%;background:var(--muted)}

/* 일정 — 단계 흐름 */
.flow{margin:40px auto 0;display:flex;align-items:center;justify-content:center;gap:0}
.step{display:flex;align-items:center;justify-content:center;width:112px;height:112px;
  border-radius:50%;text-align:center;font-size:14px;font-weight:700;line-height:1.35;
  background:#fff;border:1px solid var(--line);color:var(--ink)}
.step.on{background:var(--deep);border-color:var(--deep);color:#fff}
.flow span.sp{width:18px;height:1px;background:var(--line);flex:none}
.fcards{margin:40px auto 0;max-width:1020px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fc{display:flex;gap:18px;align-items:flex-start;padding:26px 28px;background:#fff;
  border:1px solid var(--line);border-radius:22px;text-align:left}
.fc .ic{display:flex;align-items:center;justify-content:center;width:48px;height:48px;
  border-radius:14px;background:var(--soft);color:var(--sea);flex:none}
.fc.back .ic{color:var(--food)}
.fc h3{font-size:18px}
.fc p{margin-top:7px;font-size:14px;line-height:1.75;color:var(--text)}
.fnote{margin:22px auto 0;text-align:center;font-size:14.5px;font-weight:700;color:var(--ink)}

/* 인증샷 */
.stars{margin-top:40px;display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.star-c{border-radius:18px;overflow:hidden;background:#fff;border:1px solid var(--line)}
/* 잘라 낸 원본이 132x137 이라 그 비율을 그대로 쓴다. 다른 비율로 담으면
   cover 가 얼굴을 잘라 낸다. */
.star-c img{width:100%;aspect-ratio:132 / 137;object-fit:cover}
.star-c b{display:block;padding:13px 14px;font-size:13px;font-weight:700;color:var(--ink);
  text-align:center;line-height:1.4}
.ig{margin-top:26px;text-align:center;font-size:13.5px;font-weight:700;color:var(--muted)}

/* 다른 상품 */
.more{margin-top:44px;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mc{display:grid;grid-template-columns:230px 1fr;background:#fff;border:1px solid var(--line);
  border-radius:22px;overflow:hidden}
.mc img{width:100%;height:100%;object-fit:cover}
.mc .tx{padding:30px 32px;display:flex;flex-direction:column;justify-content:center}
.mc h3{font-size:24px;line-height:1.3}
.mc p{margin-top:10px;font-size:14.5px;line-height:1.75;color:var(--text)}
.mc .go{margin-top:12px;display:inline-flex;align-items:center;min-height:44px;gap:7px;
  font-size:13.5px;font-weight:700;color:var(--deep)}

/* 비교표 */
.cmp{margin-top:36px;border-radius:18px;overflow:hidden;border:1px solid var(--line);
  background:#fff}
.crow{display:grid;grid-template-columns:260px repeat(3,1fr);align-items:stretch}
.cc{display:flex;align-items:center;justify-content:center;padding:16px 18px;text-align:center;
  min-height:62px}
.chead .cc{min-height:112px;font-family:'SUIT',system-ui,sans-serif;font-size:15px;
  font-weight:700;color:var(--ink);line-height:1.45;background:var(--soft)}
.chead .cc.lead{background:var(--soft)}
.cc.lead{font-size:15px;font-weight:700;color:var(--ink)}
.crow:nth-child(2n) .cc{background:rgba(16,20,24,.03)}
.cc > svg{color:var(--sea)}
.cc .no{display:block;width:14px;height:1.5px;background:var(--line);border-radius:2px}

/* 끝맺음 */
.end{margin:104px 0 0;padding:72px var(--pad);background:var(--ink);color:#fff;text-align:center}
.end h2{font-size:42px;color:#fff}
.end p{margin-top:14px;font-size:16px;line-height:1.8;color:rgba(255,255,255,.76)}
.end .book-pill{margin-top:26px}
"""

CSS_M = BASE + """
.page{width:375px;--pad:20px}
.sect{padding:60px var(--pad) 0}
.center{text-align:center}
.sect h2{font-size:27px;line-height:1.35}
.lede{margin-top:14px;font-size:14.5px;line-height:1.8;color:var(--text)}

.hero{position:relative;height:430px;overflow:hidden;background:var(--ink)}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,
  rgba(9,16,22,.58) 0%,rgba(9,16,22,.42) 30%,rgba(9,16,22,.50) 58%,rgba(9,16,22,.74) 100%)}
.nav{position:absolute;left:var(--pad);right:var(--pad);top:16px;z-index:5;
  display:flex;align-items:center;justify-content:space-between}
.logo{height:34px;width:auto;filter:brightness(0) invert(1)}
.nav-r{display:flex;gap:8px;align-items:center}
.lang{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;
  border-radius:50%;background:rgba(255,255,255,.9);color:var(--ink);font-size:12.5px;
  font-weight:800;letter-spacing:.04em}
.burger{display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;
  border-radius:50%;background:rgba(255,255,255,.22);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in{position:absolute;left:var(--pad);right:var(--pad);top:104px;z-index:3;
  text-align:center;color:#fff}
.eyebrow{display:inline-flex;align-items:center;min-height:30px;padding:5px 14px;
  border-radius:999px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.34);
  font-size:11.5px;font-weight:600;color:#fff;line-height:1.4;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in h1{margin-top:14px;font-size:32px;line-height:1.26;color:#fff;font-weight:800}
.hero-in h1 .hl{color:var(--sky)}
.hero-in .rev{display:inline-flex;align-items:center;gap:8px;margin-top:16px;min-height:36px;
  padding:6px 15px;border-radius:999px;background:rgba(16,20,24,.5);color:#fff;
  font-size:12px;font-weight:700;line-height:1.4;
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.hero-in .rev svg{color:var(--sky)}

/* 모바일은 값과 버튼이 먼저다. 마크업 순서는 데스크탑(설명 왼쪽 · 값 오른쪽)에
   맞춰 두고 여기서만 순서를 뒤집는다. */
.buy{position:relative;z-index:6;margin:-56px var(--pad) 0;padding:24px 22px;background:#fff;
  border-radius:22px;box-shadow:var(--e2);display:flex;flex-direction:column}
.buy-r{order:1}
.facts{order:2}
.pure{order:3}
.buy-r .amt{display:block;font-family:'SUIT',system-ui,sans-serif;font-size:32px;font-weight:800;
  color:var(--ink);line-height:1;letter-spacing:-.03em}
.buy-r .amt-s{display:block;margin-top:6px;font-size:12px;color:var(--text)}
.buy-r .book-pill{margin-top:16px;width:100%;justify-content:space-between;height:52px;
  padding:0 10px 0 22px;font-size:15px}
.facts{margin-top:22px;padding-top:20px;border-top:1px solid var(--line);
  display:grid;grid-template-columns:1fr;gap:14px}
.facts div{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
.facts dt{font-size:12px;font-weight:700;color:var(--muted);flex:none}
.facts dd{font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.5;text-align:right}
.pure{margin-top:18px;padding-top:16px;border-top:1px solid var(--line);display:flex;
  align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.7;color:var(--text)}
.pure svg{color:var(--sea);margin-top:1px}

.fam .tag{display:inline-flex;align-items:center;min-height:32px;padding:5px 14px;
  border-radius:999px;background:var(--deep);color:#fff;font-size:12px;font-weight:700;
  line-height:1.4}
.fam h2{margin-top:14px;font-size:27px;line-height:1.35}
.fam p{margin-top:12px;font-size:15px;font-weight:700;color:var(--ink)}
.fam .hand{margin-top:8px;font-size:13.5px;font-weight:600;color:var(--deep)}
.fam .ph{margin-top:22px;height:260px;border-radius:18px}

.score{display:flex;align-items:baseline;gap:10px;margin-top:18px;justify-content:center}
.score b{font-family:'SUIT',system-ui,sans-serif;font-size:44px;font-weight:800;
  color:var(--ink);line-height:1}
.score .st{display:flex;gap:2px;color:var(--sea)}
.score i{font-style:normal;font-size:12px;color:var(--text)}
/* 후기는 가로로 넘긴다. 랜딩 모바일과 같은 결이라 스크롤바도 같은 값을 쓴다. */
.rv-list{display:flex;gap:12px;margin:22px calc(var(--pad) * -1) 0;
  padding:2px var(--pad) 14px;overflow-x:auto;scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;scroll-padding-left:var(--pad)}
.rv-c{flex:0 0 278px;scroll-snap-align:start;display:flex;flex-direction:column;
  padding:20px 20px 18px;background:#fff;border:1px solid var(--line);border-radius:18px}
.rv-c .st{display:flex;gap:2px;color:var(--sea)}
.rv-c blockquote{margin-top:12px;font-size:13.5px;line-height:1.8;color:var(--text);
  display:-webkit-box;-webkit-line-clamp:8;-webkit-box-orient:vertical;overflow:hidden}
.rv-c figcaption{margin-top:auto;padding-top:16px;display:flex;gap:8px;align-items:baseline;
  font-size:12.5px;font-weight:700;color:var(--ink)}
.rv-c figcaption i{font-style:normal;font-weight:500;color:var(--muted)}
.rv-list::-webkit-scrollbar,.cmp::-webkit-scrollbar{height:6px}
.rv-list::-webkit-scrollbar-button,.cmp::-webkit-scrollbar-button{width:0;height:0;display:none}
.rv-list::-webkit-scrollbar-track,.cmp::-webkit-scrollbar-track{background:rgba(16,20,24,.12);
  border-radius:999px}
.rv-list::-webkit-scrollbar-thumb,.cmp::-webkit-scrollbar-thumb{background:var(--ink);
  border-radius:999px}
@supports (-moz-appearance:none){
  .rv-list,.cmp{scrollbar-width:thin;scrollbar-color:var(--ink) rgba(16,20,24,.12)}
}

.perks{margin-top:24px;display:grid;grid-template-columns:1fr;gap:12px}
.perk{padding:22px 22px 24px;background:#fff;border:1px solid var(--line);border-radius:18px}
.perk .ic{display:flex;align-items:center;justify-content:center;width:46px;height:46px;
  border-radius:13px;background:var(--soft);color:var(--sea)}
.perk h3{margin-top:14px;font-size:17px;line-height:1.35}
.perk p{margin-top:8px;font-size:13.5px;line-height:1.8;color:var(--text)}

.feats{margin-top:24px;display:grid;grid-template-columns:1fr;gap:12px}
.ft{padding:24px 22px 26px;background:#fff;border:1px solid var(--line);border-radius:18px}
.ft.key{background:var(--deep);border-color:var(--deep)}
.ft .no{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:32px;
  padding:0 9px;border-radius:999px;background:var(--soft);
  font-family:'SUIT',system-ui,sans-serif;font-size:13px;font-weight:800;color:var(--deep)}
.ft.key .no{background:rgba(255,255,255,.16);color:#fff}
.ft h3{margin-top:14px;font-size:20px;line-height:1.35}
.ft .sub{margin-top:6px;font-size:14px;font-weight:700;color:var(--deep)}
.ft p{margin-top:12px;font-size:13.5px;line-height:1.85;color:var(--text)}
.ft .em{margin-top:12px;font-size:13.5px;line-height:1.8;font-weight:700;color:var(--deep)}
.ft.key h3{color:#fff}
.ft.key .sub{color:var(--sky-2)}
.ft.key p{color:rgba(255,255,255,.84)}
.ft.key .em{color:var(--sky-2)}

.week{margin-top:22px;border-radius:16px;overflow:hidden;border:1px solid var(--line);
  background:#fff}
.wrow{display:grid;grid-template-columns:repeat(7,1fr)}
.whead span{padding:11px 0;text-align:center;font-size:12.5px;font-weight:700;color:var(--ink);
  background:var(--soft)}
.whead span:last-child{color:var(--muted)}
.slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  min-height:66px;color:#fff;text-align:center;padding:0 4px}
.slot b{font-size:11.5px;font-weight:700}
.slot em{font-style:normal;font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums}
.slot.sea{background:var(--sea-d)}
.slot.deep{background:var(--deep)}
.slot.food{background:var(--food-d)}
.rest{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;
  color:var(--muted);background:var(--soft)}
.tnote{margin-top:18px;display:flex;align-items:flex-start;gap:9px;padding:16px 18px;
  border-radius:14px;background:#fff;border:1px solid var(--line);
  font-size:12.5px;line-height:1.8;color:var(--text);text-align:left}
.tnote svg{color:var(--sea);margin-top:2px}
.tlist{margin-top:14px;text-align:left}
.tlist li{position:relative;padding-left:15px;font-size:12.5px;line-height:1.9;color:var(--muted)}
.tlist li::before{content:"";position:absolute;left:2px;top:11px;width:4px;height:4px;
  border-radius:50%;background:var(--muted)}

/* 단계는 세로로 세운다. 375px 에 일곱 개를 옆으로 늘어놓으면 글자가 안 읽힌다. */
.flow{margin-top:24px;display:grid;grid-template-columns:1fr;gap:0;text-align:left}
.step{display:flex;align-items:center;gap:14px;min-height:52px;font-size:14.5px;font-weight:700;
  color:var(--ink)}
.step::before{content:"";width:11px;height:11px;border-radius:50%;background:#fff;
  border:2.5px solid var(--line);flex:none;margin-left:5px}
.step.on::before{background:var(--deep);border-color:var(--deep)}
.flow span.sp{width:1px;height:14px;margin-left:12.5px;background:var(--line)}
.fcards{margin-top:24px;display:grid;grid-template-columns:1fr;gap:12px}
.fc{display:flex;gap:14px;align-items:flex-start;padding:20px 20px;background:#fff;
  border:1px solid var(--line);border-radius:18px;text-align:left}
.fc .ic{display:flex;align-items:center;justify-content:center;width:44px;height:44px;
  border-radius:13px;background:var(--soft);color:var(--sea);flex:none}
.fc.back .ic{color:var(--food)}
.fc h3{font-size:16px}
.fc p{margin-top:6px;font-size:13px;line-height:1.75;color:var(--text)}
.fnote{margin-top:18px;font-size:13.5px;font-weight:700;color:var(--ink);line-height:1.7}

.stars{margin-top:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.star-c{border-radius:14px;overflow:hidden;background:#fff;border:1px solid var(--line)}
.star-c img{width:100%;aspect-ratio:132 / 137;object-fit:cover}
.star-c b{display:block;padding:9px 7px;font-size:10.5px;font-weight:700;color:var(--ink);
  text-align:center;line-height:1.4}
.ig{margin-top:20px;text-align:center;font-size:12.5px;font-weight:700;color:var(--muted)}

.more{margin-top:24px;display:grid;grid-template-columns:1fr;gap:12px}
.mc{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden}
.mc img{width:100%;height:170px;object-fit:cover}
.mc .tx{padding:22px 20px 24px;text-align:left}
.mc h3{font-size:20px;line-height:1.35}
.mc p{margin-top:8px;font-size:13.5px;line-height:1.75;color:var(--text)}
.mc .go{margin-top:8px;display:inline-flex;align-items:center;min-height:44px;gap:6px;
  font-size:13px;font-weight:700;color:var(--deep)}

.cmp{margin:22px calc(var(--pad) * -1) 0;padding:0 var(--pad);overflow-x:auto;
  -webkit-overflow-scrolling:touch}
.cmp-in{width:max-content;border-radius:16px;overflow:hidden;border:1px solid var(--line);
  background:#fff}
.crow{display:grid;grid-template-columns:118px repeat(3,140px)}
.cc{display:flex;align-items:center;justify-content:center;padding:12px 10px;text-align:center;
  min-height:56px}
.chead .cc{min-height:96px;font-family:'SUIT',system-ui,sans-serif;font-size:12.5px;
  font-weight:700;color:var(--ink);line-height:1.45;background:var(--soft)}
.cc.lead{font-size:12.5px;font-weight:700;color:var(--ink)}
.crow:nth-child(2n) .cc{background:rgba(16,20,24,.03)}
.cc > svg{color:var(--sea)}
.cc .no{display:block;width:12px;height:1.5px;background:var(--line);border-radius:2px}

.end{margin-top:60px;padding:52px var(--pad);background:var(--ink);color:#fff;text-align:center}
.end h2{font-size:26px;color:#fff;line-height:1.35}
.end p{margin-top:12px;font-size:14px;line-height:1.8;color:rgba(255,255,255,.76)}
.end .book-pill{margin-top:22px}
"""


# ── 조각 ─────────────────────────────────────────────────────────────
def ph(what, cls="", style=""):
    """아직 못 받은 사진 자리."""
    c = (" " + cls) if cls else ""
    s = f' style="{style}"' if style else ""
    return (f'<div class="ph{c}"{s}>{I_PH}<b>사진 자리</b><i>{what}</i></div>')


def nav(mobile):
    if mobile:
        return ('<header class="nav">'
                '<img src="logo_full.png" alt="오션스타" class="logo">'
                '<div class="nav-r"><a href="#" class="lang">EN</a>'
                '<a href="#" class="burger"><svg width="22" height="22" viewBox="0 0 24 24" '
                'fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">'
                '<path d="M4 7h16M4 12h16M4 17h16"/></svg></a></div></header>')
    return ('<header class="nav">'
            '<img src="logo_full.png" alt="오션스타" class="logo">'
            '<div class="menu"><a href="#">Home</a><a href="#" class="on">투어</a>'
            '<a href="#">고객후기</a><a href="#">FAQ</a></div>'
            '<div class="nav-r"><a href="#" class="lang-pill">EN</a>'
            f'<a href="#" class="book-pill">투어 예약하기 {I_ARROW}</a></div></header>')


def hero(mobile):
    h = C.HERO
    return f"""<section class="hero">
  <img src="turtle.jpg" alt="와이키키 앞바다의 푸른바다거북" class="hero-img">
  <span class="veil"></span>
  {nav(mobile)}
  <div class="hero-in">
    <span class="eyebrow">{h['eyebrow']}</span>
    <h1>{h['h1']}</h1>
    <span class="rev">{I_STAR} {h['badge']}</span>
  </div>
</section>
<section class="buy">
  <dl class="facts">{''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in h['facts'])}</dl>
  <div class="buy-r">
    <b class="amt n">{h['price']}</b>
    <span class="amt-s">{h['price_sub']}</span>
    <a href="#" class="book-pill">예약하기 {I_ARROW}</a>
  </div>
  <p class="pure">{I_CLOCK}<span>{h['pure']}</span></p>
</section>"""


def family(mobile):
    f = C.FAMILY
    box = ph("선장 가족 사진 (아빠 · 언니 · 동생 · 엄마)")
    tx = (f'<div><span class="tag">{f["badge"]}</span><h2>{f["h2"]}</h2>'
          f'<p>{f["body"]}</p><span class="hand">{f["hand"]}</span></div>')
    inner = tx + box if mobile else tx + box
    return f'<section class="sect fam">{inner}</section>'


def reviews(mobile):
    p = C.PROOF
    cards = "".join(
        f'<figure class="rv-c"><span class="st">{STARS5}</span>'
        f'<blockquote>{t}</blockquote>'
        f'<figcaption>{who}<i>{d}</i></figcaption></figure>'
        for t, who, d in C.REVIEWS)
    score = (f'<div class="score"><b class="n">5.0</b><span class="st">{STARS5}</span>'
             f'<i>구글 맵 리뷰 5,754개 · 2026-09-16 기준</i></div>')
    head = (f'<h2>{p["h2"]}</h2>{score}'
            f'<p class="lede">{p["lead"]}</p>'
            f'<p class="lede" style="font-weight:700;color:var(--ink)">{p["tail"]}</p>')
    if mobile:
        return (f'<section class="sect center proof">{head}'
                f'<div class="rv-list">{cards}</div></section>')
    return (f'<section class="sect proof"><div>{head}</div>'
            f'<div class="rv-list">{cards}</div></section>')


def perks(mobile):
    cards = "".join(
        f'<div class="perk"><span class="ic">{PERK_ICONS[k]}</span>'
        f'<h3>{t}</h3><p>{b}</p></div>' for k, t, b in C.PERKS)
    return (f'<section class="sect center"><span class="pill">{I_PLUS} 포함 사항</span>'
            f'<h2 style="margin-top:20px">{C.PERKS_H2}</h2>'
            f'<div class="perks" style="text-align:left">{cards}</div></section>')


def features(mobile):
    out = []
    for no, t, sub, paras, em, key in C.FEATURES:
        body = "".join(f'<p>{x}</p>' for x in paras)
        emx = f'<p class="em">{em}</p>' if em else ""
        out.append(f'<div class="ft{" key" if key else ""}"><span class="no">{no}</span>'
                   f'<h3>{t}</h3><span class="sub">{sub}</span>{body}{emx}</div>')
    return (f'<section class="sect center"><h2>{C.FEAT_H2}</h2>'
            f'<div class="feats" style="text-align:left">{"".join(out)}</div></section>')


def times(mobile):
    head = "".join(f"<span>{d}</span>" for d in C.DAYS)
    rows = [f'<div class="wrow whead">{head}</div>']
    for name, lines, span, col in C.SLOTS:
        tm = "".join(f"<em>{x}</em>" for x in lines)
        rest = (f'<span class="rest" style="grid-column:{span+1} / -1">휴무</span>'
                if span < 7 else "")
        rows.append(f'<div class="wrow"><div class="slot {col}" '
                    f'style="grid-column:1 / span {span}"><b>{name}</b>{tm}</div>{rest}</div>')
    notes = "".join(f"<li>{x}</li>" for x in C.TIME_NOTES)
    return (f'<section class="sect center"><span class="pill">{I_CLOCK} 시간표</span>'
            f'<h2 style="margin-top:20px">{C.TIME_H2}</h2>'
            f'<p class="lede">{C.TIME_SUB}</p>'
            f'<div class="week">{"".join(rows)}</div>'
            f'<p class="tnote">{I_CLOCK}<span>{C.TIME_PURE}</span></p>'
            f'<ul class="tlist">{notes}</ul></section>')


def flow(mobile):
    steps = []
    for i, s in enumerate(C.FLOW):
        if i:
            steps.append('<span class="sp"></span>')
        steps.append(f'<div class="step{" on" if i % 2 == 0 else ""}">{s}</div>')
    ic = {"pickup": PERK_ICONS["van"], "back": I_HOTEL}
    cards = "".join(
        f'<div class="fc{" back" if k == "back" else ""}"><span class="ic">{ic[k]}</span>'
        f'<div><h3>{t}</h3><p>{b}</p></div></div>' for k, t, b in C.FLOW_CARDS)
    return (f'<section class="sect center"><h2>{C.FLOW_H2}</h2>'
            f'<div class="flow">{"".join(steps)}</div>'
            f'<div class="fcards">{cards}</div>'
            f'<p class="fnote">{C.FLOW_NOTE}</p></section>')


def stars(mobile):
    # 올려 주신 상세페이지 이미지에서 타일만 잘라 낸 것이다. 화소는 원본 그대로고
    # 확대도 보정도 하지 않았다.
    tiles = "".join(
        f'<div class="star-c"><img src="star{i:02d}.webp" alt="{n}">'
        f'<b>{n}</b></div>'
        for i, n in enumerate(C.STARS, 1))
    return (f'<section class="sect center"><h2>{C.STAR_H2}</h2>'
            f'<p class="lede">{C.STAR_SUB}</p>'
            f'<span class="pill" style="margin-top:18px">{C.STAR_BADGE}</span>'
            f'<div class="stars">{tiles}</div>'
            f'<p class="ig">{C.STAR_TAG}</p></section>')


def more(mobile):
    cards = "".join(
        f'<a class="mc" href="#"><img src="{img}" alt="{t}">'
        f'<span class="tx"><h3>{t}</h3><p>{b}</p>'
        f'<span class="go">바로가기 {I_ARROW}</span></span></a>'
        for img, t, b in C.MORE)
    head = ('<div class="crow chead"><div class="cc lead"></div>'
            + "".join(f'<div class="cc">{c}</div>' for c in C.CMP_COLS) + "</div>")
    body = ""
    for lab, cells in C.CMP_ROWS:
        cs = "".join(f'<div class="cc">{I_CHECK if v else "<i class=no></i>"}</div>'
                     for v in cells)
        body += f'<div class="crow"><div class="cc lead">{lab}</div>{cs}</div>'
    table = head + body
    wrap = (f'<div class="cmp"><div class="cmp-in">{table}</div></div>' if mobile
            else f'<div class="cmp">{table}</div>')
    return (f'<section class="sect center"><span class="pill">{I_PLUS} 다른 상품</span>'
            f'<h2 style="margin-top:20px">{C.MORE_H2}</h2>'
            f'<div class="more" style="text-align:left">{cards}</div>'
            f'<h2 style="margin-top:80px">{C.CMP_H2}</h2>{wrap}</section>')


def end():
    return (f'<section class="end"><h2>{C.END_H2}</h2><p>{C.END_SUB}</p>'
            f'<a href="#" class="book-pill light">예약하기 {I_ARROW}</a></section>')


def build(mobile):
    w, css = (375, CSS_M) if mobile else (1440, CSS_D)
    title = ("상세페이지 · 거북이 스노클링 — 모바일" if mobile
             else "상세페이지 · 거북이 스노클링 — 데스크탑")
    body = (hero(mobile) + family(mobile) + reviews(mobile) + perks(mobile)
            + features(mobile) + times(mobile) + flow(mobile) + stars(mobile)
            + more(mobile) + end())
    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <title>{title}</title>
  <style>{fonts()}{css}
  </style>
</helmet>
<div class="page">
{body}
</div>
</x-dc>
</body>
</html>
"""
    name = "DetailKo_M.dc.html" if mobile else "DetailKo.dc.html"
    io.open(os.path.join(HERE, name), "w", encoding="utf-8").write(html)
    print(f"{name:<22} {len(html):>7} bytes")


build(False)
build(True)
