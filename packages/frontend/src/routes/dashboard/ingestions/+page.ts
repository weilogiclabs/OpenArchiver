import { api } from '$lib/api';
import type { PageLoad } from './$types';
import type { IngestionSource } from '@open-archive/types';

export const load: PageLoad = async ({ fetch }) => {
    try {
        const response = await api('/ingestion-sources', {}, fetch);
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
