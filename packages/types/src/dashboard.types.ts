export interface DashboardStats {
    totalEmailsArchived: number;
    totalStorageUsed: number;
    failedIngestionsLast7Days: number;
}

export interface IngestionHistory {
    history: {
        date: string;
        count: number;
    }[];
}

export interface IngestionSourceStats {
    id: string;
    name: string;
    provider: string;
    status: string;
    storageUsed: number;
}

export interface RecentSync {
    id: string;
    sourceName: string;
    startTime: string;
    duration: number;
    emailsProcessed: number;
    status: string;
}

export interface TopSender {
    sender: string;
    count: number;
}

export interface IndexedInsights {
    topSenders: TopSender[];
}
