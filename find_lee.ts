import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config({ path: '.env.local' });

async function searchAllForLee() {
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
        
        console.log('Searching all emails for "이태진"...');
        // We can use IMAP SEARCH body/text
        const uids = await client.search({ body: '이태진' }, { uid: true });
        console.log('Found UIDs:', uids);
        
        for (const uid of uids.slice(-5)) {
            const message = await client.fetchOne(String(uid), { source: true, flags: true, envelope: true }, { uid: true });
            if (!message) continue;
            console.log(`UID: ${uid}, Subject: ${message.envelope?.subject}, Flags:`, message.flags);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}

searchAllForLee();
