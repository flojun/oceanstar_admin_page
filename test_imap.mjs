import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
    const email = process.env.IMAP_EMAIL;
    const password = process.env.IMAP_PW;

    if (!email || !password) {
        console.error('Email credentials not configured');
        process.exit(1);
    }

    console.log(`Connecting to IMAP as ${email}...`);
    
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
        logger: false,
    });

    try {
        await client.connect();
        console.log('Successfully connected to IMAP.');
        
        await client.mailboxOpen('INBOX');
        console.log('Opened INBOX.');
        
        const uids = await client.search({
            seen: false,
            from: 'myrealtrip'
        }, { uid: true });
        
        console.log(`Found ${uids.length} unseen emails from myrealtrip.`);
        
        for (const uid of uids) {
            const message = await client.fetchOne(String(uid), {
                envelope: true,
            }, { uid: true });
            console.log(`UID: ${uid}, Subject: ${message.envelope?.subject}`);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.logout();
    }
}

test();
