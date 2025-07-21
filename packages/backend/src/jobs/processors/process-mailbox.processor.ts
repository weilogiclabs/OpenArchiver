import { Job } from 'bullmq';
import { IProcessMailboxJob } from '@open-archiver/types';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { StorageService } from '../../services/StorageService';

import { IngestionSource, SyncState } from '@open-archiver/types';
import { db } from '../../database';
import { ingestionSources } from '../../database/schema';
import { eq } from 'drizzle-orm';

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
            await ingestionService.processEmail(email, source, storageService);
        }

        const newSyncState = connector.getUpdatedSyncState(userEmail);
        // console.log('new sync state: ', newSyncState);
        // Atomically update the syncState JSONB field
        if (Object.keys(newSyncState).length > 0) {
            const currentSource = (await db
                .select({ syncState: ingestionSources.syncState })
                .from(ingestionSources)
                .where(eq(ingestionSources.id, ingestionSourceId))) as IngestionSource[];

            const currentSyncState = currentSource[0]?.syncState || {};

            const mergedSyncState: SyncState = { ...currentSyncState };

            if (newSyncState.google) {
                mergedSyncState.google = { ...mergedSyncState.google, ...newSyncState.google };
            }
            if (newSyncState.microsoft) {
                mergedSyncState.microsoft = { ...mergedSyncState.microsoft, ...newSyncState.microsoft };
            }
            if (newSyncState.imap) {
                mergedSyncState.imap = newSyncState.imap;
            }

            await db
                .update(ingestionSources)
                .set({
                    syncState: mergedSyncState,
                    updatedAt: new Date()
                })
                .where(eq(ingestionSources.id, ingestionSourceId));
        }

        logger.info({ ingestionSourceId, userEmail }, `Finished processing mailbox for user`);
    } catch (error) {
        logger.error({ err: error, ingestionSourceId, userEmail }, 'Error processing mailbox');
        throw error;
    }
};
