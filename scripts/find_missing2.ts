import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config({ path: '.env.local' });

async function findLeeTaeJin() {
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
        
        console.log('Searching for emails...');
        const uids = await client.search({ from: 'myrealtrip' }, { uid: true });
        const recentUids = uids.slice(-100);
        
        for (const uid of recentUids) {
            const message = await client.fetchOne(String(uid), { source: true, envelope: true }, { uid: true });
            if (!message) continue;
            
            const subject = message.envelope?.subject || '';
            const source = message.source.toString();
            
            if (source.includes('이태진')) {
                console.log(`\n--- FOUND '이태진' in raw source! UID: ${uid} | Subject: ${subject} ---`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}

findLeeTaeJin();
