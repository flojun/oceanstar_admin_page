# -*- coding: utf-8 -*-
"""스타 인증샷 격자를 타일 15개로 자른다.

원본은 운영 중인 OTA 상세페이지 캡처다. 그 안의 사진 격자만(흰 카드 여백 제외)
잘라 낸 뒤, 3열 5행으로 나누고 아래쪽 이름표 띠를 떼어 낸다. 보드는 이름을
HTML 로 찍으므로 사진에 이름이 또 들어가면 겹친다.

두 가지 입력을 모두 받는다.
  · 원본 캡처(가로 459px)          -> python slice_stars.py 28.jpg --full
  · 업스케일한 격자만 있는 이미지   -> python slice_stars.py grid_2k.png

격자 안에서의 타일 위치는 비율로 잡는다. 업스케일 배율이 얼마든 같은 자리가
나온다. 비율은 459px 원본에서 흰 여백을 찾아 실측한 값이다.
"""
import io, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

# 459px 원본 안에서 사진 격자가 차지하는 자리
FULL_GRID = (27, 231, 432, 1068)          # 405 x 837

# 격자 안에서의 열·행 (405 x 837 기준)
GW, GH = 405, 837
COLS = [(0, 132), (136, 269), (273, 405)]
ROWS = [(0, 164), (168, 332), (337, 501), (505, 669), (673, 837)]
CHIP = 27                                  # 타일 아래 이름표 띠 높이 (164 중)


def slice_grid(grid):
    """격자 이미지 하나를 타일 15개로. 원본 비율 그대로 잘라내기만 한다."""
    sx, sy = grid.width / GW, grid.height / GH
    out = []
    for y0, y1 in ROWS:
        for x0, x1 in COLS:
            out.append(grid.crop((
                round(x0 * sx), round(y0 * sy),
                round(x1 * sx), round((y1 - CHIP) * sy),
            )))
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit("사용법: slice_stars.py <이미지> [--full]")
    src = Image.open(sys.argv[1]).convert("RGB")
    if "--full" in sys.argv:
        src = src.crop(FULL_GRID)
    tiles = slice_grid(src)
    assert len(tiles) == 15, len(tiles)
    total = 0
    for i, t in enumerate(tiles, 1):
        p = os.path.join(HERE, f"star{i:02d}.webp")
        # 보드에서 쓰는 크기는 165~250px 다. 그보다 크게 담아 둘 이유가 없고,
        # 너무 크면 아티팩트 용량만 먹는다. 긴 변 640 을 넘으면 줄인다.
        if t.width > 640:
            t = t.resize((640, round(640 * t.height / t.width)), Image.LANCZOS)
            t.save(p, "WEBP", quality=92, method=6)
        else:
            t.save(p, "WEBP", lossless=True, method=6)
        total += os.path.getsize(p)
    print(f"{len(tiles)}장 저장 · 타일 {tiles[0].size} · 합계 {total/1024:.0f}KB")


if __name__ == "__main__":
    main()
