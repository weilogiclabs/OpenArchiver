import { Job } from 'bullmq';
import { IProcessMailboxJob, EmailObject } from '@open-archiver/types';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { GoogleWorkspaceConnector } from '../../services/ingestion-connectors/GoogleWorkspaceConnector';
import { StorageService } from '../../services/StorageService';
import { indexingQueue } from '../queues';

export const processMailboxProcessor = async (job: Job<IProcessMailboxJob, any, string>) => {
    const { ingestionSourceId, userEmail } = job.data;

    logger.info({ ingestionSourceId, userEmail }, `Processing mailbox for user`);

    try {
        const source = await IngestionService.findById(ingestionSourceId);
        if (!source) {
            throw new Error(`Ingestion source with ID ${ingestionSourceId} not found`);
        }

        const connector = EmailProviderFactory.createConnector(source);

        if (connector instanceof GoogleWorkspaceConnector) {
            for await (const email of connector.fetchEmails(userEmail)) {
                if (!email.raw) {
                    logger.warn({ emailId: email.id }, 'Skipping email without raw content');
                    continue;
                }
                const buffer = Buffer.from(email.raw, 'base64url');
                const storageService = new StorageService();
                const storagePath = `emails/${ingestionSourceId}/${userEmail}/${email.id}.eml`;
                await storageService.put(storagePath, buffer);
                await indexingQueue.add('index-email', { emailId: email.id });
            }
        } else {
            logger.warn(
                { ingestionSourceId, userEmail },
                'Skipping mailbox processing for non-Google Workspace provider'
            );
        }

        logger.info({ ingestionSourceId, userEmail }, `Finished processing mailbox for user`);
    } catch (error) {
        logger.error({ err: error, ingestionSourceId, userEmail }, 'Error processing mailbox');
        throw error;
    }
};
