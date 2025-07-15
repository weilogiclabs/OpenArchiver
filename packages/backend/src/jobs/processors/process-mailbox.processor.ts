import { Job } from 'bullmq';
import { IProcessMailboxJob } from '@open-archiver/types';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { StorageService } from '../../services/StorageService';

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

        for await (const email of connector.fetchEmails(userEmail)) {
            await ingestionService.processEmail(email, source, storageService);
        }
        logger.info({ ingestionSourceId, userEmail }, `Finished processing mailbox for user`);
    } catch (error) {
        logger.error({ err: error, ingestionSourceId, userEmail }, 'Error processing mailbox');
        throw error;
    }
};
