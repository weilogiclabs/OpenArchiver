import { Job } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';

interface ISyncCycleFinishedJob {
    ingestionSourceId: string;
    userCount?: number; // Optional, as it's only relevant for the initial import
    isInitialImport: boolean;
}

export default async (job: Job<ISyncCycleFinishedJob>) => {
    const { ingestionSourceId, userCount, isInitialImport } = job.data;
    logger.info({ ingestionSourceId }, 'Sync cycle finished, updating status to active.');

    try {
        let message = 'Continuous sync cycle finished successfully.';
        if (isInitialImport) {
            message = `Initial import finished for ${userCount} mailboxes.`;
        }

        await IngestionService.update(ingestionSourceId, {
            status: 'active',
            lastSyncFinishedAt: new Date(),
            lastSyncStatusMessage: message
        });
        logger.info({ ingestionSourceId }, 'Successfully updated status to active.');
    } catch (error) {
        logger.error({ err: error, ingestionSourceId }, 'Failed to update status to active after sync cycle.');
        // Even if this fails, we don't want to fail the job itself,
        // as the import is technically complete. An admin might need to intervene.
    }
};
