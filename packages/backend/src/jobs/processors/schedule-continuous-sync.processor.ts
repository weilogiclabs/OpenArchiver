import { Job } from 'bullmq';
import { db } from '../../database';
import { ingestionSources } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { ingestionQueue } from '../queues';

export default async (job: Job) => {
    console.log(
        'Scheduler running: Looking for active ingestion sources to sync.'
    );
    const activeSources = await db
        .select({ id: ingestionSources.id })
        .from(ingestionSources)
        .where(eq(ingestionSources.status, 'active'));

    for (const source of activeSources) {
        // The status field on the ingestion source is used to prevent duplicate syncs.
        await ingestionQueue.add('continuous-sync', { ingestionSourceId: source.id });
    }
};
