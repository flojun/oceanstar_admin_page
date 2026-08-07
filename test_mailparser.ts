import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import { simpleParser } from 'mailparser';

dotenv.config({ path: '.env.local' });

async function testMailparser() {
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
        const uid = 51840; 
        const message = await client.fetchOne(String(uid), { source: true }, { uid: true });
        
        if (message && message.source) {
            const parsed = await simpleParser(message.source);
            console.log("HTML length:", parsed.html ? parsed.html.length : 0);
            if (parsed.html) {
                console.log("Contains 여행자?", parsed.html.includes("여행자"));
                console.log("Contains 여류경?", parsed.html.includes("여류경"));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}

testMailparser();
