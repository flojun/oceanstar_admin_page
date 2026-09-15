# -*- coding: utf-8 -*-
"""확정안의 구성은 그대로 두고 색만 바꾼 3가지.

색은 전부 :root 변수라, 뒤에 덮어쓰는 블록 하나만 끼워 넣으면 레이아웃은 한 픽셀도
움직이지 않는다. 그래서 비교할 때 오직 색만 보게 된다.

버튼 글자가 흰색이므로 --primary 는 흰 글자 대비 4.5:1 이상을 지킨다.
"""
import io
import re
from build_v2_boards import voyage

PALETTES = {
    # 같은 파랑 계열이되 훨씬 진하고 선명하게. 지금 색이 흐릿해서 싫었다면 이쪽.
    "Cobalt": ("색-1 · 코발트", {
        "navy": "#0B2B57", "primary": "#1B57C4", "primary-hover": "#144AAC",
        "cyan": "#3B8FE8", "sky": "#9CC8F5", "badge": "#E4EDFC",
        "soft": "#F3F7FE",
        "text": "#46536B", "soft-text": "#53617A", "muted": "#7A879E",
        "on-navy": "#AEC6EA",
        "border": "#E2E9F5", "inner": "#EDF2FA", "outline": "#B8CDF0",
        "e1": "0 1px 2px rgba(27,87,196,.06), 0 2px 6px rgba(27,87,196,.05)",
        "e2": "0 1px 2px rgba(27,87,196,.07), 0 8px 20px rgba(27,87,196,.11)",
        "e3": "0 2px 6px rgba(27,87,196,.10), 0 22px 44px rgba(27,87,196,.17)",
        "e-navy": "0 2px 6px rgba(11,43,87,.22), 0 22px 44px rgba(11,43,87,.30)",
        "surface-lit": "linear-gradient(180deg,#ffffff 0%,#f7faff 100%)",
        "plane": "linear-gradient(180deg,#ffffff 0%,#fafcff 6%,#f3f7fe 16%,#f3f7fe 100%)",
        "sh-cta": "0 2px 4px rgba(27,87,196,.24), 0 10px 22px rgba(27,87,196,.30)",
    }),
    # 파랑은 사진에만 맡기고 UI 강조색은 보색인 산호빛으로.
    "Coral": ("색-2 · 선셋 코랄", {
        "navy": "#1B3A4B", "primary": "#CB4B26", "primary-hover": "#AC3C1B",
        "cyan": "#E8894A", "sky": "#F6C4A8", "badge": "#FBE8DF",
        "soft": "#FDF6F2",
        "text": "#4C5560", "soft-text": "#5A6570", "muted": "#8A939C",
        "on-navy": "#B9CEDB",
        "border": "#EFE6E1", "inner": "#F6EFEB", "outline": "#E8B79E",
        "e1": "0 1px 2px rgba(148,84,58,.06), 0 2px 6px rgba(148,84,58,.05)",
        "e2": "0 1px 2px rgba(148,84,58,.08), 0 8px 20px rgba(148,84,58,.12)",
        "e3": "0 2px 6px rgba(148,84,58,.11), 0 22px 44px rgba(148,84,58,.18)",
        "e-navy": "0 2px 6px rgba(27,58,75,.22), 0 22px 44px rgba(27,58,75,.30)",
        "surface-lit": "linear-gradient(180deg,#ffffff 0%,#fefaf7 100%)",
        "plane": "linear-gradient(180deg,#ffffff 0%,#fefbf9 6%,#fdf6f2 16%,#fdf6f2 100%)",
        "sh-cta": "0 2px 4px rgba(203,75,38,.24), 0 10px 22px rgba(203,75,38,.30)",
    }),
    # 회색조가 지배하고 파랑은 버튼·가격에만. 사진이 화면에서 유일한 채도가 된다.
    "Mono": ("색-3 · 모노 + 터콰이즈", {
        "navy": "#16202B", "primary": "#00707F", "primary-hover": "#005C69",
        "cyan": "#12B5C9", "sky": "#8FE0E9", "badge": "#E3F4F6",
        "soft": "#F5F7F8",
        "text": "#4A5560", "soft-text": "#59646F", "muted": "#858E97",
        "on-navy": "#AFC2C9",
        "border": "#E5E8EA", "inner": "#EFF1F3", "outline": "#B6D9DE",
        "e1": "0 1px 2px rgba(22,32,43,.06), 0 2px 6px rgba(22,32,43,.05)",
        "e2": "0 1px 2px rgba(22,32,43,.07), 0 8px 20px rgba(22,32,43,.10)",
        "e3": "0 2px 6px rgba(22,32,43,.09), 0 22px 44px rgba(22,32,43,.15)",
        "e-navy": "0 2px 6px rgba(22,32,43,.24), 0 22px 44px rgba(22,32,43,.30)",
        "surface-lit": "linear-gradient(180deg,#ffffff 0%,#fafbfc 100%)",
        "plane": "linear-gradient(180deg,#ffffff 0%,#fbfcfd 6%,#f5f7f8 16%,#f5f7f8 100%)",
        "sh-cta": "0 2px 4px rgba(0,112,127,.24), 0 10px 22px rgba(0,112,127,.30)",
    }),
}


def recolor(html, title, tokens):
    block = ":root{%s}" % "".join("--%s:%s;" % (k, v) for k, v in tokens.items())
    html = html.replace("</style>", block + "</style>", 1)
    return re.sub(r"<title>[^<]*</title>", "<title>%s</title>" % title, html, count=1)


if __name__ == "__main__":
    base = voyage()
    for name, (title, tokens) in PALETTES.items():
        io.open(name + ".dc.html", "w", encoding="utf-8").write(recolor(base, title, tokens))
        print(name, title)
