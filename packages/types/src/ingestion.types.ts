export type IngestionProvider = 'google_workspace' | 'microsoft_365' | 'generic_imap';

export type IngestionStatus = 'active' | 'paused' | 'error' | 'pending_auth' | 'syncing';

export interface IngestionSource {
    id: string;
    name: string;
    provider: IngestionProvider;
    status: IngestionStatus;
    createdAt: Date;
    updatedAt: Date;
    providerConfig: Record<string, any>;
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
}
