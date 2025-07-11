import type { Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import type { User } from '@open-archive/types';

const JWT_SECRET = new TextEncoder().encode('a-very-secret-key');

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('accessToken');

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            event.locals.user = payload as Omit<User, 'passwordHash'>;
            event.locals.accessToken = token;
        } catch (error) {
            console.error('JWT verification failed:', error);
            event.locals.user = null;
            event.locals.accessToken = null;
        }
    } else {
        event.locals.user = null;
        event.locals.accessToken = null;
    }

    return resolve(event);
};
