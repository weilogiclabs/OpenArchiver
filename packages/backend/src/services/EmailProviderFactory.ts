import type {
    IngestionSource,
    GoogleWorkspaceCredentials,
    Microsoft365Credentials,
    GenericImapCredentials,
    EmailObject,
    SyncState
} from '@open-archiver/types';
import { GoogleWorkspaceConnector } from './ingestion-connectors/GoogleWorkspaceConnector';
import { MicrosoftConnector } from './ingestion-connectors/MicrosoftConnector';
import { ImapConnector } from './ingestion-connectors/ImapConnector';

// Define a common interface for all connectors
export interface IEmailConnector {
    testConnection(): Promise<boolean>;
    fetchEmails(userEmail: string, syncState?: SyncState | null): AsyncGenerator<EmailObject>;
    getUpdatedSyncState(userEmail?: string): SyncState;
    listAllUsers?(): AsyncGenerator<any>;
}

export class EmailProviderFactory {
    static createConnector(source: IngestionSource): IEmailConnector {
        // Credentials are now decrypted by the IngestionService before being passed around
        const credentials = source.credentials;

        switch (source.provider) {
            case 'google_workspace':
                return new GoogleWorkspaceConnector(credentials as GoogleWorkspaceCredentials);
            case 'microsoft_365':
                return new MicrosoftConnector(credentials as Microsoft365Credentials);
            case 'generic_imap':
                return new ImapConnector(credentials as GenericImapCredentials);
            default:
                throw new Error(`Unsupported provider: ${source.provider}`);
        }
    }
}
