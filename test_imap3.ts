import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
import { parseMyRealTripEmail } from './src/lib/myrealTripEmailParser';

dotenv.config({ path: '.env.local' });

async function test() {
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: process.env.IMAP_EMAIL || '',
            pass: process.env.IMAP_PW || ''
        },
        logger: false
    });
    
    await client.connect();
    await client.mailboxOpen('INBOX');
    
    const uids = await client.search({ from: 'myrealtrip', subject: '확정대기' }, { uid: true });
    if (uids.length > 0) {
        const uid = uids[uids.length - 1];
        const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
        
        const parsedMail = await simpleParser(msg.source);
        const html = parsedMail.html || parsedMail.textAsHtml || '';
        const subject = parsedMail.subject || '';
        
        console.log('Subject:', subject);
        console.log('HTML Length:', html.length);
        
        const parsed = parseMyRealTripEmail(html, subject);
        console.log('Parse result:', parsed);
    }
    await client.logout();
}

test();
