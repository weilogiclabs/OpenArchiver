import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '@open-archive/types';

interface AuthState {
    accessToken: string | null;
    user: Omit<User, 'passwordHash'> | null;
}

const initialValue: AuthState = {
    accessToken: null,
    user: null,
};

// Function to get the initial state from localStorage
const getInitialState = (): AuthState => {
    if (!browser) {
        return initialValue;
    }

    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
        try {
            return {
                accessToken: storedToken,
                user: JSON.parse(storedUser),
            };
        } catch (e) {
            console.error('Failed to parse user from localStorage', e);
            return initialValue;
        }
    }

    return initialValue;
};

const createAuthStore = () => {
    const { subscribe, set } = writable<AuthState>(getInitialState());

    return {
        subscribe,
        login: (accessToken: string, user: Omit<User, 'passwordHash'>) => {
            if (browser) {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('user', JSON.stringify(user));
            }
            set({ accessToken, user });
        },
        logout: () => {
            if (browser) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
            }
            set(initialValue);
        },
    };
};

export const authStore = createAuthStore();
