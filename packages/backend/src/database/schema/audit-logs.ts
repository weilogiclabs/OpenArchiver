import { bigserial, boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    actorIdentifier: text('actor_identifier').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    details: jsonb('details'),
    isTamperEvident: boolean('is_tamper_evident').default(false),
});
