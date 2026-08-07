import { ImapFlow } from 'imapflow';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listMailboxes() {
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: { user: process.env.IMAP_EMAIL, pass: process.env.IMAP_PW },
        logger: false,
    });

    try {
        await client.connect();
        
        const mailboxes = await client.list();
        for (const mb of mailboxes) {
            console.log(mb.path);
        }
        
        console.log('\n--- Searching INBOX ---');
        await client.mailboxOpen('INBOX');
        const uidsInbox = await client.search({ from: 'myrealtrip', subject: '확정대기' }, { uid: true });
        console.log(`Found ${uidsInbox.length} in INBOX`);
        if (uidsInbox.length > 0) {
            const msg = await client.fetchOne(String(uidsInbox[uidsInbox.length - 1]), { envelope: true }, { uid: true });
            console.log('Latest INBOX:', msg.envelope.subject, msg.envelope.date);
        }

        console.log('\n--- Searching All Mail ---');
        try {
            await client.mailboxOpen('[Gmail]/All Mail');
            const uidsAll = await client.search({ from: 'myrealtrip', subject: '확정대기' }, { uid: true });
            console.log(`Found ${uidsAll.length} in All Mail`);
            if (uidsAll.length > 0) {
                const msg = await client.fetchOne(String(uidsAll[uidsAll.length - 1]), { envelope: true }, { uid: true });
                console.log('Latest All Mail:', msg.envelope.subject, msg.envelope.date);
            }
        } catch (e) {
            console.log('Could not open [Gmail]/All Mail', e.message);
            try {
                await client.mailboxOpen('[Gmail]/전체보관함');
                const uidsAll2 = await client.search({ from: 'myrealtrip', subject: '확정대기' }, { uid: true });
                console.log(`Found ${uidsAll2.length} in 전체보관함`);
                if (uidsAll2.length > 0) {
                    const msg = await client.fetchOne(String(uidsAll2[uidsAll2.length - 1]), { envelope: true }, { uid: true });
                    console.log('Latest 전체보관함:', msg.envelope.subject, msg.envelope.date);
                }
            } catch(err) {}
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.logout();
    }
}

listMailboxes();
