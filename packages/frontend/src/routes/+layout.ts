import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/auth.store';

// List of routes that are accessible to unauthenticated users.
const publicRoutes = ['/signin'];

export const load = ({ url }) => {
    // Route protection should only run on the client side where the authStore
    // is reliably hydrated from localStorage.
    if (browser) {
        const { accessToken } = get(authStore);
        const isPublicRoute = publicRoutes.includes(url.pathname);

        // If the user is not logged in and trying to access a private route...
        if (!accessToken && !isPublicRoute) {
            // ...redirect them to the sign-in page.
            throw redirect(307, '/signin');
        }

        // If the user is logged in and trying to access a public route (like /signin)...
        if (accessToken && isPublicRoute) {
            // ...redirect them to the dashboard.
            throw redirect(307, '/dashboard');
        }
    }

    // For all other cases, allow the page to load.
    return {};
};
