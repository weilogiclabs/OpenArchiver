import { Job } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { IContinuousSyncJob } from '@open-archiver/types';
import { EmailProviderFactory } from '../../services/EmailProviderFactory';
import { flowProducer } from '../queues';
import { logger } from '../../config/logger';
import { ImapConnector } from '../../services/ingestion-connectors/ImapConnector';

export default async (job: Job<IContinuousSyncJob>) => {
    const { ingestionSourceId } = job.data;
    logger.info({ ingestionSourceId }, 'Starting continuous sync job.');

    const source = await IngestionService.findById(ingestionSourceId);
    if (!source || source.status !== 'active') {
        logger.warn({ ingestionSourceId, status: source?.status }, 'Skipping continuous sync for non-active source.');
        return;
    }

    await IngestionService.update(ingestionSourceId, {
        status: 'syncing',
        lastSyncStartedAt: new Date(),
    });

    const connector = EmailProviderFactory.createConnector(source);

    try {
        const jobs = [];
        if (!connector.listAllUsers) {
            // This is for single-mailbox providers like Generic IMAP
            let userEmail = 'Default';
            if (connector instanceof ImapConnector) {
                userEmail = connector.returnImapUserEmail();
            }
            jobs.push({
                name: 'process-mailbox',
                queueName: 'ingestion',
                data: {
                    ingestionSourceId: source.id,
                    userEmail: userEmail
                }
            });
        } else {
            // For multi-mailbox providers like Google Workspace and M365
            for await (const user of connector.listAllUsers()) {
                if (user.primaryEmail) {
                    jobs.push({
                        name: 'process-mailbox',
                        queueName: 'ingestion',
                        data: {
                            ingestionSourceId: source.id,
                            userEmail: user.primaryEmail
                        }
                    });
                }
            }
        }

        if (jobs.length > 0) {
            await flowProducer.add({
                name: 'sync-cycle-finished',
                queueName: 'ingestion',
                data: {
                    ingestionSourceId,
                    isInitialImport: false
                },
                children: jobs
            });
        }

        // The status will be set back to 'active' by the 'sync-cycle-finished' job
        // once all the mailboxes have been processed.
        logger.info({ ingestionSourceId }, 'Continuous sync job finished dispatching mailbox jobs.');

    } catch (error) {
        logger.error({ err: error, ingestionSourceId }, 'Continuous sync job failed.');
        await IngestionService.update(ingestionSourceId, {
            status: 'error',
            lastSyncFinishedAt: new Date(),
            lastSyncStatusMessage: error instanceof Error ? error.message : 'An unknown error occurred during sync.',
        });
        throw error;
    }
};
