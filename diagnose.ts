import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { simpleParser } from 'mailparser';
import { parseMyRealTripEmail } from './src/lib/myrealTripEmailParser.ts';

dotenv.config({ path: '.env.local' });

async function diagnoseRecentEmails() {
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
        
        console.log('Searching for recent myrealtrip emails...');
        
        // Find latest 10 emails from myrealtrip
        const uids = await client.search({ from: 'myrealtrip' }, { uid: true });
        const recentUids = uids.slice(-10);
        
        for (const uid of recentUids) {
            const message = await client.fetchOne(String(uid), { source: true, envelope: true, flags: true }, { uid: true });
            if (!message) continue;
            
            const subject = message.envelope?.subject || '';
            const isUnseen = !message.flags.has('\\Seen');
            console.log(`\n--- UID: ${uid} | UNSEEN: ${isUnseen} | Subject: ${subject} ---`);
            
            if (subject.includes('확정대기') || subject.includes('확정완료')) {
                const source = message.source.toString();
                const parsedMail = await simpleParser(source);
                const html = parsedMail.html || parsedMail.textAsHtml || source;
                
                const parsed = parseMyRealTripEmail(html, subject);
                console.log('Parsed Result:', JSON.stringify(parsed, null, 2));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}

diagnoseRecentEmails();
