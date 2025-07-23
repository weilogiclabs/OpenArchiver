import type { PageServerLoad } from './$types';
import { api } from '$lib/server/api';
import type {
    DashboardStats,
    IngestionHistory,
    IngestionSourceStats,
    RecentSync
} from '@open-archiver/types';

export const load: PageServerLoad = async (event) => {
    const fetchStats = async (): Promise<DashboardStats | null> => {
        try {
            const response = await api('/dashboard/stats', event);
            if (!response.ok) throw new Error('Failed to fetch stats');
            return await response.json();
        } catch (error) {
            console.error('Dashboard Stats Error:', error);
            return null;
        }
    };

    const fetchIngestionHistory = async (): Promise<IngestionHistory | null> => {
        try {
            const response = await api('/dashboard/ingestion-history', event);
            if (!response.ok) throw new Error('Failed to fetch ingestion history');
            return await response.json();
        } catch (error) {
            console.error('Ingestion History Error:', error);
            return null;
        }
    };

    const fetchIngestionSources = async (): Promise<IngestionSourceStats[] | null> => {
        try {
            const response = await api('/dashboard/ingestion-sources', event);
            if (!response.ok) throw new Error('Failed to fetch ingestion sources');
            return await response.json();
        } catch (error) {
            console.error('Ingestion Sources Error:', error);
            return null;
        }
    };

    const fetchRecentSyncs = async (): Promise<RecentSync[] | null> => {
        try {
            const response = await api('/dashboard/recent-syncs', event);
            if (!response.ok) throw new Error('Failed to fetch recent syncs');
            return await response.json();
        } catch (error) {
            console.error('Recent Syncs Error:', error);
            return null;
        }
    };

    return {
        stats: fetchStats(),
        ingestionHistory: fetchIngestionHistory(),
        ingestionSources: fetchIngestionSources(),
        recentSyncs: fetchRecentSyncs()
    };
};
