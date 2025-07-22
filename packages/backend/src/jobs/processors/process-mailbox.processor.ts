import { Job } from 'bullmq';
import { IProcessMailboxJob } from '@open-archiver/types';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { StorageService } from '../../services/StorageService';

import { db } from '../../database';
import { ingestionSources } from '../../database/schema';
import { eq, sql } from 'drizzle-orm';

export const processMailboxProcessor = async (job: Job<IProcessMailboxJob, any, string>) => {
    const { ingestionSourceId, userEmail } = job.data;

    logger.info({ ingestionSourceId, userEmail }, `Processing mailbox for user`);

    try {
        const source = await IngestionService.findById(ingestionSourceId);
        if (!source) {
            throw new Error(`Ingestion source with ID ${ingestionSourceId} not found`);
        }

        const connector = EmailProviderFactory.createConnector(source);
        const ingestionService = new IngestionService();
        const storageService = new StorageService();

        // Pass the sync state for the entire source, the connector will handle per-user logic if necessary
        for await (const email of connector.fetchEmails(userEmail, source.syncState)) {
            if (email) {
                await ingestionService.processEmail(email, source, storageService);
            }
        }

        const newSyncState = connector.getUpdatedSyncState(userEmail);

        // Atomically update the syncState JSONB field to prevent race conditions
        const provider = Object.keys(newSyncState)[0] as keyof typeof newSyncState | undefined;

        if (provider && newSyncState[provider]) {
            let path: (string | number)[];
            let userState: any;

            if (provider === 'imap') {
                path = ['imap'];
                userState = newSyncState.imap;
            } else {
                // Handles 'google' and 'microsoft'
                path = [provider, userEmail];
                userState = (newSyncState[provider] as any)?.[userEmail];
            }

            if (userState) {
                await db
                    .update(ingestionSources)
                    .set({
                        syncState: sql`jsonb_set(
                            COALESCE(${ingestionSources.syncState}, '{}'::jsonb),
                            '{${sql.raw(path.join(','))}}',
                            ${JSON.stringify(userState)}::jsonb,
                            true
                        )`,
                        updatedAt: new Date()
                    })
                    .where(eq(ingestionSources.id, ingestionSourceId));
            } else {
                logger.warn({ ingestionSourceId, userEmail, provider }, `No sync state found for user under provider`);
            }
        }
        logger.info({ ingestionSourceId, userEmail }, `Finished processing mailbox for user`);
    } catch (error) {
        logger.error({ err: error, ingestionSourceId, userEmail }, 'Error processing mailbox');
        throw error;
    }
};
