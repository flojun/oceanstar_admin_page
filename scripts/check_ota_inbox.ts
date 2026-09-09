/**
 * OTA 메일함 점검. 읽기전용(EXAMINE)으로 열어서 **읽음 처리하지 않는다.**
 * 실제 메일이 파서를 통과하는지 눈으로 확인하는 용도.
 *
 * 실행: node scripts/check_ota_inbox.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { parseOtaEmail, OTA_FROM, OTA_SUBJECT, type OtaPlatform } from '../src/lib/otaEmailParser.ts';

const envPath = path.join(import.meta.dirname, '..', '.env.local');
const env = Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => [
            l.slice(0, l.indexOf('=')).trim(),
            l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, ''),
        ]),
);

const user = env.IMAP_EMAIL_OTA || env.IMAP_EMAIL;
const pass = env.IMAP_PW_OTA || env.IMAP_PW;

const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
});

await client.connect();
console.log(`접속 성공: ${user}\n`);

// readOnly = EXAMINE. 본문을 읽어도 \Seen 이 붙지 않는다.
await client.mailboxOpen('INBOX', { readOnly: true });

for (const platform of ['klook', 'gyg', 'viator', 'yeogi'] as OtaPlatform[]) {
    const since = new Date(Date.now() - 30 * 864e5);
    const uidSet = new Set<number>();
    for (const subject of OTA_SUBJECT[platform]) {
        const found = await client.search({ from: OTA_FROM[platform], subject, since }, { uid: true });
        for (const uid of found || []) uidSet.add(uid);
    }
    const list = [...uidSet].sort((a, b) => a - b);
    console.log(`── ${platform} (최근 30일 ${list.length}통, 최신 5통만 표시)`);

    for (const uid of list.slice(-5)) {
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
        if (!msg || !msg.source) continue;

        const mail = await simpleParser(msg.source.toString());
        const subject = mail.subject || '';
        const b = parseOtaEmail(mail.html || mail.textAsHtml || '', subject, mail.from?.text || '');

        console.log(`  [${subject.slice(0, 70)}]`);
        console.log(b
            ? `    → ${b.kind} | ${b.orderId} | ${b.name} | ${b.tourDate} | ${b.option || '(옵션없음)'}`
              + ` | ${b.pax} | 픽업:${b.pickupLocation || '(없음)'} | ${b.contact || '(연락처없음)'}`
            : '    → ❌ 파싱 실패');
    }
    console.log('');
}

await client.logout();
