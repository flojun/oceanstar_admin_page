# -*- coding: utf-8 -*-
"""영문 문안 모듈이 한글 모듈과 같은 모양인지 확인한다.
python3 check_en_module.py _detail_ko _detail_en"""
import importlib, re, sys
ko, en = (importlib.import_module(m) for m in sys.argv[1:3])
bad = []
def shape(v):
    if isinstance(v, dict): return ('dict', tuple(sorted(v.keys())), tuple(shape(x) for _, x in sorted(v.items())))
    if isinstance(v, (list, tuple)): return (type(v).__name__, len(v), tuple(shape(x) for x in v))
    if isinstance(v, str): return 'str'
    return type(v).__name__
def imgs(v):
    return sorted(set(re.findall(r'[\w\-]+\.(?:webp|jpg|jpeg|png)', repr(v))))
names = [n for n in dir(ko) if n.isupper()]
for n in names:
    if not hasattr(en, n): bad.append(f'missing {n}'); continue
    a, b = getattr(ko, n), getattr(en, n)
    if n in ('STEM', 'BOARD_TITLE', 'LANG'): continue
    if shape(a) != shape(b): bad.append(f'shape differs: {n}')
    if imgs(a) != imgs(b): bad.append(f'images differ: {n} {imgs(a)} vs {imgs(b)}')
for n in dir(en):
    if not n.isupper(): continue
    v = getattr(en, n)
    txt = repr(v)
    if n not in ('BOARD_TITLE',) and re.search(r'[가-힣]', txt): bad.append(f'Korean left in {n}')
    if '—' in txt or '–' in txt: bad.append(f'em/en dash in {n}')
print('OK' if not bad else '\n'.join(bad))
