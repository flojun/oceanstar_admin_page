# -*- coding: utf-8 -*-
"""운영 중인 SUIT / Pretendard를 아트보드에 실제로 쓰인 글자만 남겨 잘라내고
data URI로 심는다. 캔버스는 jsDelivr를 못 부르기 때문에 인라인이 유일한 길이다."""
import base64, io, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FONTDIR = os.path.join(HERE, "..", "fonts")
FILES = ["New8.dc.html", "New8_M.dc.html"]

# (파일, css font-family, font-weight)
FACES = [("Pretendard-Regular.woff2", "Pretendard", 400),
         ("Pretendard-SemiBold.woff2", "Pretendard", 600),
         ("Pretendard-Bold.woff2", "Pretendard", 700),
         ("SUIT-Bold.woff2", "SUIT", 700),
         ("SUIT-ExtraBold.woff2", "SUIT", 800)]

# 항상 넣어두는 기본 글자 (편집 중 추가될 만한 것들)
BASE = ("0123456789.,:;·~-+/()[]%₩$&'\"!?@#*<>=_ "
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        "가나다라마바사아자차카타파하")


def visible_text(html):
    """마크업을 걷어내고 화면에 보이는 글자만 남긴다."""
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.S)
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S)
    # alt / aria-label 은 보이진 않지만 보조기술이 읽으므로 함께 포함
    keep = " ".join(re.findall(r'(?:alt|aria-label)="([^"]*)"', html))
    html = re.sub(r"<[^>]+>", " ", html)
    return html + " " + keep


def collect_chars():
    chars = set(BASE)
    for f in FILES:
        chars |= set(visible_text(io.open(os.path.join(HERE, f), encoding="utf-8").read()))
    # 공백류와 이모지(폰트에 없음)는 뺀다
    return "".join(sorted(c for c in chars if c.isprintable() and not c.isspace()
                          and ord(c) < 0x1F000))


def subset(src, text, out):
    subprocess.run([sys.executable, "-m", "fontTools.subset", src,
                    "--text=" + text, "--flavor=woff2", "--layout-features=*",
                    "--no-hinting", "--desubroutinize", "--output-file=" + out],
                   check=True, capture_output=True)


def main():
    text = collect_chars()
    print("글자 %d자 유지" % len(text))
    css = []
    tmp = os.path.join(HERE, "_sub")
    os.makedirs(tmp, exist_ok=True)
    for fname, family, weight in FACES:
        src = os.path.join(FONTDIR, fname)
        out = os.path.join(tmp, fname)
        subset(src, text, out)
        b64 = base64.b64encode(open(out, "rb").read()).decode()
        print("  %-26s %5d KB -> %4d KB" % (fname, os.path.getsize(src) // 1024,
                                            len(b64) * 3 // 4 // 1024))
        css.append("@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
                   "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}"
                   % (family, weight, b64))
    block = "".join(css)
    for f in FILES:
        p = os.path.join(HERE, f)
        s = io.open(p, encoding="utf-8").read()
        s = re.sub(r"/\*__FONTS__\*/.*?/\*__FONTS_END__\*/",
                   "/*__FONTS__*/" + block + "/*__FONTS_END__*/", s, flags=re.S)
        io.open(p, "w", encoding="utf-8").write(s)
        print("  심음:", f, os.path.getsize(p) // 1024, "KB")


if __name__ == "__main__":
    main()
