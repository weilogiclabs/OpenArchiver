import { google } from 'googleapis';
import type { admin_directory_v1, gmail_v1, Common } from 'googleapis';
import type {
    GoogleWorkspaceCredentials,
    EmailObject,
    EmailAddress
} from '@open-archiver/types';
import type { IEmailConnector } from '../EmailProviderFactory';
import { logger } from '../../config/logger';
import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';

/**
 * A connector for Google Workspace that uses a service account with domain-wide delegation
 * to access user data on behalf of users in the domain.
 */
export class GoogleWorkspaceConnector implements IEmailConnector {
    private credentials: GoogleWorkspaceCredentials;
    private serviceAccountCreds: { client_email: string; private_key: string; };

    constructor(credentials: GoogleWorkspaceCredentials) {
        this.credentials = credentials;
        try {
            // Pre-parse the JSON key to catch errors early.
            const parsedKey = JSON.parse(this.credentials.serviceAccountKeyJson);
            if (!parsedKey.client_email || !parsedKey.private_key) {
                throw new Error('Service account key JSON is missing required fields.');
            }
            this.serviceAccountCreds = {
                client_email: parsedKey.client_email,
                private_key: parsedKey.private_key
            };
        } catch (error) {
            logger.error({ err: error }, 'Failed to parse Google Service Account JSON');
            throw new Error('Invalid Google Service Account JSON key.');
        }
    }

    /**
     * Creates an authenticated JWT client capable of impersonating a user.
     * @param subject The email address of the user to impersonate.
     * @param scopes The OAuth scopes required for the API calls.
     * @returns An authenticated JWT client.
     */
    private getAuthClient(subject: string, scopes: string[]) {
        const jwtClient = new google.auth.JWT({
            email: this.serviceAccountCreds.client_email,
            key: this.serviceAccountCreds.private_key,
            scopes,
            subject
        });
        return jwtClient;
    }

    /**
     * Tests the connection and authentication by attempting to list the first user
     * from the directory, impersonating the admin user.
     */
    public async testConnection(): Promise<boolean> {
        try {
            const authClient = this.getAuthClient(this.credentials.impersonatedAdminEmail, [
                'https://www.googleapis.com/auth/admin.directory.user.readonly'
            ]);

            const admin = google.admin({
                version: 'directory_v1',
                auth: authClient
            });

            // Perform a simple, low-impact read operation to verify credentials.
            await admin.users.list({
                customer: 'my_customer',
                maxResults: 1,
                orderBy: 'email'
            });

            logger.info('Google Workspace connection test successful.');
            return true;
        } catch (error) {
            logger.error({ err: error }, 'Failed to verify Google Workspace connection');
            return false;
        }
    }

    /**
     * Lists all users in the Google Workspace domain.
     * This method handles pagination to retrieve the complete list of users.
     * @returns An async generator that yields each user object.
     */
    public async *listAllUsers(): AsyncGenerator<admin_directory_v1.Schema$User> {
        const authClient = this.getAuthClient(this.credentials.impersonatedAdminEmail, [
            'https://www.googleapis.com/auth/admin.directory.user.readonly'
        ]);

        const admin = google.admin({ version: 'directory_v1', auth: authClient });
        let pageToken: string | undefined = undefined;

        do {
            const res: Common.GaxiosResponseWithHTTP2<admin_directory_v1.Schema$Users> = await admin.users.list({
                customer: 'my_customer',
                maxResults: 500, // Max allowed per page
                pageToken: pageToken,
                orderBy: 'email'
            });

            const users = res.data.users;
            if (users) {
                for (const user of users) {
                    yield user;
                }
            }
            pageToken = res.data.nextPageToken ?? undefined;
        } while (pageToken);
    }

    /**
     * Fetches emails for a single user, starting from a specific point in time.
     * This is ideal for continuous synchronization jobs.
     * @param userEmail The email of the user whose mailbox will be read.
     * @param since Optional date to fetch emails newer than this timestamp.
     * @returns An async generator that yields each raw email object.
     */
    public async *fetchEmails(
        userEmail: string,
        since?: Date
    ): AsyncGenerator<EmailObject> {
        const authClient = this.getAuthClient(userEmail, [
            'https://www.googleapis.com/auth/gmail.readonly'
        ]);

        const gmail = google.gmail({ version: 'v1', auth: authClient });
        let pageToken: string | undefined = undefined;

        const query = since ? `after:${Math.floor(since.getTime() / 1000)}` : '';

        do {
            const listResponse: Common.GaxiosResponseWithHTTP2<gmail_v1.Schema$ListMessagesResponse> =
                await gmail.users.messages.list({
                    userId: 'me', // 'me' refers to the impersonated user
                    q: query,
                    pageToken: pageToken
                });

            const messages = listResponse.data.messages;
            if (!messages || messages.length === 0) {
                return;
            }

            for (const message of messages) {
                if (message.id) {
                    const msgResponse = await gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'RAW' // We want the full, raw .eml content
                    });

                    if (msgResponse.data.raw) {
                        // The raw data is base64url encoded, so we need to decode it.
                        const rawEmail = Buffer.from(msgResponse.data.raw, 'base64url');
                        const parsedEmail: ParsedMail = await simpleParser(rawEmail);

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
                            id: msgResponse.data.id!,
                            userEmail: userEmail,
                            eml: rawEmail,
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
                        };
                    }
                }
            }

            pageToken = listResponse.data.nextPageToken ?? undefined;
        } while (pageToken);
    }
}
