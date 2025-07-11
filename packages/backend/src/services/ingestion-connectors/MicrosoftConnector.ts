import type { Microsoft365Credentials } from '@open-archive/types';
import type { IEmailConnector, EmailObject } from '../EmailProviderFactory';
import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';

const GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0';

export class MicrosoftConnector implements IEmailConnector {
    private cca: ConfidentialClientApplication;

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

    public async *fetchEmails(since?: Date): AsyncGenerator<EmailObject> {
        const accessToken = await this.getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };

        let nextLink: string | undefined = `${GRAPH_API_ENDPOINT}/users/me/messages`;
        if (since) {
            nextLink += `?$filter=receivedDateTime ge ${since.toISOString()}`;
        }

        while (nextLink) {
            const res: { data: { value: any[]; '@odata.nextLink'?: string; }; } = await axios.get(
                nextLink,
                { headers }
            );
            const messages = res.data.value;

            for (const message of messages) {
                // The raw MIME content is not directly available in the list view.
                // A second request is needed to get the full content.
                const rawContentRes = await axios.get(
                    `${GRAPH_API_ENDPOINT}/users/me/messages/${message.id}/$value`,
                    { headers }
                );
                yield {
                    id: message.id,
                    headers: message, // The list response contains most headers
                    body: rawContentRes.data,
                };
            }
            nextLink = res.data['@odata.nextLink'];
        }
    }
}
