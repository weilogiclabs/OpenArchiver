import type { GoogleWorkspaceCredentials } from '@open-archive/types';
import type { IEmailConnector, EmailObject } from '../EmailProviderFactory';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { gmail_v1 } from 'googleapis';

export class GoogleConnector implements IEmailConnector {
    private auth: OAuth2Client;

    constructor(private credentials: GoogleWorkspaceCredentials) {
        this.auth = new google.auth.OAuth2(
            this.credentials.clientId,
            this.credentials.clientSecret
        );
    }

    public async testConnection(): Promise<boolean> {
        try {
            // The google-auth-library doesn't have a simple "verify" function.
            // A common way to test is to get an access token.
            const token = await this.auth.getAccessToken();
            return !!token;
        } catch (error) {
            console.error('Failed to verify Google Workspace connection:', error);
            return false;
        }
    }

    public async *fetchEmails(since?: Date): AsyncGenerator<EmailObject> {
        const gmail = google.gmail({ version: 'v1', auth: this.auth });
        let nextPageToken: string | undefined | null = undefined;

        do {
            const res: { data: gmail_v1.Schema$ListMessagesResponse; } =
                await gmail.users.messages.list({
                    userId: 'me',
                    q: since ? `after:${Math.floor(since.getTime() / 1000)}` : '',
                    pageToken: nextPageToken || undefined,
                });

            const messages = res.data.messages || [];
            for (const message of messages) {
                if (message.id) {
                    const msg = await gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'raw',
                    });
                    if (msg.data.raw) {
                        yield {
                            id: msg.data.id!,
                            headers: msg.data.payload?.headers || [],
                            body: Buffer.from(msg.data.raw, 'base64').toString('utf-8'),
                        };
                    }
                }
            }
            nextPageToken = res.data.nextPageToken;
        } while (nextPageToken);
    }
}
