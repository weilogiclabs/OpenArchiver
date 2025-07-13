import { persisted } from 'svelte-persisted-store';

type Theme = 'light' | 'dark' | 'system';

export const theme = persisted<Theme>('theme', 'system');
