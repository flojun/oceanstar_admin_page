import { ImapFlow } from 'imapflow';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
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
        const uid = uids[uids.length - 1]; // last one
        const msg = await client.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
        
        let html = msg.source.toString();
        const htmlMatch = html.match(/Content-Type:\s*text\/html[^]*?(?:\r?\n\r?\n)([\s\S]*?)(?:--[a-zA-Z0-9_-]+|$)/i);
        if (htmlMatch) {
            html = htmlMatch[1];
            if (/Content-Transfer-Encoding:\s*base64/i.test(msg.source.toString())) {
                try {
                    html = Buffer.from(html.replace(/\r?\n/g, '').trim(), 'base64').toString('utf-8');
                } catch (e) {}
            }
            if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(msg.source.toString())) {
                html = html.replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
            }
        }
        
        fs.writeFileSync('test_email.html', html);
        console.log('Wrote test_email.html');
    }
    await client.logout();
}

test();
