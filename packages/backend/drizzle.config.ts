import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '../../.env' });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in the .env file');
}

export default defineConfig({
    schema: './src/database/schema.ts',
    out: './src/database/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    verbose: true,
    strict: true,
});
