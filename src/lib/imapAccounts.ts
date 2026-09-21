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
