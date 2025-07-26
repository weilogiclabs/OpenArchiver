import { Job, FlowJob } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { logger } from '../../config/logger';
import { SyncState } from '@open-archiver/types';
import { db } from '../../database';
import { ingestionSources } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { deepmerge } from 'deepmerge-ts';

interface ISyncCycleFinishedJob {
    ingestionSourceId: string;
    userCount?: number; // Optional, as it's only relevant for the initial import
    isInitialImport: boolean;
}

export default async (job: Job<ISyncCycleFinishedJob, any, string>) => {
    const { ingestionSourceId, userCount, isInitialImport } = job.data;
    logger.info({ ingestionSourceId, userCount, isInitialImport }, 'Sync cycle finished job started');

    try {
        const childrenJobs = await job.getChildrenValues<SyncState>();
        const allSyncStates = Object.values(childrenJobs);

        // Merge all sync states from children jobs into one
        const finalSyncState = deepmerge(...allSyncStates.filter(s => s && Object.keys(s).length > 0));

        let message = 'Continuous sync cycle finished successfully.';
        if (isInitialImport) {
            message = `Initial import finished for ${userCount} mailboxes.`;
        }

        // Update the database with the final aggregated sync state
        await db
            .update(ingestionSources)
            .set({
                status: 'active',
                lastSyncFinishedAt: new Date(),
                lastSyncStatusMessage: message,
                syncState: finalSyncState
            })
            .where(eq(ingestionSources.id, ingestionSourceId));

        logger.info({ ingestionSourceId }, 'Successfully updated status and final sync state.');
    } catch (error) {
        logger.error({ err: error, ingestionSourceId }, 'Failed to process finished sync cycle.');
        // If this fails, we should probably set the status to 'error' to indicate a problem.
        await IngestionService.update(ingestionSourceId, {
            status: 'error',
            lastSyncFinishedAt: new Date(),
            lastSyncStatusMessage: 'Failed to finalize sync cycle and update sync state.'
        });
    }
};
