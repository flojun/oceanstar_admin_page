import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { simpleParser } from 'mailparser';
import { parseMyRealTripEmail } from './src/lib/myrealTripEmailParser.ts';

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
        const recentUids = uids.slice(-30);
        
        for (const uid of recentUids) {
            const message = await client.fetchOne(String(uid), { source: true, envelope: true, flags: true }, { uid: true });
            if (!message) continue;
            
            const subject = message.envelope?.subject || '';
            const isUnseen = !message.flags.has('\\Seen');
            
            if (subject.includes('확정대기') || subject.includes('확정완료')) {
                const source = message.source.toString();
                const parsedMail = await simpleParser(source);
                const html = parsedMail.html || parsedMail.textAsHtml || source;
                
                if (html.includes('이태진')) {
                    console.log(`\n--- FOUND '이태진'! UID: ${uid} | UNSEEN: ${isUnseen} | Subject: ${subject} ---`);
                    const parsed = parseMyRealTripEmail(html, subject);
                    console.log('Parsed Result:', JSON.stringify(parsed, null, 2));
                }
                
                if (html.includes('여류경')) {
                    console.log(`\n--- FOUND '여류경'! UID: ${uid} | UNSEEN: ${isUnseen} | Subject: ${subject} ---`);
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}

findLeeTaeJin();
