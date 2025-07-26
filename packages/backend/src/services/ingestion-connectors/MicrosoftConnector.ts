import 'cross-fetch/polyfill';
import type {
    Microsoft365Credentials,
    EmailObject,
    EmailAddress,
    SyncState,
    MailboxUser
} from '@open-archiver/types';
import type { IEmailConnector } from '../EmailProviderFactory';
import { logger } from '../../config/logger';
import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
import { ConfidentialClientApplication, Configuration, LogLevel } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import type { User, MailFolder } from 'microsoft-graph';
import type { AuthProvider } from '@microsoft/microsoft-graph-client';

/**
 * A connector for Microsoft 365 that uses the Microsoft Graph API with client credentials (app-only)
 * to access data on behalf of the organization.
 */
export class MicrosoftConnector implements IEmailConnector {
    private credentials: Microsoft365Credentials;
    private graphClient: Client;
    // Store delta tokens for each folder during a sync operation.
    private newDeltaTokens: { [folderId: string]: string; };

    constructor(credentials: Microsoft365Credentials) {
        this.credentials = credentials;
        this.newDeltaTokens = {}; // Initialize as an empty object

        const msalConfig: Configuration = {
            auth: {
                clientId: this.credentials.clientId,
                authority: `https://login.microsoftonline.com/${this.credentials.tenantId}`,
                clientSecret: this.credentials.clientSecret,
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        if (containsPii) return;
                        switch (loglevel) {
                            case LogLevel.Error:
                                logger.error(message);
                                return;
                            case LogLevel.Warning:
                                logger.warn(message);
                                return;
                            case LogLevel.Info:
                                logger.info(message);
                                return;
                            case LogLevel.Verbose:
                                logger.debug(message);
                                return;
                        }
                    },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Warning,
                }
            }
        };

        const msalClient = new ConfidentialClientApplication(msalConfig);

        const authProvider: AuthProvider = async (done) => {
            try {
                const response = await msalClient.acquireTokenByClientCredential({
                    scopes: ['https://graph.microsoft.com/.default'],
                });
                if (!response?.accessToken) {
                    throw new Error('Failed to acquire access token.');
                }
                done(null, response.accessToken);
            } catch (error) {
                logger.error({ err: error }, 'Failed to acquire Microsoft Graph access token');
                done(error, null);
            }
        };

        this.graphClient = Client.init({ authProvider });
    }

    /**
     * Tests the connection and authentication by attempting to list the first user
     * from the directory.
     */
    public async testConnection(): Promise<boolean> {
        try {
            await this.graphClient.api('/users').top(1).get();
            logger.info('Microsoft 365 connection test successful.');
            return true;
        } catch (error) {
            logger.error({ err: error }, 'Failed to verify Microsoft 365 connection');
            return false;
        }
    }

    /**
     * Lists all users in the Microsoft 365 tenant.
     * This method handles pagination to retrieve the complete list of users.
     * @returns An async generator that yields each user object.
     */
    public async *listAllUsers(): AsyncGenerator<MailboxUser> {
        let request = this.graphClient.api('/users').select('id,userPrincipalName,displayName');

        try {
            let response = await request.get();
            while (response) {
                for (const user of response.value as User[]) {
                    if (user.id && user.userPrincipalName && user.displayName) {
                        yield {
                            id: user.id,
                            primaryEmail: user.userPrincipalName,
                            displayName: user.displayName
                        };
                    }
                }

                if (response['@odata.nextLink']) {
                    response = await this.graphClient.api(response['@odata.nextLink']).get();
                } else {
                    break;
                }
            }
        } catch (error) {
            logger.error({ err: error }, 'Failed to list all users from Microsoft 365');
            throw error;
        }
    }

    /**
     * Fetches emails for a single user by iterating through all mail folders and
     * performing a delta query on each.
     * @param userEmail The user principal name or ID of the user.
     * @param syncState Optional state containing the deltaTokens for each folder.
     * @returns An async generator that yields each raw email object.
     */
    public async *fetchEmails(
        userEmail: string,
        syncState?: SyncState | null
    ): AsyncGenerator<EmailObject> {
        this.newDeltaTokens = syncState?.microsoft?.[userEmail]?.deltaTokens || {};

        try {
            const folders = this.listAllFolders(userEmail);
            for await (const folder of folders) {
                if (folder.id) {
                    logger.info({ userEmail, folderId: folder.id, folderName: folder.displayName }, 'Syncing folder');
                    yield* this.syncFolder(userEmail, folder.id, this.newDeltaTokens[folder.id]);
                }
            }
        } catch (error) {
            logger.error({ err: error, userEmail }, 'Failed to fetch emails from Microsoft 365');
            throw error;
        }
    }

    /**
     * Lists all mail folders for a given user.
     * @param userEmail The user principal name or ID.
     * @returns An async generator that yields each mail folder.
     */
    private async *listAllFolders(userEmail: string): AsyncGenerator<MailFolder> {
        let requestUrl: string | undefined = `/users/${userEmail}/mailFolders`;

        while (requestUrl) {
            try {
                const response = await this.graphClient.api(requestUrl).get();
                for (const folder of response.value as MailFolder[]) {
                    yield folder;
                }
                requestUrl = response['@odata.nextLink'];
            } catch (error) {
                logger.error({ err: error, userEmail }, 'Failed to list mail folders');
                throw error; // Stop if we can't list folders
            }
        }
    }

    /**
     * Performs a delta sync on a single mail folder.
     * @param userEmail The user's email.
     * @param folderId The ID of the folder to sync.
     * @param deltaToken The existing delta token for this folder, if any.
     * @returns An async generator that yields email objects.
     */
    private async *syncFolder(
        userEmail: string,
        folderId: string,
        deltaToken?: string
    ): AsyncGenerator<EmailObject> {
        let requestUrl: string | undefined;

        if (deltaToken) {
            // Continuous sync
            requestUrl = deltaToken;
        } else {
            // Initial sync
            requestUrl = `/users/${userEmail}/mailFolders/${folderId}/messages/delta`;
        }

        while (requestUrl) {
            try {
                const response = await this.graphClient.api(requestUrl).get();

                for (const message of response.value) {
                    if (message.id && !(message as any)['@removed']) {
                        const rawEmail = await this.getRawEmail(userEmail, message.id);
                        if (rawEmail) {
                            yield await this.parseEmail(rawEmail, message.id, userEmail);
                        }
                    }
                }

                if (response['@odata.deltaLink']) {
                    this.newDeltaTokens[folderId] = response['@odata.deltaLink'];
                }

                requestUrl = response['@odata.nextLink'];
            } catch (error) {
                logger.error({ err: error, userEmail, folderId }, 'Failed to sync mail folder');
                // Continue to the next folder if one fails
                return;
            }
        }
    }

    private async getRawEmail(userEmail: string, messageId: string): Promise<Buffer | null> {
        try {
            const response = await this.graphClient.api(`/users/${userEmail}/messages/${messageId}/$value`).getStream();
            const chunks: any[] = [];
            for await (const chunk of response) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (error) {
            logger.error({ err: error, userEmail, messageId }, 'Failed to fetch raw email content.');
            return null;
        }
    }

    private async parseEmail(rawEmail: Buffer, messageId: string, userEmail: string): Promise<EmailObject> {
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

        return {
            id: messageId,
            userEmail: userEmail,
            eml: rawEmail,
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
        };
    }

    public getUpdatedSyncState(userEmail: string): SyncState {
        if (Object.keys(this.newDeltaTokens).length === 0) {
            return {};
        }
        return {
            microsoft: {
                [userEmail]: {
                    deltaTokens: this.newDeltaTokens
                }
            }
        };
    }
}
