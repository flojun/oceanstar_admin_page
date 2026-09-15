# -*- coding: utf-8 -*-
"""10개 아트보드를 그대로 PDF 페이지로 뽑아 한 파일로 합친다.
모바일 아트보드는 데스크탑과 같은 1440 폭 시트 가운데에 올려 페이지 폭을 통일한다."""
import glob, io, os, re, shutil, subprocess, sys, tempfile
from pypdf import PdfReader, PdfWriter

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SHEET_W = 1440

# (파일, 아트보드 높이, 모바일 여부) - canvas.json 값
PAGES = [
    ("New8.dc.html",      5260, False),
    ("New8_M.dc.html",    6600, True),
]

NORM = """
<style>
  @page { size: %dpx %dpx; margin: 0 }
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    animation: none !important; transition: none !important;
  }
  html, body { margin: 0; padding: 0; width: %dpx }
  helmet, title { display: none }
  x-dc { display: %s }
</style>
"""

MOBILE_SHEET = """
<style>
  x-dc { width: %dpx; justify-content: center; align-items: flex-start;
         padding: 48px 0 80px; background: #eef5f9 }
  x-dc > div { box-shadow: 0 18px 50px rgba(10,63,102,.18); border-radius: 22px;
               overflow: hidden }
</style>
"""


MEASURE = """
<div id="__m" data-h="0"></div>
<script>
  document.fonts.ready.then(function () {
    document.getElementById('__m').setAttribute(
      'data-h', Math.ceil(document.querySelector('x-dc').getBoundingClientRect().height));
  });
</script>
"""


def stage_images(outdir):
    """아트보드는 사진을 파일명만으로 참조한다. 렌더 폴더에 복사해야 보인다."""
    here = os.path.dirname(os.path.abspath(__file__))
    for f in (glob.glob(os.path.join(here, "..", "img", "*.jpg"))
              + glob.glob(os.path.join(here, "..", "img", "*.webp"))
              + glob.glob(os.path.join(here, "..", "img", "*.png"))):
        shutil.copy2(f, outdir)


def prep(src, h, mobile, outdir, measure=False):
    html = io.open(src, encoding="utf-8").read()
    html = re.sub(r'<script src="\./support\.js"></script>', "", html)
    # PDF는 정지화면이다. 캔버스 용량 한도에 맞춰 줄인 웹피 대신 원본 해상도 정지컷을 쓴다.
    html = html.replace("hero_boat.webp", "hero_boat_still.jpg")
    html = html.replace("hero_turtle.webp", "hero_turtle_still.jpg")
    css = NORM % (SHEET_W, h, SHEET_W, "flex" if mobile else "block")
    if mobile:
        css += MOBILE_SHEET % SHEET_W
    html = html.replace("</helmet>", "</helmet>" + css, 1)
    if measure:
        html = html.replace("</body>", MEASURE + "</body>", 1)
    suffix = ".measure.html" if measure else ".print.html"
    dst = os.path.join(outdir, os.path.basename(src).replace(".dc.html", suffix))
    io.open(dst, "w", encoding="utf-8").write(html)
    return dst


def measure(src, mobile, outdir):
    """실제 렌더 높이를 잰다. 웹폰트 로딩까지 기다린 뒤 scrollHeight."""
    path = prep(src, 40000, mobile, outdir, measure=True)
    r = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
         "--window-size=%d,40000" % SHEET_W, "--virtual-time-budget=12000",
         "--dump-dom", path],
        capture_output=True, timeout=180)
    dom = r.stdout.decode("utf-8", "replace")
    m = re.search(r'id="__m" data-h="(\d+)"', dom)
    if not m or m.group(1) == "0":
        raise SystemExit("measure failed: " + src)
    return int(m.group(1))


def render(html_path, pdf_path):
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
           "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
           "--virtual-time-budget=10000",
           "--print-to-pdf=" + pdf_path, html_path]
    r = subprocess.run(cmd, capture_output=True, timeout=180)
    if not os.path.exists(pdf_path):
        sys.stderr.write(r.stderr.decode("utf-8", "replace")[-800:] + "\n")
        raise SystemExit("render failed: " + html_path)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    tmp = tempfile.mkdtemp(prefix="osdeck_")
    stage_images(tmp)
    writer = PdfWriter()
    for name, h, mobile in PAGES:
        src = os.path.join(here, name)
        sheet_h = measure(src, mobile, tmp) + 2
        page_html = prep(src, sheet_h, mobile, tmp)
        pdf = os.path.join(tmp, name.replace(".dc.html", ".pdf"))
        render(page_html, pdf)
        rd = PdfReader(pdf)
        box = rd.pages[0].mediabox
        print("%-20s %d page(s)  %.0f x %.0f pt" % (name, len(rd.pages), box.width, box.height))
        for p in rd.pages:
            writer.add_page(p)
    out = os.path.join(here, "오션스타_홈리뉴얼_확정안.pdf")
    with open(out, "wb") as f:
        writer.write(f)
    print("\n->", out, os.path.getsize(out) // 1024, "KB,", len(writer.pages), "pages")


if __name__ == "__main__":
    main()
