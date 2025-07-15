import { Job } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { IInitialImportJob } from '@open-archiver/types';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { GoogleWorkspaceConnector } from '../../services/ingestion-connectors/GoogleWorkspaceConnector';
import { ingestionQueue } from '../queues';
import { logger } from '../../config/logger';

export default async (job: Job<IInitialImportJob>) => {
    const { ingestionSourceId } = job.data;
    logger.info({ ingestionSourceId }, 'Starting initial import master job');

    try {
        const source = await IngestionService.findById(ingestionSourceId);
        if (!source) {
            throw new Error(`Ingestion source with ID ${ingestionSourceId} not found`);
        }

        const connector = EmailProviderFactory.createConnector(source);

        if (connector instanceof GoogleWorkspaceConnector) {
            let userCount = 0;
            for await (const user of connector.listAllUsers()) {
                if (user.primaryEmail) {
                    await ingestionQueue.add('process-mailbox', {
                        ingestionSourceId,
                        userEmail: user.primaryEmail
                    });
                    userCount++;
                }
            }
            logger.info({ ingestionSourceId, userCount }, `Enqueued mailbox processing jobs for all users`);
        } else {
            // For other providers, we might trigger a simpler bulk import directly
            await new IngestionService().performBulkImport(job.data);
        }

        logger.info({ ingestionSourceId }, 'Finished initial import master job');
    } catch (error) {
        logger.error({ err: error, ingestionSourceId }, 'Error in initial import master job');
        throw error;
    }
};
