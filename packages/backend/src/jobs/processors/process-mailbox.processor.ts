import { Job } from 'bullmq';
import { IProcessMailboxJob, SyncState } from '@open-archiver/types';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { StorageService } from '../../services/StorageService';

export const processMailboxProcessor = async (job: Job<IProcessMailboxJob, SyncState, string>) => {
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
        console.log('newSyncState, ', newSyncState);

        logger.info({ ingestionSourceId, userEmail }, `Finished processing mailbox for user`);

        // Return the new sync state to be aggregated by the parent flow
        return newSyncState;
    } catch (error) {
        logger.error({ err: error, ingestionSourceId, userEmail }, 'Error processing mailbox');
        throw error;
    }
};
