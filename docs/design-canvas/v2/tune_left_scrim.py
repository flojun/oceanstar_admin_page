# -*- coding: utf-8 -*-
"""왼쪽 흰 스크림을 얼마까지 걷어낼 수 있는지 후보별로 실측한다.

스크림을 옅게 할수록 사진(배·도시·바다)이 살고 활자는 죽는다. 눈으로 고르면
둘 중 하나를 반드시 놓친다. 그래서 후보마다 실제로 렌더해서 사진이 얼마나
살아났는지(왼쪽 절반의 원본 대비 유지율)와 활자 대비를 같이 찍는다.
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
SIG = re.compile(r"def left_scrim\(hold=[\d.]+, gone=[\d.]+, amax=[\d.]+\):")

# (hold, gone, amax) — 유지 구간 / 사라지는 지점 / 최대 흰색
CANDIDATES = [(.30, .72, .95),   # 지금
              (.18, .58, .78),
              (.15, .54, .72),
              (.12, .50, .66),
              (.09, .46, .60)]


def set_params(hold, gone, amax):
    s = io.open(BUILDER, encoding="utf-8").read()
    s2 = SIG.sub("def left_scrim(hold=%.2f, gone=%.2f, amax=%.2f):" % (hold, gone, amax), s)
    assert s2 != s, "left_scrim 서명을 못 찾았다"
    io.open(BUILDER, "w", encoding="utf-8").write(s2)
    subprocess.run([sys.executable, BUILDER], check=True, capture_output=True)


def photo_left(d):
    """왼쪽 절반이 원본 사진 대비 얼마나 살아 있는지. 흰색으로 덮일수록 0 에 가깝다."""
    bare = chk.prep(d, "bare.html", "<style>.hero-left{display:none!important}</style>")
    png = d + "/bare.png"
    chk.chrome(["--window-size=%d,%d" % (chk.W, chk.H), "--screenshot=" + png, bare])
    a = np.asarray(Image.open(png).convert("RGB"), dtype=float) / 255.0
    b = chk.background(d)                       # 스크림 다 얹힌 판
    # 흰색이 가장 두껍게 깔리는 왼쪽(x 0~460). 와이키키 스카이라인이 여기 있다.
    boat = slice(0, 460)
    # 표준편차 비율 = 사진의 결이 얼마나 남았나. 평균 밝기보다 '보이는 정도'에 가깝다.
    return float(chk.lum(b[:, boat]).std() / chk.lum(a[:, boat]).std())


def main():
    print("%-22s %-8s %s" % ("후보 (hold/gone/amax)", "왼쪽 살아남음", "활자 대비"))
    for hold, gone, amax in CANDIDATES:
        set_params(hold, gone, amax)
        d = chk.stage()
        keep = photo_left(d)
        bg, boxes = chk.background(d), chk.boxes(d)
        rows, worst_gap = [], 99.0
        for (sel, name, fg, need, _), bx in zip(chk.TARGETS, boxes):
            r = chk.worst(bg, bx, chk.fg_lum(fg))
            rows.append("%s %.2f" % (name.split()[0], r))
            worst_gap = min(worst_gap, r - need)
        shutil.rmtree(d, ignore_errors=True)
        flag = " <- 미달" if worst_gap < 0 else ""
        print("  %.2f/%.2f/%.2f        %5.1f%%   %s   (여유 %+.2f)%s"
              % (hold, gone, amax, keep * 100, " ".join(rows), worst_gap, flag))


if __name__ == "__main__":
    main()
