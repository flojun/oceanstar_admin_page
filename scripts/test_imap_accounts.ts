/** imapAccounts 자가 점검. 실행: node scripts/test_imap_accounts.ts */
import assert from 'node:assert/strict';
import { imapAccounts } from '../src/lib/imapAccounts.ts';

// 이사 중: 두 쌍이 다 있으면 두 함을 모두 훑는다
assert.deepEqual(
    imapAccounts({ IMAP_EMAIL: 'old@x.com', IMAP_PW: 'pw1', IMAP_EMAIL_OTA: 'new@x.com', IMAP_PW_OTA: 'pw2' }),
    [{ user: 'old@x.com', pass: 'pw1' }, { user: 'new@x.com', pass: 'pw2' }],
);

// 이사 완료: 같은 주소를 두 쌍에 적어도 접속은 한 번만
assert.deepEqual(
    imapAccounts({ IMAP_EMAIL: 'new@x.com', IMAP_PW: 'pw', IMAP_EMAIL_OTA: 'new@x.com', IMAP_PW_OTA: 'pw' }),
    [{ user: 'new@x.com', pass: 'pw' }],
);

// 한 쌍을 지우면 자동으로 한 함만 본다
assert.deepEqual(imapAccounts({ IMAP_EMAIL_OTA: 'new@x.com', IMAP_PW_OTA: 'pw' }), [{ user: 'new@x.com', pass: 'pw' }]);

// 비밀번호가 없는 계정은 목록에서 빠지고 로그에 남는다
assert.deepEqual(imapAccounts({ IMAP_EMAIL: 'old@x.com' }), []);

// 미설정이면 빈 배열 → cron 은 500 으로 멈춘다
assert.deepEqual(imapAccounts({}), []);

console.log('ok');
