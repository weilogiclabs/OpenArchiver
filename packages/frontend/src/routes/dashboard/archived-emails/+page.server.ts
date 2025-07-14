import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';
import type { IngestionSource, PaginatedArchivedEmails } from '@open-archiver/types';

export const load: PageServerLoad = async (event) => {
    try {
        const { url } = event;
        const ingestionSourceId = url.searchParams.get('ingestionSourceId');
        const page = url.searchParams.get('page') || '1';
        const limit = url.searchParams.get('limit') || '10';

        const sourcesResponse = await api('/ingestion-sources', event);
        if (!sourcesResponse.ok) {
            throw new Error(`Failed to fetch ingestion sources: ${sourcesResponse.statusText}`);
        }
        const ingestionSources: IngestionSource[] = await sourcesResponse.json();

        let archivedEmails: PaginatedArchivedEmails = {
            items: [],
            total: 0,
            page: 1,
            limit: 10
        };

        const selectedIngestionSourceId = ingestionSourceId || ingestionSources[0]?.id;

        if (selectedIngestionSourceId) {
            const emailsResponse = await api(
                `/archived-emails/ingestion-source/${selectedIngestionSourceId}?page=${page}&limit=${limit}`,
                event
            );
            if (!emailsResponse.ok) {
                throw new Error(`Failed to fetch archived emails: ${emailsResponse.statusText}`);
            }
            archivedEmails = await emailsResponse.json();
        }

        return {
            ingestionSources,
            archivedEmails,
            selectedIngestionSourceId
        };
    } catch (error) {
        console.error('Failed to load archived emails page:', error);
        return {
            ingestionSources: [],
            archivedEmails: {
                items: [],
                total: 0,
                page: 1,
                limit: 10
            },
            error: 'Failed to load data'
        };
    }
};
