# -*- coding: utf-8 -*-
"""아트보드 실제 렌더 높이를 재서 canvas.json 프레임 값을 정한다."""
import glob, os, re, shutil, subprocess, tempfile

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
HERE = os.path.dirname(os.path.abspath(__file__))

SNIP = """
<style>
  html,body{margin:0;padding:0}
  helmet,title{display:none}
  x-dc{display:block}
</style>
<div id="__m" data-h="0"></div>
<script>
  document.fonts.ready.then(function(){
    var el = document.querySelector('x-dc > div');
    document.getElementById('__m').setAttribute('data-h', Math.ceil(
      el.getBoundingClientRect().height));
  });
</script>
"""


def main():
    tmp = tempfile.mkdtemp(prefix="osmeas_")
    for f in glob.glob(os.path.join(HERE, "..", "img", "*.jpg")) + \
             glob.glob(os.path.join(HERE, "..", "img", "*.webp")):
        shutil.copy2(f, tmp)
    for src in sorted(glob.glob(os.path.join(HERE, "*.dc.html"))):
        name = os.path.basename(src)
        html = open(src, encoding="utf-8").read()
        html = html.replace('<script src="./support.js"></script>', "")
        html = html.replace("</body>", SNIP + "</body>", 1)
        dst = os.path.join(tmp, name.replace(".dc.html", ".m.html"))
        open(dst, "w", encoding="utf-8").write(html)
        r = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
                            "--window-size=1600,40000", "--virtual-time-budget=14000",
                            "--dump-dom", dst], capture_output=True, timeout=200)
        m = re.search(r'id="__m" data-h="(\d+)"', r.stdout.decode("utf-8", "replace"))
        print("%-22s %s" % (name, m.group(1) if m else "FAIL"))


if __name__ == "__main__":
    main()
