import type { PageServerLoad, Actions, RequestEvent } from './$types';
import { api } from '$lib/server/api';
import type { SearchResult } from '@open-archiver/types';
import { redirect } from '@sveltejs/kit';

import type { MatchingStrategy } from '@open-archiver/types';

async function performSearch(
    keywords: string,
    page: number,
    matchingStrategy: MatchingStrategy,
    event: RequestEvent
) {
    if (!keywords) {
        return { searchResult: null, keywords: '', page: 1, matchingStrategy: 'last' };
    }

    try {
        const response = await api(
            `/search?keywords=${keywords}&page=${page}&limit=10&matchingStrategy=${matchingStrategy}`,
            event,
            {
                method: 'GET'
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return { searchResult: null, keywords, page, matchingStrategy, error: error.message };
        }

        const searchResult = (await response.json()) as SearchResult;
        return { searchResult, keywords, page, matchingStrategy };
    } catch (error) {
        return {
            searchResult: null,
            keywords,
            page,
            matchingStrategy,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export const load: PageServerLoad = async (event) => {
    const keywords = event.url.searchParams.get('keywords') || '';
    const page = parseInt(event.url.searchParams.get('page') || '1');
    const matchingStrategy = (event.url.searchParams.get('matchingStrategy') ||
        'last') as MatchingStrategy;
    return performSearch(keywords, page, matchingStrategy, event);
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const keywords = formData.get('keywords') as string;
        const matchingStrategy = formData.get('matchingStrategy') as MatchingStrategy;

        if (keywords) {
            throw redirect(
                303,
                `/dashboard/search?keywords=${encodeURIComponent(
                    keywords
                )}&page=1&matchingStrategy=${matchingStrategy}`
            );
        }

        return {
            searchResult: null,
            keywords: '',
            page: 1,
            matchingStrategy: 'last'
        };
    }
};
