import { ImapFlow } from 'imapflow';
import { parseMyRealTripEmail } from './src/lib/myrealTripEmailParser';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log('Connecting to IMAP...');
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: process.env.IMAP_EMAIL || process.env.NODEMAILER_EMAIL || '',
            pass: process.env.IMAP_PW || process.env.NODEMAILER_PW || ''
        },
        logger: false
    });

    try {
        await client.connect();
        console.log('Connected successfully!');
        
        await client.mailboxOpen('INBOX');
        console.log('Mailbox opened.');

        // Search for recent myrealtrip emails regardless of seen status
        const uids = await client.search({
            from: 'myrealtrip',
            subject: '확정대기'
        }, { uid: true });
        
        console.log(`Found ${uids.length} emails from myrealtrip with 확정대기 in subject.`);

        if (uids.length > 0) {
            // Check the last 3 emails
            const recentUids = uids.slice(-3);
            for (const uid of recentUids) {
                console.log(`\nFetching UID: ${uid}...`);
                const msg = await client.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
                if (!msg) {
                    console.log('Message not found.');
                    continue;
                }
                const subject = msg.envelope.subject || '';
                const source = msg.source.toString();
                console.log(`Subject: ${subject}`);
                
                // Extract HTML
                let html = source;
                const htmlMatch = source.match(/Content-Type:\s*text\/html[^]*?(?:\r?\n\r?\n)([\s\S]*?)(?:--[a-zA-Z0-9_-]+|$)/i);
                if (htmlMatch) {
                    html = htmlMatch[1];
                    if (/Content-Transfer-Encoding:\s*base64/i.test(source)) {
                        try {
                            const cleaned = html.replace(/\r?\n/g, '').trim();
                            html = Buffer.from(cleaned, 'base64').toString('utf-8');
                        } catch (e) {}
                    }
                    if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(source)) {
                        html = html
                            .replace(/=\r?\n/g, '')
                            .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                    }
                }
                
                console.log('--- HTML Preview ---');
                console.log(html.substring(0, 300) + '...');
                
                console.log('--- Parsing Result ---');
                const parsed = parseMyRealTripEmail(html, subject);
                console.log(parsed);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.logout();
    }
}

test();
