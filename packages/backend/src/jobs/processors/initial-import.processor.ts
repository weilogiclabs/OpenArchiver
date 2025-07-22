import { Job } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { IInitialImportJob } from '@open-archiver/types';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { GoogleWorkspaceConnector } from '../../services/ingestion-connectors/GoogleWorkspaceConnector';
import { flowProducer, ingestionQueue } from '../queues';
import { logger } from '../../config/logger';

export default async (job: Job<IInitialImportJob>) => {
    const { ingestionSourceId } = job.data;
    logger.info({ ingestionSourceId }, 'Starting initial import master job');

    try {
        const source = await IngestionService.findById(ingestionSourceId);
        if (!source) {
            throw new Error(`Ingestion source with ID ${ingestionSourceId} not found`);
        }

        await IngestionService.update(ingestionSourceId, {
            status: 'importing',
            lastSyncStatusMessage: 'Starting initial import...'
        });

        const connector = EmailProviderFactory.createConnector(source);

        if (connector instanceof GoogleWorkspaceConnector) {
            const jobs = [];
            let userCount = 0;
            for await (const user of connector.listAllUsers()) {
                if (user.primaryEmail) {
                    jobs.push({
                        name: 'process-mailbox',
                        queueName: 'ingestion',
                        data: {
                            ingestionSourceId,
                            userEmail: user.primaryEmail,
                        }
                    });
                    userCount++;
                }
            }

            if (jobs.length > 0) {
                await flowProducer.add({
                    name: 'sync-cycle-finished',
                    queueName: 'ingestion',
                    data: {
                        ingestionSourceId,
                        userCount,
                        isInitialImport: true
                    },
                    children: jobs
                });
            } else {
                // If there are no users, we can consider the import finished and set to active
                await IngestionService.update(ingestionSourceId, {
                    status: 'active',
                    lastSyncFinishedAt: new Date(),
                    lastSyncStatusMessage: 'Initial import complete. No users found.'
                });
            }
        } else {
            // For other providers, we might trigger a simpler bulk import directly
            await new IngestionService().performBulkImport(job.data);
            await flowProducer.add({
                name: 'sync-cycle-finished',
                queueName: 'ingestion',
                data: {
                    ingestionSourceId,
                    userCount: 1,
                    isInitialImport: true
                }
            });
        }

        logger.info({ ingestionSourceId }, 'Finished initial import master job');
    } catch (error) {
        logger.error({ err: error, ingestionSourceId }, 'Error in initial import master job');
        await IngestionService.update(ingestionSourceId, {
            status: 'error',
            lastSyncStatusMessage: `Initial import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        throw error;
    }
};
