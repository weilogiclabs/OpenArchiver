import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

config();

const runMigrate = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set in the .env file');
    }

    const connection = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(connection);

    console.log('Running migrations...');

    await migrate(db, { migrationsFolder: 'src/database/migrations' });

    console.log('Migrations completed!');
    process.exit(0);
};

runMigrate().catch((err) => {
    console.error('Migration failed!', err);
    process.exit(1);
});
