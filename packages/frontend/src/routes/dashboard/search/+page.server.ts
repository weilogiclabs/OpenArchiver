import type { PageServerLoad, Actions, RequestEvent } from './$types';
import { api } from '$lib/server/api';
import type { SearchResult } from '@open-archiver/types';

async function performSearch(query: string, event: RequestEvent) {
    if (!query) {
        return { searchResult: null, query: '' };
    }

    try {
        const response = await api('/search', event, {
            method: 'POST',
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const error = await response.json();
            return { searchResult: null, query, error: error.message };
        }

        const searchResult = (await response.json()) as SearchResult;
        return { searchResult, query };
    } catch (error) {
        return {
            searchResult: null,
            query,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export const load: PageServerLoad = async (event) => {
    const query = event.url.searchParams.get('query') || '';
    return performSearch(query, event);
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const query = formData.get('query') as string;
        return performSearch(query, event);
    }
};
