# -*- coding: utf-8 -*-
"""히어로 영상을 끊김 없이 도는 루프로 만든다.

왕복 재생(핑퐁)은 위치는 이어지지만 속도가 뒤집혀서, 흔들리던 배가 되감기는 순간
튕겨 오르는 것처럼 보인다. 그래서 방향은 한 쪽으로 두고,
1) 첫 프레임과 가장 닮은 뒤쪽 프레임을 찾아 거기서 자르고
2) 남는 꼬리 몇 장을 머리에 겹쳐 녹여 이음매를 지운다.
"""
import glob, os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image

CHROME_FF = "ffmpeg"
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img")


def extract(src, vf, tmp):
    subprocess.run([CHROME_FF, "-v", "error", "-i", src, "-vf", vf,
                    os.path.join(tmp, "f%04d.png")], check=True)
    return sorted(glob.glob(os.path.join(tmp, "f*.png")))


def signature(path, box=None, w=48):
    """거칠게 줄여서 물결 잔무늬를 지우고 피사체의 위치·기울기만 남긴다.
    잔무늬까지 비교하면 매 프레임이 다르게 나와 진짜 이음매를 못 찾는다."""
    im = Image.open(path).convert("L")
    if box:
        W, H = im.size
        im = im.crop((int(W * box[0]), int(H * box[1]), int(W * box[2]), int(H * box[3])))
    im = im.resize((w, max(1, round(im.height * w / im.width))), Image.BOX)
    return np.asarray(im, dtype=np.float32)


def best_loop(frames, min_frames, tail, box=None):
    """시작 지점 s와 길이 n을 함께 찾는다. 0번에 묶어두면 맞는 짝이 없을 때가 많다.
    이음매는 (s,s+n) 한 쌍만이 아니라 그 다음 쌍까지 맞아야 자연스럽다."""
    sigs = [signature(f, box) for f in frames]
    total = len(frames)
    best = None
    for s in range(0, total - min_frames - tail):
        for n in range(min_frames, total - s - tail):
            score = (np.abs(sigs[s + n] - sigs[s]).mean()
                     + np.abs(sigs[s + n + 1] - sigs[s + 1]).mean()) / 2
            if best is None or score < best[2]:
                best = (s, n, score)
    return best


def build(frames, s, n, tail, out_dir):
    """앞 tail장을 꼬리 프레임과 겹쳐 녹인다. 방향은 계속 한 쪽이다."""
    os.makedirs(out_dir, exist_ok=True)
    for j in range(n):
        if j < tail:
            t = (j + 1) / (tail + 1)
            a = Image.open(frames[s + n + j]).convert("RGB")   # 꼬리
            b = Image.open(frames[s + j]).convert("RGB")       # 머리
            im = Image.blend(a, b, t)
        else:
            im = Image.open(frames[s + j]).convert("RGB")
        im.save(os.path.join(out_dir, "o%04d.png" % j))


def encode(out_dir, fps, quality, dst, width):
    subprocess.run([CHROME_FF, "-v", "error", "-framerate", str(fps),
                    "-i", os.path.join(out_dir, "o%04d.png"),
                    "-vf", "scale=%d:-2" % width,
                    "-loop", "0", "-q:v", str(quality), "-compression_level", "6",
                    "-y", dst], check=True)


def track(frames, box, search=8, w=200):
    """각 프레임이 첫 프레임 대비 얼마나 밀렸는지 정수 픽셀로 찾는다."""
    sigs = [signature(f, box, w) for f in frames]
    ref = sigs[0]
    H, W = ref.shape
    m = search
    core = ref[m:H - m, m:W - m]
    out = []
    for sg in sigs:
        best = None
        for dy in range(-m, m + 1):
            for dx in range(-m, m + 1):
                cand = sg[m + dy:H - m + dy, m + dx:W - m + dx]
                d = np.abs(cand - core).mean()
                if best is None or d < best[0]:
                    best = (d, dx, dy)
        out.append((best[1], best[2]))
    return np.array(out, dtype=np.float64)


def stabilize(frames, box, out_dir, margin=16):
    """느린 드리프트만 걷어낸다. 프레임마다의 흔들림은 그대로 둬야 배가 살아 있다."""
    os.makedirs(out_dir, exist_ok=True)
    sh = track(frames, box)
    t = np.arange(len(frames), dtype=np.float64)
    # 1차 추세 = 드리프트. 잔차 = 진짜 흔들림이므로 건드리지 않는다.
    trend = np.stack([np.polyval(np.polyfit(t, sh[:, k], 1), t) for k in (0, 1)], axis=1)
    im0 = Image.open(frames[0])
    W, H = im0.size
    # 신호는 축소본 기준이므로 원본 배율로 되돌린다
    scale = W / signature(frames[0], box, 200).shape[1] * (box[2] - box[0] if box else 1)
    out = []
    for i, f in enumerate(frames):
        dx, dy = -trend[i] * scale
        im = Image.open(f).convert("RGB").transform(
            (W, H), Image.AFFINE, (1, 0, -dx, 0, 1, -dy), Image.BICUBIC)
        im = im.crop((margin, margin, W - margin, H - margin))
        p = os.path.join(out_dir, "s%04d.png" % i)
        im.save(p)
        out.append(p)
    drift = trend[-1] - trend[0]
    print("   드리프트 보정: 가로 %.1f px, 세로 %.1f px" % (drift[0] * scale, drift[1] * scale))
    return out


def run(src, vf, fps, width, quality, dst, min_sec=1.8, tail=12, box=None):
    tmp = tempfile.mkdtemp(prefix="loop_")
    try:
        frames = extract(os.path.join(IMG, src),
                         "%s,fps=%d,scale=%d:-2" % (vf, fps, width + 40), tmp)
        if box:
            frames = stabilize(frames, box, os.path.join(tmp, "stab"))
        s, n, score = best_loop(frames, int(min_sec * fps), tail, box)
        build(frames, s, n, tail, os.path.join(tmp, "out"))
        out = os.path.join(IMG, dst)
        encode(os.path.join(tmp, "out"), fps, quality, out, width)
        print("%-16s 원본 %d장 -> %d번부터 %d장 (%.2f초), 이음매 차이 %.2f, %d KB"
              % (dst, len(frames), s, n, n / fps, score, os.path.getsize(out) // 1024))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    # 배가 있는 오른쪽 영역만 본다. 왼쪽 빈 바다는 물결뿐이라 판단을 흐린다.
    pass  # 보트는 시작·끝 프레임을 맞춰 새로 뽑았으므로 이 보정이 필요 없다
    run("turtle_motion.mp4", "null", 10, 1280, 42, "hero_turtle.webp")
