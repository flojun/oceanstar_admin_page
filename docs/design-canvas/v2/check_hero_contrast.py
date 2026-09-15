# -*- coding: utf-8 -*-
"""새-8 히어로: 사진 위 활자가 실제로 읽히는지 잰다.

전에는 스크림을 파이썬으로 다시 합성해서 쟀다. 스크림이 셋(왼쪽 96도 흰 그라데이션,
위 흰 스크림, 아래 흰 페이드)으로 늘면서 그 방식은 어긋나기 시작했다. 각도 있는
그라데이션을 손으로 재현하는 건 틀리기 쉽고, 틀려도 조용히 통과한다.

그래서 브라우저에 실제로 그리게 하고 그 픽셀을 잰다.
· 활자를 visibility:hidden 으로 감춘 판을 찍어 순수 배경을 얻는다
· 보이는 판에서 글자가 실제로 덮는 사각형을 Range.getClientRects 로 잰다
· 그 사각형 안에서 가장 불리한 픽셀(글자색과 가장 가까운 쪽)로 대비를 계산한다

기준은 WCAG. 24px 이상이면 큰 글자로 보고 3:1, 그 아래는 4.5:1.
"""
import glob
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
# 파일명을 인자로 넘기면 그 아트보드를 잰다. 없으면 새-8.
SRC = sys.argv[1] if len(sys.argv) > 1 else "New8.dc.html"
W, H = 1440, 716

# (셀렉터, 이름, 글자색, 최소 대비, 막을지)
TARGETS = [
    ('.hero nav a:first-child', '헤더 Home 16px', '#0A3F66', 4.5, True),
    ('.hero nav a:nth-child(3)', '헤더 FAQ 16px', '#44586A', 4.5, True),
    # 배지는 불투명 알약(#E4F3FA) 위라 스크림과 무관하다. 정적으로 6.00:1.
    ('.hero-txt h1', '대제목 56px', '#0A3F66', 3.0, True),
    ('.hero-txt h1 .accent', '대제목 강조 56px', '#00506F', 3.0, True),
    ('.hero-txt p', '소개문구 18px', '#2C3E50', 4.5, True),
]

PROBE = """
<div id="__p" data-v="[]"></div>
<script>
  setTimeout(function () {
    var hero = document.querySelector('.hero').getBoundingClientRect();
    var sels = %s, out = [];
    sels.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) { out.push(null); return; }
      var r = document.createRange();
      r.selectNodeContents(el);
      var bs = r.getClientRects(), boxes = [];
      for (var i = 0; i < bs.length; i++) {
        var b = bs[i];
        if (b.width < 2 || b.height < 2) continue;
        boxes.push([Math.round(b.left - hero.left), Math.round(b.top - hero.top),
                    Math.round(b.right - hero.left), Math.round(b.bottom - hero.top)]);
      }
      out.push(boxes);
    });
    document.getElementById('__p').setAttribute('data-v', JSON.stringify(out));
  }, 900);
</script>"""

HIDE = ("<style>.hero-txt,.hero header{visibility:hidden!important}</style>")
BASE = ("<style>helmet,title{display:none}html,body{margin:0}"
        "*{animation:none!important}</style>")


def stage():
    d = tempfile.mkdtemp(prefix="herochk_")
    for f in (glob.glob("../img/*.jpg") + glob.glob("../img/*.webp")
              + glob.glob("../img/*.png")):
        shutil.copy2(f, d)
    return d


def prep(d, name, extra):
    h = io.open(SRC, encoding="utf-8").read()
    h = h.replace('<script src="./support.js"></script>', "")
    h = h.replace("</helmet>", "</helmet>" + BASE + extra, 1)
    p = os.path.join(d, name)
    io.open(p, "w", encoding="utf-8").write(h)
    return p


def chrome(args, timeout=180):
    return subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                           "--virtual-time-budget=9000"] + args,
                          capture_output=True, timeout=timeout)


def boxes(d):
    """글자가 실제로 덮는 사각형. 요소 폭으로 재면 활자 없는 바다까지 섞인다."""
    h = io.open(SRC, encoding="utf-8").read()
    h = h.replace('<script src="./support.js"></script>', "")
    h = h.replace("</body>", PROBE % json.dumps([t[0] for t in TARGETS]) + "</body>", 1)
    p = os.path.join(d, "probe.html")
    io.open(p, "w", encoding="utf-8").write(h)
    r = chrome(["--window-size=%d,%d" % (W, H + 200), "--dump-dom", p])
    m = re.search(r'id="__p" data-v="(.*?)"></div>', r.stdout.decode("utf-8", "replace"))
    assert m, "글자 위치를 못 쟀다"
    return json.loads(m.group(1).replace("&quot;", '"'))


def background(d):
    """활자를 감춘 판. 이게 글자 뒤에 실제로 깔리는 색이다."""
    p = prep(d, "bg.html", HIDE)
    png = os.path.join(d, "bg.png")
    chrome(["--window-size=%d,%d" % (W, H), "--screenshot=" + png, p])
    return np.asarray(Image.open(png).convert("RGB"), dtype=float) / 255.0


def lum(rgb):
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return 0.2126 * c[..., 0] + 0.7152 * c[..., 1] + 0.0722 * c[..., 2]


def fg_lum(hex_):
    v = np.array([int(hex_[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0
    return float(lum(v[None, None, :])[0, 0])


def worst(bg, box_list, lf):
    """글자색과 밝기가 가장 가까운 픽셀이 최악이다. 어두운 글자면 가장 어두운 배경."""
    ls = []
    for x0, y0, x1, y1 in box_list:
        patch = bg[max(y0, 0):min(y1, H), max(x0, 0):min(x1, W)]
        if patch.size:
            ls.append(lum(patch).ravel())
    l = np.concatenate(ls)
    lb = np.percentile(l, 1 if lf < 0.5 else 99)   # 어두운 글자는 어두운 배경이 최악
    return (max(lf, lb) + 0.05) / (min(lf, lb) + 0.05)


def main():
    d = stage()
    bg = background(d)
    got = boxes(d)
    bad = []
    for (sel, name, fg, need, blocking), bx in zip(TARGETS, got):
        assert bx, "%s 를 못 찾았다" % sel
        r = worst(bg, bx, fg_lum(fg))
        mark = "" if r >= need else "  <- 미달"
        print("  %-16s %-8s %.2f:1  (필요 %.1f)%s" % (name, fg, r, need, mark))
        if r < need and blocking:
            bad.append("%s %.2f:1 < %.1f:1" % (name, r, need))
    shutil.rmtree(d, ignore_errors=True)
    if bad:
        sys.exit("히어로 활자가 안 읽힌다: " + "; ".join(bad))
    print("히어로 대비 ok")


if __name__ == "__main__":
    main()
