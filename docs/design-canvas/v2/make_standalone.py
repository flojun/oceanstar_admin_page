# -*- coding: utf-8 -*-
"""캔버스·PDF 는 정지 화면이라 스크롤 연출이 안 보인다.
사진까지 안에 넣어 브라우저에서 바로 굴려볼 수 있는 한 장짜리 파일을 만든다."""
import base64
import io
import mimetypes
import os
import re

PAIRS = [("New8.dc.html", "새-8_스크롤확인.html"),
         ("New8_M.dc.html", "새-8_모바일_스크롤확인.html")]
EXTRA = ("<style>helmet,title{display:none}html,body{margin:0;background:#fff}"
         ".page{margin:0 auto}</style>")


def main():
    for src_name, out_name in PAIRS:
        s = io.open(src_name, encoding="utf-8").read()
        s = s.replace('<script src="./support.js"></script>', "")
        s = s.replace("</helmet>", "</helmet>" + EXTRA, 1)
        for n in sorted(set(re.findall(r'src="([\w.\-]+\.(?:jpg|png|webp))"', s))):
            mt = mimetypes.guess_type(n)[0] or "image/jpeg"
            b64 = base64.b64encode(open(os.path.join("..", "img", n), "rb").read()).decode()
            s = s.replace('src="%s"' % n, 'src="data:%s;base64,%s"' % (mt, b64))
        assert 'src="data:' in s and not re.search(r'src="[\w.\-]+\.(jpg|png|webp)"', s)
        io.open(out_name, "w", encoding="utf-8").write(s)
        print("  %-28s %d KB" % (out_name, os.path.getsize(out_name) // 1024))


if __name__ == "__main__":
    main()
