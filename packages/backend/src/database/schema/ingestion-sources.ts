import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const ingestionProviderEnum = pgEnum('ingestion_provider', [
    'google_workspace',
    'microsoft_365',
    'generic_imap'
]);

export const ingestionStatusEnum = pgEnum('ingestion_status', [
    'active',
    'paused',
    'error',
    'pending_auth',
    'syncing',
    'auth_success'
]);

export const ingestionSources = pgTable('ingestion_sources', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    provider: ingestionProviderEnum('provider').notNull(),
    credentials: jsonb('credentials'),
    status: ingestionStatusEnum('status').notNull().default('pending_auth'),
    lastSyncStartedAt: timestamp('last_sync_started_at', { withTimezone: true }),
    lastSyncFinishedAt: timestamp('last_sync_finished_at', { withTimezone: true }),
    lastSyncStatusMessage: text('last_sync_status_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
