import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth.store';
import { browser } from '$app/environment';

export const load = () => {
    // This logic should only run on the client side where the authStore is hydrated
    // from localStorage.
    if (browser) {
        const { accessToken } = get(authStore);

        if (accessToken) {
            // If logged in, go to the dashboard.
            throw redirect(307, '/dashboard');
        } else {
            // If not logged in, go to the sign-in page.
            throw redirect(307, '/signin');
        }
    }

    // On the server, we don't know the auth state, so we don't redirect.
    // The client-side navigation will take over.
    return {};
};
