# -*- coding: utf-8 -*-
"""캔버스에 새-8(데스크탑·모바일)만 남긴다.

.dc.html 파일은 지우지 않는다. 빌더가 그대로 있어 언제든 되돌릴 수 있고,
파일을 지워봐야 캔버스에서 안 보이는 건 매한가지다.
"""
import io
import json

KEEP = ["New8.dc.html", "New8_M.dc.html"]
KEEP_NOTES = ["read-me", "check-ai-background", "open-questions",
              "new8-scroll", "new8-m"]

LEAD = """새-8 · 스크롤 투어, 읽는 법

왼쪽이 데스크탑 1440, 오른쪽이 모바일 375 입니다. 다른 안은 캔버스에서 내렸습니다.

구성
히어로 영상 → 지표 → 오션스타 추천 프로그램(사진↔활자 교차) → 푸터

히어로는 홈과 같은 방식입니다. 어두운 스크림 대신 왼쪽을 흰색으로 덮고 네이비 활자를 앉혀서, 사진을 어둡게 만들지 않고도 글자가 읽힙니다. 영상은 밝기 손대지 않은 원본에 채도만 살짝 올렸습니다.

상품은 펼쳐 보는 방식 하나만 둡니다. 사진은 둥근 액자에 넣고 뒤로 하늘색 판을 어긋나게 깔았고, 오른쪽에 운영 시간 / 정원 / 요금 기준 세 칸과 포함 사항 체크 목록, 값 옆에 예약 버튼을 뒀습니다. 표의 값은 지어낸 게 아니라 기존 상품 데이터에서 읽어온 것이고, 없는 값은 [운영 시간 확정 필요] 표기를 그대로 노출합니다.

푸터는 운영 중인 사이트 맨 아래 내용 그대로입니다.

캔버스와 PDF 는 정지 화면이라 스크롤 연출이 안 보입니다. 함께 드린 '새-8_스크롤확인.html' 과 '새-8_모바일_스크롤확인.html' 을 브라우저로 열면 실제로 굴려볼 수 있습니다.

빌더 스크립트는 그대로 있어 내린 안들은 언제든 다시 올릴 수 있습니다."""


def main():
    p = "canvas.json"
    d = json.load(io.open(p, encoding="utf-8"))
    before = len(d["artboards"]), len(d["annotations"])

    d["artboards"] = [a for a in d["artboards"] if a["file"] in KEEP]
    d["artboards"].sort(key=lambda a: KEEP.index(a["file"]))
    assert len(d["artboards"]) == len(KEEP), [a["file"] for a in d["artboards"]]

    d["annotations"] = [a for a in d["annotations"] if a["id"] in KEEP_NOTES]
    assert len(d["annotations"]) == len(KEEP_NOTES), [a["id"] for a in d["annotations"]]

    # 한 줄로 다시 세운다. 가운데가 비어 있으면 캔버스가 휑해 보인다.
    x = 0
    for a in d["artboards"]:
        a["x"], a["y"] = x, 0
        x += a["w"] + 160
    for note in d["annotations"]:
        if note["id"] == "read-me":
            note["text"] = LEAD
        elif note["id"] in ("new8-scroll", "new8-m"):
            board = d["artboards"][0 if note["id"] == "new8-scroll" else 1]
            note["x"], note["y"], note["w"] = board["x"], -640, board["w"]

    json.dump(d, io.open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("아트보드 %d -> %d, 주석 %d -> %d"
          % (before[0], len(d["artboards"]), before[1], len(d["annotations"])))
    for a in d["artboards"]:
        print("  %-18s x=%-6d w=%-5d h=%d" % (a["file"], a["x"], a["w"], a["h"]))


if __name__ == "__main__":
    main()
