import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid, bigint } from 'drizzle-orm/pg-core';
import { custodians } from './custodians';

export const archivedEmails = pgTable('archived_emails', {
    id: uuid('id').primaryKey().defaultRandom(),
    custodianId: uuid('custodian_id').notNull().references(() => custodians.id, { onDelete: 'cascade' }),
    messageIdHeader: text('message_id_header').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    subject: text('subject'),
    senderName: text('sender_name'),
    senderEmail: text('sender_email').notNull(),
    recipients: jsonb('recipients'),
    storagePath: text('storage_path').notNull(),
    storageHashSha256: text('storage_hash_sha256').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    isIndexed: boolean('is_indexed').notNull().default(false),
    hasAttachments: boolean('has_attachments').notNull().default(false),
    isOnLegalHold: boolean('is_on_legal_hold').notNull().default(false),
    archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
});

export const archivedEmailsRelations = relations(archivedEmails, ({ one }) => ({
    custodian: one(custodians, {
        fields: [archivedEmails.custodianId],
        references: [custodians.id],
    }),
}));
