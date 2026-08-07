import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function fetchEmailHtml() {
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
        
        // Using UID from the previous run
        const uid = 51840; 
        const message = await client.fetchOne(String(uid), { source: true }, { uid: true });
        
        if (message && message.source) {
            const source = message.source.toString();
            const htmlMatch = source.match(/Content-Type:\s*text\/html[^]*?(?:\r?\n\r?\n)([\s\S]*?)(?:--[a-zA-Z0-9_-]+|$)/i);
            let html = htmlMatch ? htmlMatch[1] : source;
            
            if (/Content-Transfer-Encoding:\s*base64/i.test(source)) {
                try {
                    const cleaned = html.replace(/\r?\n/g, '').trim();
                    html = Buffer.from(cleaned, 'base64').toString('utf-8');
                } catch (e) {}
            } else if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(source)) {
                html = html.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
            }
            
            fs.mkdirSync('./scratch', { recursive: true });
            fs.writeFileSync('./scratch/email_51840.html', html);
            console.log('Saved to scratch/email_51840.html');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.logout();
    }
}

fetchEmailHtml();
