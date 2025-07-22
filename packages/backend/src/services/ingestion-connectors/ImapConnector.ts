import type { GenericImapCredentials, EmailObject, EmailAddress, SyncState } from '@open-archiver/types';
import type { IEmailConnector } from '../EmailProviderFactory';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';

export class ImapConnector implements IEmailConnector {
    private client: ImapFlow;
    private newMaxUid: number = 0;

    constructor(private credentials: GenericImapCredentials) {
        this.client = new ImapFlow({
            host: this.credentials.host,
            port: this.credentials.port,
            secure: this.credentials.secure,
            auth: {
                user: this.credentials.username,
                pass: this.credentials.password,
            },
            logger: false, // Set to true for verbose logging
        });
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.client.connect();
            await this.client.logout();
            return true;
        } catch (error) {
            console.error('Failed to verify IMAP connection:', error);
            return false;
        }
    }
    public returnImapUserEmail(): string {
        return this.credentials.username;
    }
    public async *fetchEmails(userEmail: string, syncState?: SyncState | null): AsyncGenerator<EmailObject | null> {
        await this.client.connect();
        try {
            const mailbox = await this.client.mailboxOpen('INBOX');

            const lastUid = syncState?.imap?.maxUid;
            this.newMaxUid = lastUid || 0;

            // Determine the highest UID in the mailbox currently.
            // This ensures that even if no new emails are fetched, the sync state is updated to the latest UID.
            if (mailbox.exists > 0) {
                const lastMessage = await this.client.fetchOne(String(mailbox.exists), { uid: true });
                if (lastMessage && lastMessage.uid > this.newMaxUid) {
                    this.newMaxUid = lastMessage.uid;
                }
            }

            // If lastUid exists, fetch all emails with a UID greater than it.
            // Otherwise, fetch all emails.
            const searchCriteria = lastUid ? { uid: `${lastUid + 1}:*` } : { all: true };
            for await (const msg of this.client.fetch(searchCriteria, { envelope: true, source: true, bodyStructure: true, uid: true })) {
                // Defensive check: Ensure we do not process emails we should have already synced.
                if (lastUid && msg.uid <= lastUid) {
                    console.warn(`IMAP fetch returned UID ${msg.uid} which is not greater than last synced UID ${lastUid}. Skipping.`);
                    continue;
                }

                if (msg.uid > this.newMaxUid) {
                    this.newMaxUid = msg.uid;
                }

                if (msg.envelope && msg.source) {
                    const parsedEmail: ParsedMail = await simpleParser(msg.source);
                    const attachments = parsedEmail.attachments.map((attachment: Attachment) => ({
                        filename: attachment.filename || 'untitled',
                        contentType: attachment.contentType,
                        size: attachment.size,
                        content: attachment.content as Buffer
                    }));

                    const mapAddresses = (addresses: AddressObject | AddressObject[] | undefined): EmailAddress[] => {
                        if (!addresses) return [];
                        const addressArray = Array.isArray(addresses) ? addresses : [addresses];
                        return addressArray.flatMap(a => a.value.map(v => ({ name: v.name, address: v.address || '' })));
                    };

                    yield {
                        id: msg.uid.toString(),
                        from: mapAddresses(parsedEmail.from),
                        to: mapAddresses(parsedEmail.to),
                        cc: mapAddresses(parsedEmail.cc),
                        bcc: mapAddresses(parsedEmail.bcc),
                        subject: parsedEmail.subject || '',
                        body: parsedEmail.text || '',
                        html: parsedEmail.html || '',
                        headers: parsedEmail.headers as any,
                        attachments,
                        receivedAt: parsedEmail.date || new Date(),
                        eml: msg.source
                    };
                }
            }
        } finally {
            await this.client.logout();
        }
    }

    public getUpdatedSyncState(): SyncState {
        return {
            imap: {
                maxUid: this.newMaxUid
            }
        };
    }
}
