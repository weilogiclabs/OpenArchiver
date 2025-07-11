import type { GenericImapCredentials } from '@open-archive/types';
import type { IEmailConnector, EmailObject } from '../EmailProviderFactory';
import { ImapFlow } from 'imapflow';

export class ImapConnector implements IEmailConnector {
    private client: ImapFlow;

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

    public async *fetchEmails(since?: Date): AsyncGenerator<EmailObject> {
        await this.client.connect();
        try {
            await this.client.mailboxOpen('INBOX');

            const searchCriteria = since ? { since } : { all: true };

            for await (const msg of this.client.fetch(searchCriteria, { envelope: true, source: true })) {
                if (msg.envelope && msg.source) {
                    yield {
                        id: msg.uid.toString(),
                        headers: msg.envelope,
                        body: msg.source.toString(),
                    };
                }
            }
        } finally {
            await this.client.logout();
        }
    }
}
