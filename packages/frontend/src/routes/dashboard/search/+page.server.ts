import type { PageServerLoad, Actions } from './$types';
import { api } from '$lib/server/api';
import type { SearchResult } from '@open-archiver/types';

export const load: PageServerLoad = async () => {
    return {
        searchResult: null,
        query: ''
    };
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const query = formData.get('query') as string;

        if (!query) {
            return { searchResult: null, query: '' };
        }

        try {
            const response = await api(
                '/search',
                event,
                {
                    method: 'POST',
                    body: JSON.stringify({ query })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                return { searchResult: null, query, error: error.message };
            }

            const searchResult = await response.json() as SearchResult;
            return { searchResult, query };
        } catch (error) {
            return { searchResult: null, query, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
};
