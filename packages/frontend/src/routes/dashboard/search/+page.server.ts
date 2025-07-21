import type { PageServerLoad, Actions, RequestEvent } from './$types';
import { api } from '$lib/server/api';
import type { SearchResult } from '@open-archiver/types';
import { redirect } from '@sveltejs/kit';

async function performSearch(keywords: string, page: number, event: RequestEvent) {
    if (!keywords) {
        return { searchResult: null, keywords: '', page: 1 };
    }

    try {
        const response = await api(`/search?keywords=${keywords}&page=${page}&limit=10`, event, {
            method: 'GET'
        });

        if (!response.ok) {
            const error = await response.json();
            return { searchResult: null, keywords, page, error: error.message };
        }

        const searchResult = (await response.json()) as SearchResult;
        return { searchResult, keywords, page };
    } catch (error) {
        return {
            searchResult: null,
            keywords,
            page,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export const load: PageServerLoad = async (event) => {
    const keywords = event.url.searchParams.get('keywords') || '';
    const page = parseInt(event.url.searchParams.get('page') || '1');
    return performSearch(keywords, page, event);
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const keywords = formData.get('keywords') as string;

        if (keywords) {
            throw redirect(303, `/dashboard/search?keywords=${keywords}`);
        }

        return {
            searchResult: null,
            keywords: '',
            page: 1
        };
    }
};
