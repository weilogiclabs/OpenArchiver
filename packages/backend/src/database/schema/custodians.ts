import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ingestionProviderEnum } from './ingestion-sources';

export const custodians = pgTable('custodians', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    displayName: text('display_name'),
    sourceType: ingestionProviderEnum('source_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
