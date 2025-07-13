export type IngestionProvider = 'google_workspace' | 'microsoft_365' | 'generic_imap';

export type IngestionStatus =
    | 'active'
    | 'paused'
    | 'error'
    | 'pending_auth'
    | 'syncing'
    | 'auth_success';

export interface GenericImapCredentials {
    type: 'generic_imap';
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password?: string;
}

export interface GoogleWorkspaceCredentials {
    type: 'google_workspace';
    clientId: string;
    clientSecret: string;
}

export interface Microsoft365Credentials {
    type: 'microsoft_365';
    clientId: string;
    clientSecret: string;
}

// Discriminated union for all possible credential types
export type IngestionCredentials =
    | GenericImapCredentials
    | GoogleWorkspaceCredentials
    | Microsoft365Credentials;

export interface IngestionSource {
    id: string;
    name: string;
    provider: IngestionProvider;
    status: IngestionStatus;
    createdAt: Date;
    updatedAt: Date;
    credentials: IngestionCredentials;
}

export interface CreateIngestionSourceDto {
    name: string;
    provider: IngestionProvider;
    providerConfig: Record<string, any>;
}

export interface UpdateIngestionSourceDto {
    name?: string;
    provider?: IngestionProvider;
    status?: IngestionStatus;
    providerConfig?: Record<string, any>;
    lastSyncStartedAt?: Date;
    lastSyncFinishedAt?: Date;
    lastSyncStatusMessage?: string;
}

export interface IInitialImportJob {
    ingestionSourceId: string;
}
