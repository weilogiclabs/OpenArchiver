import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';
import type { IngestionSource } from '@open-archiver/types';

export const load: PageServerLoad = async (event) => {
    try {
        const response = await api('/ingestion-sources', event);
        if (!response.ok) {
            throw new Error(`Failed to fetch ingestion sources: ${response.statusText}`);
        }
        const ingestionSources: IngestionSource[] = await response.json();
        return {
            ingestionSources
        };
    } catch (error) {
        console.error('Failed to load ingestion sources:', error);
        return {
            ingestionSources: [],
            error: 'Failed to load ingestion sources'
        };
    }
};
