import type { GoogleWorkspaceCredentials, EmailObject, EmailAddress } from '@open-archiver/types';
import type { IEmailConnector } from '../EmailProviderFactory';
import { google } from 'googleapis';
import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
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
                        format: 'raw'
                    });
                    if (msg.data.raw) {
                        const emlBuffer = Buffer.from(msg.data.raw, 'base64');
                        const parsedEmail: ParsedMail = await simpleParser(emlBuffer);
                        const attachments = parsedEmail.attachments.map((attachment: Attachment) => ({
                            filename: attachment.filename || 'untitled',
                            contentType: attachment.contentType,
                            size: attachment.size,
                            content: attachment.content as Buffer
                        }));

                        const mapAddresses = (
                            addresses: AddressObject | AddressObject[] | undefined
                        ): EmailAddress[] => {
                            if (!addresses) return [];
                            const addressArray = Array.isArray(addresses)
                                ? addresses
                                : [addresses];
                            return addressArray.flatMap(a =>
                                a.value.map(v => ({ name: v.name, address: v.address || '' }))
                            );
                        };

                        yield {
                            id: msg.data.id!,
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
                            eml: emlBuffer
                        };
                    }
                }
            }
            nextPageToken = res.data.nextPageToken;
        } while (nextPageToken);
    }
}
