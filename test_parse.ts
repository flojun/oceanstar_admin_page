import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { parseMyRealTripEmail } from './src/lib/myrealTripEmailParser.ts'; // We might need to compile or run with tsx/ts-node

dotenv.config({ path: '.env.local' });

async function testEmail() {
    const email = process.env.IMAP_EMAIL;
    const password = process.env.IMAP_PW;

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
        logger: false,
    });

    try {
        await client.connect();
        console.log('Connected to IMAP');
        
        await client.mailboxOpen('INBOX');
        
        // Search for this specific email
        const uids = await client.search({
            subject: '확정대기',
        }, { uid: true });
        
        console.log(`Found ${uids.length} emails with subject '확정대기'`);
        
        const recentUids = uids.slice(-5);
        for (const uid of recentUids) {
            const message = await client.fetchOne(String(uid), {
                envelope: true,
                source: true
            }, { uid: true });
            
            const subject = message.envelope.subject || '';
            console.log(`\n--- UID: ${uid} ---`);
            console.log(`Subject: ${subject}`);
            console.log(`Date: ${message.envelope.date}`);
            
            if (subject.includes('EXP-20260807-00007717') || subject.includes('여류경') || subject.includes('거북이스노클링')) {
                console.log('Found the target email!');
                
                const source = message.source.toString();
                const { simpleParser } = await import('mailparser');
                const parsedMail = await simpleParser(source);
                const html = parsedMail.html || parsedMail.textAsHtml || source;

                console.log('--- HTML PREVIEW (first 500 chars) ---');
                console.log(html.substring(0, 500));
                console.log('--------------------------------------');

                try {
                    const parsed = parseMyRealTripEmail(html, subject);
                    console.log('Parsing result:', JSON.stringify(parsed, null, 2));
                } catch (e) {
                    console.error('Parsing error:', e);
                }
            }
        }
    } catch (err) {
        console.error('IMAP Error:', err);
    } finally {
        await client.logout();
    }
}

testEmail();
