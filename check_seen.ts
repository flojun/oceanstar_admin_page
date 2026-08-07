import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSeen() {
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: process.env.IMAP_EMAIL, pass: process.env.IMAP_PW },
        logger: false,
    });

    try {
        await client.connect();
        await client.mailboxOpen('INBOX');
        const message = await client.fetchOne('51850', { flags: true }, { uid: true });
        console.log('Flags for UID 51850:', message.flags);
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}
checkSeen();
