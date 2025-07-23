import type { GenericImapCredentials, EmailObject, EmailAddress, SyncState, MailboxUser } from '@open-archiver/types';
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

    /**
    *  We understand that for IMAP inboxes, there is only one user, but we want the IMAP connector to be compatible with other connectors, we return the single user here.
    * @returns An async generator that yields each user object.
    */
    public async *listAllUsers(): AsyncGenerator<MailboxUser> {
        const emails: string[] = [this.returnImapUserEmail()];
        for (const [index, email] of emails.entries()) {
            yield {
                id: String(index),
                primaryEmail: email,
                displayName: email
            };

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

            // For continuous sync, we start with the last known UID.
            // For initial sync, we start at 0 and find the highest UID.
            this.newMaxUid = lastUid || 0;

            // If it's an initial sync, we need to determine the highest UID in the mailbox
            // to correctly set the state, even if we don't fetch anything.
            if (!lastUid && mailbox.exists > 0) {
                const lastMessage = await this.client.fetchOne(String(mailbox.exists), { uid: true });
                if (lastMessage && lastMessage.uid > this.newMaxUid) {
                    this.newMaxUid = lastMessage.uid;
                }
            }

            const searchCriteria = lastUid ? { uid: `${lastUid + 1}:*` } : { all: true };

            for await (const msg of this.client.fetch(searchCriteria, { envelope: true, source: true, bodyStructure: true, uid: true })) {
                if (lastUid && msg.uid <= lastUid) {
                    continue; //in case imapflow returns one email even if it should return no email
                }

                if (msg.uid > this.newMaxUid) {
                    this.newMaxUid = msg.uid;
                }

                if (msg.envelope && msg.source) {
                    yield await this.parseMessage(msg);
                }
            }
        } finally {
            if (this.client.usable) await this.client.logout();
        }
    }

    private async parseMessage(msg: any): Promise<EmailObject> {
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

        return {
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

    public getUpdatedSyncState(): SyncState {
        return {
            imap: {
                maxUid: this.newMaxUid
            }
        };
    }
}
