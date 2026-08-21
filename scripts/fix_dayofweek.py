import re

path = r'c:\oceanstar_admin_page\src\app\(ko)\(admin)\dashboard\all\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the buggy line
old = 'const dayOfWeek = getKoreanDay(dateStr); // e.g. "(Mon)"'
new = 'const rawTourDate = (groupRows[0] as any).tour_date || "";\r\n            const dayOfWeek = getKoreanDay(rawTourDate); // Fix: dateStr is MM-DD-YYYY, use raw YYYY-MM-DD'

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: Replaced dayOfWeek line correctly.')
else:
    print('NOT FOUND - printing all lines containing dayOfWeek:')
    for i, line in enumerate(content.split('\n')):
        if 'dayOfWeek' in line and 'getKoreanDay' in line:
            print(f'  Line {i+1}: {repr(line)}')
