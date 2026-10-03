import type { ImapFlow } from 'imapflow';

/**
 * 메일을 읽어올 IMAP 계정 전부. **환경변수는 지금 있는 그대로 쓴다.**
 *
 *   IMAP_EMAIL     / IMAP_PW       마이리얼트립 함 (oceanstar1942)
 *   IMAP_EMAIL_OTA / IMAP_PW_OTA   OTA 함 (hioceanstar)
 *
 * cron 이 두 쌍을 합쳐서 훑으므로 수신 주소를 옮기는 동안 메일이 **어느 함에 떨어지든
 * 놓치지 않는다.** 전달(forward) 때문에 같은 메일이 양쪽에 있어도 order_id·상태 검사에서
 * 걸러져 행이 두 개 생기거나 Discord 알림이 두 번 가지 않는다.
 *
 * 이사가 끝나 한 함만 남으면 쓰지 않는 쌍을 환경변수에서 지운다. 그러면 자동으로 한 함만
 * 본다. 두 쌍에 같은 주소를 적어도 접속은 한 번만 한다. 코드는 어느 쪽이든 그대로 둔다.
 */
export type ImapAccount = { user: string; pass: string };

/** 스크립트는 .env.local 을 직접 읽어 넘긴다. 서버에서는 process.env 그대로. */
export function imapAccounts(env: Record<string, string | undefined> = process.env): ImapAccount[] {
    const pairs: Array<[string | undefined, string | undefined]> = [
        [env.IMAP_EMAIL, env.IMAP_PW],
        [env.IMAP_EMAIL_OTA, env.IMAP_PW_OTA],
    ];

    const accounts: ImapAccount[] = [];
    for (const [user, pass] of pairs) {
        if (!user) continue;
        if (!pass) {
            // 조용히 빠지면 그 함에 온 예약을 아무도 안 읽는 걸 눈치채지 못한다.
            console.error(`[IMAP] ${user} 의 비밀번호가 없어 건너뜁니다 (환경변수 확인)`);
            continue;
        }
        if (accounts.some((a) => a.user === user.trim())) continue;   // 같은 함을 두 번 열지 않는다
        accounts.push({ user: user.trim(), pass: pass.trim() });
    }
    return accounts;
}

/**
 * **받은편지함이 아니라 전체보관함**을 연다.
 *
 * Gmail 필터에 '받은편지함 건너뛰기' 가 걸려 있으면 그 메일은 INBOX 에 아예 들어오지 않는다.
 * 실제로 마이리얼트립 [확정대기] 메일이 통째로 그렇게 새서 예약 세 건이 DB 에 안 들어왔다.
 * 사람이 메일을 보관처리해도 같은 일이 생긴다.
 *
 * 전체보관함에는 받은편지함 메일과 보관처리한 메일이 모두 있고 스팸·휴지통은 빠진다.
 * 이름이 계정 언어를 타므로(`[Gmail]/All Mail` / `[Gmail]/전체보관함`) \\All 특수용도 표식으로 찾고,
 * 못 찾으면 INBOX 로 물러난다.
 */
export async function openAllMail(client: ImapFlow, options: { readOnly?: boolean } = {}) {
    const boxes = await client.list();
    const allMail = boxes.find((b) => b.specialUse === '\\All');
    if (!allMail) console.warn('[IMAP] 전체보관함을 찾지 못해 받은편지함만 봅니다');
    return client.mailboxOpen(allMail?.path || 'INBOX', options);
}
