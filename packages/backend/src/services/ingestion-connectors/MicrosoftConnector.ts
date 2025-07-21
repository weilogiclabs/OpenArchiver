import type { Microsoft365Credentials, EmailObject, EmailAddress, SyncState } from '@open-archiver/types';
import type { IEmailConnector } from '../EmailProviderFactory';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { simpleParser, ParsedMail, Attachment, AddressObject } from 'mailparser';
import axios from 'axios';

const GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0';

export class MicrosoftConnector implements IEmailConnector {
    private cca: ConfidentialClientApplication;
    private newDeltaToken: string | undefined;

    constructor(private credentials: Microsoft365Credentials) {
        this.cca = new ConfidentialClientApplication({
            auth: {
                clientId: this.credentials.clientId,
                clientSecret: this.credentials.clientSecret,
            },
        });
    }

    private async getAccessToken(): Promise<string> {
        const result = await this.cca.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default'],
        });
        if (!result?.accessToken) {
            throw new Error('Failed to acquire access token');
        }
        return result.accessToken;
    }

    public async testConnection(): Promise<boolean> {
        try {
            await this.getAccessToken();
            return true;
        } catch (error) {
            console.error('Failed to verify Microsoft 365 connection:', error);
            return false;
        }
    }

    public async *fetchEmails(userEmail: string, syncState?: SyncState | null): AsyncGenerator<EmailObject> {
        const accessToken = await this.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };

        let nextLink: string | undefined;

        const deltaToken = syncState?.microsoft?.[userEmail]?.deltaToken;

        if (deltaToken) {
            nextLink = `${GRAPH_API_ENDPOINT}/me/mailFolders/allmail/messages/delta?$deltaToken=${deltaToken}`;
        } else {
            nextLink = `${GRAPH_API_ENDPOINT}/me/mailFolders/allmail/messages/delta`;
        }


        while (nextLink) {
            const res: { data: { value: any[]; '@odata.nextLink'?: string; '@odata.deltaLink'?: string; }; } = await axios.get(
                nextLink,
                { headers }
            );
            const messages = res.data.value;

            const deltaLink = res.data['@odata.deltaLink'];
            if (deltaLink) {
                const deltaToken = new URL(deltaLink).searchParams.get('$deltatoken');
                if (deltaToken) {
                    this.newDeltaToken = deltaToken;
                }
            }


            for (const message of messages) {
                // Skip if the message is deleted
                if (message['@removed']) {
                    continue;
                }
                const rawContentRes = await axios.get(
                    `${GRAPH_API_ENDPOINT}/users/me/messages/${message.id}/$value`,
                    { headers }
                );
                const emlBuffer = Buffer.from(rawContentRes.data, 'utf-8');
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
                    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
                    return addressArray.flatMap(a =>
                        a.value.map(v => ({ name: v.name, address: v.address || '' }))
                    );
                };

                yield {
                    id: message.id,
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
            nextLink = res.data['@odata.nextLink'];
        }
    }

    public getUpdatedSyncState(userEmail: string): SyncState {
        if (!this.newDeltaToken) {
            return {};
        }
        return {
            microsoft: {
                [userEmail]: {
                    deltaToken: this.newDeltaToken
                }
            }
        };
    }
}
