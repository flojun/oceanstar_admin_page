/**
 * 예전에 수기로 넣어 order_id 가 비어 있는 GetYourGuide 예약에 예약번호를 채운다.
 *
 *   node scripts/backfill_gyg_order_id.ts          ← 확인만 (쓰지 않음)
 *   node scripts/backfill_gyg_order_id.ts --apply  ← 실제 반영
 *
 * 틀린 예약번호가 들어가면 나중에 취소 메일이 엉뚱한 예약을 취소시킨다.
 * 그래서 **투어일이 같고 이름이 일치하는 후보가 정확히 하나일 때만** 채운다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { parseOtaEmail, OTA_SOURCE } from '../src/lib/otaEmailParser.ts';

const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
    fs.readFileSync(path.join(import.meta.dirname, '..', '.env.local'), 'utf8').split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
);
const BASE = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/reservations';
const H = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
};

/** "いと れ (Itore)" 와 "いと れ" 가 같은 사람으로 보이게 한다. */
const norm = (s: string) => (s || '')
    .replace(/\(.*?\)/g, ' ')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]/gu, '');

// ---------------------------------------------------------------- 메일에서 예약 수집
const client = new ImapFlow({
    host: 'imap.gmail.com', port: 993, secure: true,
    auth: { user: env.IMAP_EMAIL_OTA || env.IMAP_EMAIL, pass: env.IMAP_PW_OTA || env.IMAP_PW },
    logger: false,
});
await client.connect();
await client.mailboxOpen('INBOX', { readOnly: true });

const uidSet = new Set<number>();
for (const subject of ['Booking', 'cancelled']) {
    for (const uid of (await client.search({ from: 'getyourguide', subject }, { uid: true })) || []) uidSet.add(uid);
}
const uids = [...uidSet];
console.log(`GYG 메일 ${uids.length}통 읽는 중...`);

/** orderId -> 후보들 (같은 예약에 신규/취소 메일이 여러 통 올 수 있다) */
const byOrder = new Map<string, { name: string; tourDate: string }>();

for await (const msg of client.fetch({ uid: uids.join(',') }, { source: true }, { uid: true })) {
    if (!msg.source) continue;
    const mail = await simpleParser(msg.source.toString());
    const b = parseOtaEmail(mail.html || mail.textAsHtml || '', mail.subject || '', mail.from?.text || '');
    // 이름이 있는 메일(신규·취소)만 매칭에 쓴다. 변경 메일은 이름이 없다.
    if (!b || !b.name || !b.tourDate) continue;
    if (!byOrder.has(b.orderId)) byOrder.set(b.orderId, { name: b.name, tourDate: b.tourDate });
}
await client.logout();
console.log(`예약번호 ${byOrder.size}건 확보\n`);

// ---------------------------------------------------------------- DB 대조
const rows = await (await fetch(
    `${BASE}?select=id,name,tour_date,option,pax,status&source=eq.${encodeURIComponent(OTA_SOURCE.gyg)}&order_id=is.null&order=tour_date.desc`,
    { headers: H },
)).json();
console.log(`order_id 가 빈 G 예약 ${rows.length}행\n`);

/** 이미 DB 의 다른 행이 쓰고 있는 예약번호는 재사용하지 않는다. */
const taken = new Set<string>(
    (await (await fetch(`${BASE}?select=order_id&source=eq.${encodeURIComponent(OTA_SOURCE.gyg)}&order_id=not.is.null`, { headers: H })).json())
        .map((r: { order_id: string }) => r.order_id),
);

let filled = 0;
let ambiguous = 0;
let missing = 0;

for (const row of rows) {
    const hits = [...byOrder.entries()].filter(([orderId, m]) =>
        !taken.has(orderId) && m.tourDate === row.tour_date && norm(m.name) === norm(row.name));

    if (hits.length === 0) {
        // 이름이 조금 다를 수 있으니 부분 일치도 본다 (한쪽이 다른 쪽을 포함)
        const loose = [...byOrder.entries()].filter(([orderId, m]) => {
            if (taken.has(orderId) || m.tourDate !== row.tour_date) return false;
            const a = norm(m.name);
            const b = norm(row.name);
            return a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a));
        });
        if (loose.length === 1) { hits.push(loose[0]); }
        else if (loose.length > 1) { ambiguous++; console.log(`? 애매  ${row.tour_date} ${row.name} → 후보 ${loose.length}건`); continue; }
        else { missing++; continue; }
    }

    if (hits.length > 1) {
        ambiguous++;
        console.log(`? 애매  ${row.tour_date} ${row.name} → ${hits.map(([o]) => o).join(', ')}`);
        continue;
    }

    const [orderId, m] = hits[0];
    console.log(`${APPLY ? '✓ 반영' : '· 예정'}  ${row.tour_date} ${String(row.name).slice(0, 24).padEnd(26)} → ${orderId}  (메일: ${m.name})`);

    if (APPLY) {
        const res = await fetch(`${BASE}?id=eq.${row.id}`, {
            method: 'PATCH', headers: H, body: JSON.stringify({ order_id: orderId }),
        });
        if (!res.ok) { console.log(`   ✗ 실패: ${await res.text()}`); continue; }
    }
    taken.add(orderId);
    filled++;
}

console.log(`\n${APPLY ? '반영' : '반영 예정'} ${filled}건 / 애매해서 건너뜀 ${ambiguous}건 / 메일 못 찾음 ${missing}건`);
if (!APPLY) console.log('실제로 넣으려면: node scripts/backfill_gyg_order_id.ts --apply');
