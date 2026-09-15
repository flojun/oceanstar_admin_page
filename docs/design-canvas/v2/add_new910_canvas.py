# -*- coding: utf-8 -*-
"""새-9, 새-10 을 캔버스 오른쪽에 붙인다."""
import io
import json

NOTE9 = """새-9 · 스플릿

새-8 의 성격(밝은 화면, 브랜드 파랑, 같은 상품 데이터와 스펙 규칙, 같은 푸터, 스크롤 연출)은 두고 뼈대만 다르게 짠 안입니다.

히어로 — 화면을 세로로 가릅니다
왼쪽 560px 흰 패널에 활자, 오른쪽에 영상. 활자가 사진 밖에 있으니 흰 스크림이 필요 없고, 사진은 100% 그대로 나옵니다. 계속 걸리셨던 '그라데이션이 사진을 가린다'가 구조적으로 사라집니다. 영상은 오른쪽 끝에 붙여 배가 통째로 들어오게 했습니다.

상품 — 2단 카드 그리드
훑어보기 좋고 페이지가 가장 짧습니다(4,409px). 프라이빗 단독 대관만 아래 열을 통으로 쓰고 사진을 옆에 세워 성격이 다르다는 걸 드러냅니다. 배지는 사진 왼쪽 위에 반투명으로 얹었습니다.

걸리는 점
사진이 화면의 절반만 쓰므로 새-8 만큼의 몰입감은 없습니다. 대신 정보가 빨리 읽힙니다."""

NOTE10 = """새-10 · 항해

같은 재료로 짠 다른 뼈대입니다.

히어로 — 영상을 전폭으로, 활자는 흰 카드에
영상 560px 를 손대지 않고 깔고, 그 아래 걸치도록 흰 카드를 올려 활자를 담았습니다. 사진 위에 글자가 없으니 여기도 스크림이 필요 없습니다. 배가 전폭으로 다 보이는 건 세 안 중 이 안뿐입니다.

상품 — 세로 항로
다섯 곳을 순서대로 들르는 항해처럼 읽힙니다. 왼쪽에 번호 원과 선이 내려가고 오른쪽에 사진이 붙습니다. 선은 스크롤에 맞춰 위에서 아래로 자라 내려갑니다 — 캔버스와 PDF 는 정지 화면이라 다 그려진 상태로 보입니다.

걸리는 점
페이지가 가장 깁니다(4,905px). 번호가 붙는 구조라 상품을 늘리거나 순서를 바꿀 때 '차례'라는 인상이 함께 바뀝니다.

세 안 비교
새-8 은 사진 위에 활자를 얹어 몰입감이 가장 크고, 새-9 는 정보가 가장 빨리 읽히고, 새-10 은 사진이 가장 크게 나옵니다."""


def main():
    p = "canvas.json"
    d = json.load(io.open(p, encoding="utf-8"))
    d["artboards"] = [a for a in d["artboards"]
                      if a["file"] not in ("New9.dc.html", "New10.dc.html")]
    d["annotations"] = [a for a in d["annotations"] if a["id"] not in ("new9", "new10")]

    right = max(a["x"] + a["w"] for a in d["artboards"])
    for fname, title, h, nid, note in (
            ("New9.dc.html", "새-9 · 스플릿 — 데스크탑 1440", 4500, "new9", NOTE9),
            ("New10.dc.html", "새-10 · 항해 — 데스크탑 1440", 5000, "new10", NOTE10)):
        x = right + 160
        d["artboards"].append({"file": fname, "title": title,
                               "x": x, "y": 0, "w": 1440, "h": h})
        d["annotations"].append({"id": nid, "x": x, "y": -640, "w": 1440, "text": note})
        right = x + 1440

    json.dump(d, io.open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    for a in d["artboards"]:
        print("  %-18s x=%-6d w=%-5d h=%d" % (a["file"], a["x"], a["w"], a["h"]))


if __name__ == "__main__":
    main()
