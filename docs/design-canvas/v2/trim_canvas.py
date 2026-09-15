# -*- coding: utf-8 -*-
"""캔버스에 오션스타 홈(데스크탑·모바일)과 새-8 만 남긴다.

.dc.html 파일 자체는 지우지 않는다. 빌더가 그대로 있어 언제든 되돌릴 수 있고,
파일을 지워봐야 캔버스에서 안 보이는 건 매한가지다.
"""
import io
import json

KEEP = ["Main.dc.html", "Voyage2_M.dc.html", "New8.dc.html"]

# 남길 주석은 제목 첫 줄로 고른다. 왼쪽 세로단의 안내글과 새-8 설명만 남긴다.
KEEP_NOTES = ["남긴 세 가지, 읽는 법",
              "이 디자인에 들어간 것",
              "반드시 확인해 주실 것",
              "아직 답을 못 받은 것",
              "새-8 · 스크롤 투어"]

LEAD = """남긴 두 가지, 읽는 법

왼쪽부터 오션스타 홈(데스크탑 → 모바일), 그리고 새-8 · 스크롤 투어입니다.

오션스타 홈
확정해 둔 안입니다. 히어로 영상, 통계 바, 5가지 상품 카드까지 실제 문구와 사진 그대로입니다. 모바일은 같은 안의 375 폭 판입니다.

새-8 · 스크롤 투어
새-6 의 배치를 뼈대로 쓰되 투어 UI 로 다시 짜고, 스크롤 연출을 전제로 설계한 안입니다. 캔버스는 정지 화면이라 움직임이 안 보입니다. 함께 드린 '새-8_스크롤확인.html' 을 브라우저로 열면 실제로 굴려볼 수 있습니다.

나머지 시안은 캔버스에서 내렸습니다. 빌더 스크립트는 그대로 있어 언제든 다시 올릴 수 있습니다."""


def main():
    p = "canvas.json"
    d = json.load(io.open(p, encoding="utf-8"))
    before = len(d["artboards"]), len(d["annotations"])

    d["artboards"] = [a for a in d["artboards"] if a["file"] in KEEP]
    d["artboards"].sort(key=lambda a: KEEP.index(a["file"]))
    assert len(d["artboards"]) == len(KEEP), [a["file"] for a in d["artboards"]]

    d["annotations"] = [a for a in d["annotations"]
                        if any(a["text"].startswith(k) for k in KEEP_NOTES)]
    assert len(d["annotations"]) == len(KEEP_NOTES), len(d["annotations"])

    # 한 줄로 다시 세운다. 가운데가 비어 있으면 캔버스가 휑해 보인다.
    x = 0
    for a in d["artboards"]:
        a["x"], a["y"] = x, 0
        x += a["w"] + 160
    new8 = d["artboards"][-1]

    for note in d["annotations"]:
        if note["text"].startswith("남긴 세 가지"):
            note["text"] = LEAD
        elif note["text"].startswith("새-8"):
            note["x"], note["y"], note["w"] = new8["x"], -640, new8["w"]

    json.dump(d, io.open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("아트보드 %d -> %d, 주석 %d -> %d"
          % (before[0], len(d["artboards"]), before[1], len(d["annotations"])))
    for a in d["artboards"]:
        print("  %-18s x=%-6d h=%-5d %s" % (a["file"], a["x"], a["h"], a["title"]))


if __name__ == "__main__":
    main()
