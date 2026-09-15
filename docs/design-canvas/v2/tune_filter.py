# -*- coding: utf-8 -*-
"""히어로 영상 필터 후보를 실측한다.

밝기를 내리면 사진은 차분해지지만 배경이 어두워져 네이비 활자의 대비가 같이 떨어진다.
어두운 글자는 밝은 배경이 유리하기 때문이다. 그래서 '얼마나 차분해졌나'와
'활자가 아직 읽히나'를 같이 찍어야 고를 수 있다.
"""
import io
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

import check_hero_contrast as chk

BUILDER = "build_new8.py"
SIG = re.compile(r"filter:brightness\([\d.]+\) saturate\([\d.]+\) contrast\(\.?[\d.]+\)")

# (brightness, saturate, contrast)
CANDIDATES = [(1.16, 1.12, .94),   # 지금
              (1.08, 1.10, .97),
              (1.02, 1.10, 1.00),
              (1.00, 1.06, 1.00),
              (0.96, 1.06, 1.02)]


def set_filter(b, s_, c):
    txt = "filter:brightness(%.2f) saturate(%.2f) contrast(%s)" % (
        b, s_, ("%.2f" % c).lstrip("0") if c < 1 else "%.2f" % c)
    src = io.open(BUILDER, encoding="utf-8").read()
    out, n = SIG.subn(txt, src)
    assert n == 1, "filter 를 못 찾았다 (%d회)" % n
    io.open(BUILDER, "w", encoding="utf-8").write(out)
    subprocess.run([sys.executable, BUILDER], check=True, capture_output=True)
    return txt


def stats(d):
    """스크림 없는 순수 영상의 밝기와, 흰색으로 날아간 픽셀 비율."""
    bare = chk.prep(d, "bare.html",
                    "<style>.hero-left,.hero-top,.hero-bot{display:none!important}</style>")
    png = d + "/bare.png"
    chk.chrome(["--window-size=%d,%d" % (chk.W, chk.H), "--screenshot=" + png, bare])
    a = np.asarray(Image.open(png).convert("RGB"), dtype=float) / 255.0
    return chk.lum(a).mean(), (a.max(axis=2) >= 254 / 255).mean() * 100


def main():
    print("%-30s %-9s %-8s %s" % ("필터", "영상밝기", "탄픽셀", "활자 대비 여유"))
    for b, s_, c in CANDIDATES:
        set_filter(b, s_, c)
        d = chk.stage()
        bright, blown = stats(d)
        bg, boxes = chk.background(d), chk.boxes(d)
        gap, worstname = 99.0, ""
        for (sel, name, fg, need, _), bx in zip(chk.TARGETS, boxes):
            r = chk.worst(bg, bx, chk.fg_lum(fg))
            if r - need < gap:
                gap, worstname = r - need, "%s %.2f" % (name.split()[0], r)
        shutil.rmtree(d, ignore_errors=True)
        print("  b%.2f s%.2f c%.2f            %.3f      %.2f%%     %+.2f  (%s)%s"
              % (b, s_, c, bright, blown, gap, worstname,
                 "  <- 미달" if gap < 0 else ""))


if __name__ == "__main__":
    main()
