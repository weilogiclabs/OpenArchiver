import type { GenericImapCredentials, EmailObject, EmailAddress, SyncState, MailboxUser } from '@open-archiver/types';
import type { IEmailConnector } from '../EmailProviderFactory';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
import { logger } from '../../config/logger';

export class ImapConnector implements IEmailConnector {
    private client: ImapFlow;
    private newMaxUids: { [mailboxPath: string]: number; } = {};
    private isConnected = false;

    constructor(private credentials: GenericImapCredentials) {
        this.client = new ImapFlow({
            host: this.credentials.host,
            port: this.credentials.port,
            secure: this.credentials.secure,
            auth: {
                user: this.credentials.username,
                pass: this.credentials.password,
            },
            logger: logger.child({ module: 'ImapFlow' }),
        });

        // Handles client-level errors, like unexpected disconnects, to prevent crashes.
        this.client.on('error', (err) => {
            logger.error({ err }, 'IMAP client error');
            this.isConnected = false;
        });
    }

    /**
     * Establishes a connection to the IMAP server if not already connected.
     */
    private async connect(): Promise<void> {
        if (this.isConnected && this.client.usable) {
            return;
        }
        try {
            await this.client.connect();
            this.isConnected = true;
        } catch (err) {
            this.isConnected = false;
            logger.error({ err }, 'IMAP connection failed');
            throw err;
        }
    }

    /**
     * Disconnects from the IMAP server if the connection is active.
     */
    private async disconnect(): Promise<void> {
        if (this.isConnected && this.client.usable) {
            await this.client.logout();
            this.isConnected = false;
        }
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.connect();
            await this.disconnect();
            return true;
        } catch (error) {
            logger.error({ error }, 'Failed to verify IMAP connection');
            return false;
        }
    }

    /**
    *  We understand that for IMAP inboxes, there is only one user, but we want the IMAP connector to be compatible with other connectors, we return the single user here.
    * @returns An async generator that yields each user object.
    */
    public async *listAllUsers(): AsyncGenerator<MailboxUser> {
        try {
            const emails: string[] = [this.returnImapUserEmail()];
            for (const [index, email] of emails.entries()) {
                yield {
                    id: String(index),
                    primaryEmail: email,
                    displayName: email
                };

            }
        } finally {
            await this.disconnect();
        }
    }

    public returnImapUserEmail(): string {
        return this.credentials.username;
    }

    /**
     * Wraps an IMAP operation with a retry mechanism to handle transient network errors.
     * @param action The async function to execute.
     * @param maxRetries The maximum number of retries.
     * @returns The result of the action.
     */
    private async withRetry<T>(action: () => Promise<T>, maxRetries = 3): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.connect();
                return await action();
            } catch (err: any) {
                logger.error({ err, attempt }, `IMAP operation failed on attempt ${attempt}`);
                this.isConnected = false; // Force reconnect on next attempt
                if (attempt === maxRetries) {
                    logger.error({ err }, 'IMAP operation failed after all retries.');
                    throw err;
                }
                // Wait for a short period before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        // This line should be unreachable
        throw new Error('IMAP operation failed after all retries.');
    }

    public async *fetchEmails(userEmail: string, syncState?: SyncState | null): AsyncGenerator<EmailObject | null> {
        try {
            const mailboxes = await this.withRetry(() => this.client.list());
            // console.log('fetched mailboxes:', mailboxes);
            const processableMailboxes = mailboxes.filter(mailbox => {
                // filter out trash and all mail emails
                if (mailbox.specialUse) {
                    const specialUse = mailbox.specialUse.toLowerCase();
                    if (specialUse === '\\junk' || specialUse === '\\trash' || specialUse === '\\all') {
                        return false;
                    }
                }
                // Fallback to checking flags
                if (mailbox.flags.has('\\Noselect') || mailbox.flags.has('\\Trash') || mailbox.flags.has('\\Junk') || mailbox.flags.has('\\All')) {
                    return false;
                }

                return true;
            });

            for (const mailboxInfo of processableMailboxes) {
                const mailboxPath = mailboxInfo.path;
                const mailbox = await this.withRetry(() => this.client.mailboxOpen(mailboxPath));
                const lastUid = syncState?.imap?.[mailboxPath]?.maxUid;
                let currentMaxUid = lastUid || 0;

                if (!lastUid && mailbox.exists > 0) {
                    const lastMessage = await this.client.fetchOne(String(mailbox.exists), { uid: true });
                    if (lastMessage && lastMessage.uid > currentMaxUid) {
                        currentMaxUid = lastMessage.uid;
                    }
                }
                this.newMaxUids[mailboxPath] = currentMaxUid;

                const searchCriteria = lastUid ? { uid: `${lastUid + 1}:*` } : { all: true };

                // Only fetch if the mailbox has messages, to avoid errors on empty mailboxes with some IMAP servers.
                if (mailbox.exists > 0) {
                    for await (const msg of this.client.fetch(searchCriteria, { envelope: true, source: true, bodyStructure: true, uid: true })) {
                        if (lastUid && msg.uid <= lastUid) {
                            continue;
                        }

                        if (msg.uid > this.newMaxUids[mailboxPath]) {
                            this.newMaxUids[mailboxPath] = msg.uid;
                        }

                        if (msg.envelope && msg.source) {
                            yield await this.parseMessage(msg);
                        }
                    }
                }
            }
        } finally {
            await this.disconnect();
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
            headers: parsedEmail.headers,
            attachments,
            receivedAt: parsedEmail.date || new Date(),
            eml: msg.source
        };
    }

    public getUpdatedSyncState(): SyncState {
        const imapSyncState: { [mailboxPath: string]: { maxUid: number; }; } = {};
        for (const [path, uid] of Object.entries(this.newMaxUids)) {
            imapSyncState[path] = { maxUid: uid };
        }
        return {
            imap: imapSyncState
        };
    }
}
