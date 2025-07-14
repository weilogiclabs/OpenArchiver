import { api } from '$lib/server/api';
import type { PageServerLoad } from './$types';
import type { ArchivedEmail } from '@open-archiver/types';

export const load: PageServerLoad = async (event) => {
    try {
        const { id } = event.params;
        const response = await api(`/archived-emails/${id}`, event);
        if (!response.ok) {
            throw new Error(`Failed to fetch archived email: ${response.statusText}`);
        }
        const email: ArchivedEmail = await response.json();
        return {
            email
        };
    } catch (error) {
        console.error('Failed to load archived email:', error);
        return {
            email: null,
            error: 'Failed to load email'
        };
    }
};
