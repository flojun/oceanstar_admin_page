# -*- coding: utf-8 -*-
"""오션스타 리뉴얼 5안 - 공통 토큰과 부품."""

FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Do+Hyeon&family=Noto+Sans+KR:wght@400;500;700;900&display=swap">')

TOKENS = """
:root{
  --navy:#0a3f66; --primary:#0077a8; --primary-hover:#00648f;
  --cyan:#00a0d0; --sky:#6fd0ee; --sky-pale:#dcf0f9; --badge:#e4f3fa;
  --surface:#ffffff; --soft:#f4fafd;
  --text:#44586a; --soft-text:#52697c; --muted:#7b8fa0; --on-navy:#a8cee2;
  --border:#e3edf4; --inner:#eef4f8; --outline:#bcdcec;
  --sh-card:0 8px 24px rgba(0,119,168,.08);
  --sh-cta:0 14px 30px rgba(0,119,168,.28);
  --sh-float:0 20px 44px rgba(0,119,168,.16);
  --sh-navy:0 12px 28px rgba(10,63,102,.22);
  --d:'Do Hyeon', system-ui, sans-serif;
  --b:'Pretendard','Noto Sans KR', system-ui, sans-serif;
}
*{box-sizing:border-box}
body{margin:0;background:var(--surface);font-family:var(--b);color:var(--text);
     word-break:keep-all;-webkit-font-smoothing:antialiased}
a{color:var(--primary);text-decoration:none}
a:hover{color:var(--primary-hover)}
h1,h2,h3{margin:0;text-wrap:balance}
p{margin:0;text-wrap:pretty}
.d{font-family:var(--d);color:var(--navy);letter-spacing:-.01em}
.num{font-variant-numeric:tabular-nums}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
     border:0;border-radius:12px;font-family:var(--b);font-weight:700;cursor:pointer}
.btn-fill{background:var(--primary);color:#fff;box-shadow:var(--sh-cta)}
.btn-fill:hover{background:var(--primary-hover)}
.btn-line{background:transparent;color:var(--primary);border:1.5px solid var(--outline)}
.btn-line:hover{background:var(--badge)}
.pill{display:inline-flex;align-items:center;border-radius:9999px;background:var(--badge);
      color:var(--primary);font-size:12px;font-weight:700;letter-spacing:.18em;padding:8px 16px}
@media (prefers-reduced-motion: reduce){
  *{animation:none!important;transition:none!important}
}
"""

# 6개 상품 - PRD 3.4 실측값
TOURS = [
    dict(img="turtle.jpg",  badge="가장 인기있는 상품", hot=True,
         name="1부 거북이 스노클링", meta="08:00 - 11:00 · 최대 45인",
         price="₩151,570", sub="아동 ₩106,100"),
    dict(img="dive.jpg",    badge="여유로운 출발시간",
         name="2부 거북이 스노클링", meta="11:00 - 14:00 · 최대 45인",
         price="₩151,570", sub="아동 ₩106,100"),
    dict(img="sunset.jpg",  badge="로맨틱 선셋 뷰",
         name="선셋 거북이 스노클링", meta="15:00 - 18:00 · 최대 38인",
         price="₩206,690", sub="아동 ₩130,900"),
    dict(img="kayak.jpg",   badge="짜릿한 콤보",
         name="스노클링 + 패러세일링", meta="거북이를 보고 하늘까지 오릅니다",
         price="₩289,360", sub="아동 동일"),
    dict(img="board.jpg",   badge="VVIP 단독 대관", navy=True,
         name="프라이빗 차터", meta="단독 대관 2시간 · 최대 30인",
         price="₩2,066,850", sub="인원 구간별 재계산"),
    dict(img="surf.jpg",    badge="신규", 
         name="스노클링 + 서핑", meta="와이키키 명물 서핑까지 한번에",
         price="₩261,018", sub="[원화 정가 확정 필요]"),
]

ICON = {
 "turtle": '<path d="M12 5c3.9 0 7 2.7 7 6s-3.1 6-7 6-7-2.7-7-6 3.1-6 7-6Z"/><path d="M5.5 15 3 17.5M18.5 15 21 17.5M9 17.5 8 20M15 17.5 16 20M12 5V2.5"/>',
 "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
 "boat":  '<path d="M3 17.5h18l-2 3.5H5l-2-3.5Z"/><path d="M5 17.5V9l7-4 7 4v8.5"/><path d="M12 5v12.5"/>',
 "star":  '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z"/>',
 "shield":'<path d="M12 3l7.5 3v6c0 4.4-3.1 7.9-7.5 9-4.4-1.1-7.5-4.6-7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
}

def icon(name, size=24, stroke="var(--primary)", w=1.7):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="{stroke}" stroke-width="{w}" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{ICON[name]}</svg>')

def stars(n=5, size=15):
    one = (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="var(--cyan)" '
           f'aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 '
           f'1-6.1L3.2 9.4l6.1-.9L12 3Z"/></svg>')
    return f'<div style="display:flex;gap:2px" role="img" aria-label="별점 5점">{one*n}</div>'

def page(title, style, body):
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
  {FONTS}
  <style>{TOKENS}{style}</style>
</helmet>
{body}
</x-dc>
</body>
</html>
"""
