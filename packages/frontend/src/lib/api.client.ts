import { authStore } from '$lib/stores/auth.store';
import type { User } from '@open-archive/types';
import { get } from 'svelte/store';

const BASE_URL = '/api/v1'; // Using a relative URL for proxying

/**
 * A custom fetch wrapper for the client-side to automatically handle authentication headers.
 * @param url The URL to fetch, relative to the API base.
 * @param options The standard Fetch API options.
 * @returns A Promise that resolves to the Fetch Response.
 */
export const api = async (
    url: string,
    options: RequestInit = {}
): Promise<Response> => {
    const { accessToken } = get(authStore);
    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json'
    };

    if (accessToken) {
        defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    const mergedOptions: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    return fetch(`${BASE_URL}${url}`, mergedOptions);
};
