# -*- coding: utf-8 -*-
"""모든 안의 헤더 항목을 오션스타 홈과 같게 맞춘다.
Home · 고객후기 · FAQ · 블로그  +  EN · 내 예약 관리 · 투어 예약하기
nav 는 이미 NAV 공통이라 손댈 게 없고, 빠져 있던 EN / 내 예약 관리 만 붙인다.
생김새는 각 안의 언어를 그대로 둔다."""
import io

BOOK = "투어 예약하기"


def right(indent, gap, chip, cta):
    """오른쪽 묶음. cta 안의 %s 는 header 포맷 인자(투어 예약하기)로 채워진다."""
    a = '<a href="#" style="%s">%%s</a>' % chip
    return ('%s<div style="display:flex;align-items:center;gap:%dpx">\n'
            '%s  %s\n%s  %s\n%s  %s\n%s</div>\n'
            % (indent, gap, indent, a % "EN", indent, a % "내 예약 관리",
               indent, cta, indent))


def sub(path, pairs, count=1):
    s = io.open(path, encoding="utf-8").read()
    for old, new in pairs:
        assert s.count(old) == count, "%s: %d회\n%s" % (path, s.count(old), old[:80])
        s = s.replace(old, new)
    io.open(path, "w", encoding="utf-8").write(s)
    print("  통일:", path)


P5, P6, P7 = "build_new5.py", "build_new6.py", "build_new7.py"

pairs5 = [
    # 새-1 저널 : 헤어라인 활자
    ('    <nav style="display:flex;gap:30px">%s</nav>\n'
     '    <a href="#" class="lnk">%s</a>\n',
     '    <nav style="display:flex;gap:30px">%s</nav>\n'
     + right("    ", 18, "font-size:14px;color:#5F6670",
             '<a href="#" class="lnk">%s</a>')),
    # 새-2 심해(다크, 보관용)
    ('      <nav style="display:flex;gap:32px">%s</nav>\n'
     '      <button class="cta" style="height:44px;padding:0 22px;font-size:14px">%s</button>\n',
     '      <nav style="display:flex;gap:32px">%s</nav>\n'
     + right("      ", 12,
             "font-size:13.5px;color:#C4D2DB;border:1px solid rgba(232,241,245,.3);"
             "border-radius:4px;padding:9px 13px",
             '<button class="cta" style="height:44px;padding:0 22px;font-size:14px">%s</button>')),
    # 새-3 선샤인 : 알약
    ('    <button class="pill" style="height:46px;padding:0 24px;font-size:15px">%s</button>\n',
     right("    ", 10,
           "font-size:13.5px;font-weight:700;color:#123B34;background:#FFFFFF;"
           "border-radius:999px;padding:11px 17px;box-shadow:0 6px 18px rgba(18,59,52,.08)",
           '<button class="pill" style="height:46px;padding:0 24px;font-size:15px">%s</button>'
           ).lstrip()),
    # 새-4 그리드 : 라운드 0
    ('    <button class="cta" style="height:40px;padding:0 20px;font-size:14px">%s</button>\n',
     right("    ", 10, "font-size:13px;color:#0A0A0A;border:1px solid #DDDDDD;padding:9px 13px",
           '<button class="cta" style="height:40px;padding:0 20px;font-size:14px">%s</button>'
           ).lstrip()),
    # 새-5 씨글래스 : 알약
    ('    <button class="btn-t" style="height:44px;padding:0 22px;font-size:14px">%s</button>\n',
     right("    ", 10,
           "font-size:13.5px;font-weight:700;color:#2F6B5F;border:1.5px solid #A9C6BC;"
           "border-radius:999px;padding:10px 16px",
           '<button class="btn-t" style="height:44px;padding:0 22px;font-size:14px">%s</button>'
           ).lstrip()),
    # 새-2 심해(밝은판)
    ('    <nav style="display:flex;gap:32px">%s</nav>\n'
     '    <button class="cta" style="height:44px;padding:0 22px;font-size:14px">%s</button>\n',
     '    <nav style="display:flex;gap:32px">%s</nav>\n'
     + right("    ", 12,
             "font-size:13.5px;color:#4E7383;border:1px solid #D7E7EC;"
             "border-radius:4px;padding:9px 13px",
             '<button class="cta" style="height:44px;padding:0 22px;font-size:14px">%s</button>')),
]
sub(P5, pairs5)
# 헤더 CTA 만 '투어 예약하기' 로. 카드의 BOOK(예약하기)은 그대로 둔다.
s = io.open(P5, encoding="utf-8").read()
assert s.count('TOUR["book"], ') == 6, s.count('TOUR["book"], ')
io.open(P5, "w", encoding="utf-8").write(s.replace('TOUR["book"], ', 'HBOOK, ').replace(
    'BOOK, MORE = TOUR["book"], TOUR["more"]',
    'BOOK, MORE = TOUR["book"], TOUR["more"]\nHBOOK = "투어 예약하기"  # 헤더 CTA'))
print("  헤더 CTA 통일:", P5)
