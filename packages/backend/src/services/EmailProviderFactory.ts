import type {
    IngestionSource,
    GoogleWorkspaceCredentials,
    Microsoft365Credentials,
    GenericImapCredentials,
    EmailObject
} from '@open-archive/types';
import { GoogleConnector } from './ingestion-connectors/GoogleConnector';
import { MicrosoftConnector } from './ingestion-connectors/MicrosoftConnector';
import { ImapConnector } from './ingestion-connectors/ImapConnector';

// Define a common interface for all connectors
export interface IEmailConnector {
    testConnection(): Promise<boolean>;
    fetchEmails(since?: Date): AsyncGenerator<EmailObject>;
}

export class EmailProviderFactory {
    static createConnector(source: IngestionSource): IEmailConnector {
        // Credentials are now decrypted by the IngestionService before being passed around
        const credentials = source.credentials;

        switch (source.provider) {
            case 'google_workspace':
                return new GoogleConnector(credentials as GoogleWorkspaceCredentials);
            case 'microsoft_365':
                return new MicrosoftConnector(credentials as Microsoft365Credentials);
            case 'generic_imap':
                return new ImapConnector(credentials as GenericImapCredentials);
            default:
                throw new Error(`Unsupported provider: ${source.provider}`);
        }
    }
}
