/**
 * 수신 주소를 옮기는 동안 **cron 이 아직 안 집어간 예약 메일**이 어느 함에 남아 있는지 본다.
 * 읽기전용(EXAMINE)으로 열어서 읽음 처리도, 처리 표식도 건드리지 않는다.
 *
 * cron 과 똑같은 조건(발신자 + 제목 + 미처리 표식)으로 세기 때문에
 * "최근 2일" 칸이 0 이면 그 함은 정말로 비어 있는 것이다. 그때 옛 주소를 빼면 된다.
 * "2일 초과" 는 cron 의 since 창(2일)을 넘겨 **스스로는 다시 못 잡는** 메일이다. 사람이 봐야 한다.
 *
 * 실행: node scripts/check_unprocessed.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { ImapFlow } from 'imapflow';
import { imapAccounts } from '../src/lib/imapAccounts.ts';
import { OTA_FROM, OTA_SUBJECT, type OtaPlatform } from '../src/lib/otaEmailParser.ts';

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

const PROCESSED = 'OceanstarDone';
const CRON_WINDOW = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);   // cron 의 since 와 동일
const OLDER = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

/** cron 이 실제로 찾는 조합. 여기 없는 메일(정산·광고 등)은 원래 처리 대상이 아니다. */
const FEEDS: Array<{ label: string; from: string; subjects: string[] }> = [
    { label: '마이리얼트립', from: 'myrealtrip', subjects: ['확정대기', '확정완료', '예약취소', '취소 요청 접수'] },
    ...(['klook', 'gyg', 'viator', 'yeogi'] as OtaPlatform[]).map((p) => ({
        label: p, from: OTA_FROM[p], subjects: OTA_SUBJECT[p],
    })),
];

const accounts = imapAccounts(env);

for (const account of accounts) {
    const client = new ImapFlow({
        host: 'imap.gmail.com', port: 993, secure: true, auth: account, logger: false,
    });

    try {
        await client.connect();
        await client.mailboxOpen('INBOX', { readOnly: true });

        let fresh = 0;
        let stale = 0;

        for (const feed of FEEDS) {
            // 제목 검색은 플랫폼마다 여러 개라 UID 합집합으로 모은다(같은 메일 이중 계산 방지).
            const recent = new Set<number>();
            const older = new Set<number>();
            for (const subject of feed.subjects) {
                const base = { unKeyword: PROCESSED, from: feed.from, subject };
                for (const uid of (await client.search({ ...base, since: CRON_WINDOW }, { uid: true })) || []) recent.add(uid);
                for (const uid of (await client.search({ ...base, since: OLDER, before: CRON_WINDOW }, { uid: true })) || []) older.add(uid);
            }
            fresh += recent.size;
            stale += older.size;
            if (recent.size || older.size) {
                console.log(`  ${feed.label.padEnd(14)} 최근 2일 ${recent.size}건 / 2일 초과 ${older.size}건`);
            }
        }

        console.log(`${account.user}: 미처리 ${fresh}건 ${fresh === 0 ? '✅ 비었음' : '⏳ cron 이 곧 가져감'}`
            + `${stale ? ` · ⚠️ 2일 넘긴 ${stale}건은 수동 확인 필요` : ''}\n`);
    } catch (e) {
        console.error(`${account.user}: 접속/조회 실패 —`, e instanceof Error ? e.message : e, '\n');
    } finally {
        await client.logout().catch(() => { });
    }
}
