// 보드마다 글꼴(가족 · 굵기)별로 실제로 그려지는 글자를 브라우저에서 모은다.
// build_faq.py 가 부른다: node font_usage.mjs 보드1.dc.html 보드2.dc.html …
// 결과: {"Pretendard 400": "가나다…", "SUIT 800": "…"} (접힌 답 · 입력칸 안내문 · ::before 포함)
import { createRequire } from 'module';
import fs from 'fs'; import path from 'path'; import os from 'os';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const HERE = path.dirname(new URL(import.meta.url).pathname);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fu_'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const acc = {};
for (const f of process.argv.slice(2)) {
  const h = fs.readFileSync(path.join(HERE, f), 'utf8').replace('<script src="./support.js"></script>', '')
    .replace('</body>', '<style>helmet,title{display:none}x-dc{display:block}body{margin:0}</style></body>');
  fs.writeFileSync(path.join(tmp, 'b.html'), h);
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + path.join(tmp, 'b.html'));
  const got = await p.evaluate(() => {
    const out = {};
    const add = (el, txt, pseudo) => {
      if (!txt) return;
      const cs = getComputedStyle(el, pseudo || null);
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const key = fam + ' ' + cs.fontWeight;
      let s = txt;
      if (cs.textTransform === 'uppercase' || cs.textTransform === 'lowercase') s += txt.toUpperCase() + txt.toLowerCase();
      out[key] = (out[key] || '') + s;
    };
    const root = document.querySelector('.page') || document.body;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const n = w.currentNode; if (n.parentElement.closest('style,script')) continue; add(n.parentElement, n.textContent); }
    for (const el of root.querySelectorAll('*')) {
      if (el.matches('input,textarea')) { add(el, el.getAttribute('placeholder')); add(el, el.value); }
      for (const ps of ['::before', '::after']) {
        const c = getComputedStyle(el, ps).content;
        if (c && c !== 'none' && c !== 'normal' && c.startsWith('"')) add(el, c.slice(1, -1), ps);
      }
    }
    return out;
  });
  for (const [k, v] of Object.entries(got)) acc[k] = (acc[k] || '') + v;
  await p.close();
}
await b.close();
for (const k of Object.keys(acc)) acc[k] = [...new Set(acc[k])].join('');
console.log(JSON.stringify(acc));
