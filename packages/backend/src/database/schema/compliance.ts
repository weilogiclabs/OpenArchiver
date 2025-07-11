import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { custodians } from './custodians';

// --- Enums ---

export const retentionActionEnum = pgEnum('retention_action', ['delete_permanently', 'notify_admin']);

// --- Tables ---

export const retentionPolicies = pgTable('retention_policies', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    priority: integer('priority').notNull(),
    retentionPeriodDays: integer('retention_period_days').notNull(),
    actionOnExpiry: retentionActionEnum('action_on_expiry').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    conditions: jsonb('conditions'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ediscoveryCases = pgTable('ediscovery_cases', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    status: text('status').notNull().default('open'),
    createdByIdentifier: text('created_by_identifier').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const legalHolds = pgTable('legal_holds', {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id').notNull().references(() => ediscoveryCases.id, { onDelete: 'cascade' }),
    custodianId: uuid('custodian_id').references(() => custodians.id, { onDelete: 'cascade' }),
    holdCriteria: jsonb('hold_criteria'),
    reason: text('reason'),
    appliedByIdentifier: text('applied_by_identifier').notNull(),
    appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp('removed_at', { withTimezone: true }),
});

export const exportJobs = pgTable('export_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: uuid('case_id').references(() => ediscoveryCases.id, { onDelete: 'set null' }),
    format: text('format').notNull(),
    status: text('status').notNull().default('pending'),
    query: jsonb('query').notNull(),
    filePath: text('file_path'),
    createdByIdentifier: text('created_by_identifier').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
});

// --- Relations ---

export const ediscoveryCasesRelations = relations(ediscoveryCases, ({ many }) => ({
    legalHolds: many(legalHolds),
    exportJobs: many(exportJobs),
}));

export const legalHoldsRelations = relations(legalHolds, ({ one }) => ({
    ediscoveryCase: one(ediscoveryCases, {
        fields: [legalHolds.caseId],
        references: [ediscoveryCases.id],
    }),
    custodian: one(custodians, {
        fields: [legalHolds.custodianId],
        references: [custodians.id],
    }),
}));

export const exportJobsRelations = relations(exportJobs, ({ one }) => ({
    ediscoveryCase: one(ediscoveryCases, {
        fields: [exportJobs.caseId],
        references: [ediscoveryCases.id],
    }),
}));
