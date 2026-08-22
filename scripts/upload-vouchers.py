# -*- coding: utf-8 -*-
"""바우처 PDF를 Supabase Storage의 'vouchers' 버킷에 올린다.

    python scripts/upload-vouchers.py <폴더>

<폴더> 아래에 en/ 과 ko/ 가 있어야 하고, 두 폴더의 파일명은 같아야 한다.
같은 이름이 이미 있으면 덮어쓴다(upsert). 여러 번 실행해도 안전하다.

바우처를 교체할 때는 이 스크립트만 다시 돌리면 되고, 배포는 필요 없다.
"""
import os
import sys
import urllib.request
import urllib.error

BUCKET = 'vouchers'


def env(name, env_path='.env.local'):
    v = os.environ.get(name)
    if v:
        return v.strip().strip('"')
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            if line.startswith(name + '='):
                return line.split('=', 1)[1].strip().strip('"')
    raise SystemExit('환경변수 없음: ' + name)


def upload(url, key, lang, name, path):
    with open(path, 'rb') as f:
        body = f.read()
    req = urllib.request.Request(
        '%s/storage/v1/object/%s/%s/%s' % (url, BUCKET, lang, name),
        data=body, method='POST',
        headers={'apikey': key, 'Authorization': 'Bearer ' + key,
                 'Content-Type': 'application/pdf', 'x-upsert': 'true'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return '%d %s' % (e.code, e.read().decode('utf-8', 'replace')[:120])


def main(root):
    url, key = env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY')
    names = {lang: sorted(os.listdir(os.path.join(root, lang))) for lang in ('en', 'ko')}
    if set(names['en']) != set(names['ko']):
        print('경고: en/ko 파일명이 다릅니다')
        print('  en 전용:', sorted(set(names['en']) - set(names['ko'])))
        print('  ko 전용:', sorted(set(names['ko']) - set(names['en'])))

    ok = fail = 0
    for lang in ('en', 'ko'):
        for name in names[lang]:
            path = os.path.join(root, lang, name)
            status = upload(url, key, lang, name, path)
            if status == 200:
                ok += 1
            else:
                fail += 1
                print('  실패 %s/%s -> %s' % (lang, name, status))
        print('%s: %d개 업로드 완료' % (lang, len(names[lang])))
    print('성공 %d / 실패 %d' % (ok, fail))
    return 1 if fail else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
