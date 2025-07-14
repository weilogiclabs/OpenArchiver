import { Job } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { IInitialImportJob } from '@open-archiver/types';

const ingestionService = new IngestionService();

export default async (job: Job<IInitialImportJob>) => {
    console.log(`Processing continuous sync for ingestion source: ${job.data.ingestionSourceId}`);
    // This would be similar to performBulkImport, but would likely use the `since` parameter.
    // For now, we'll just log a message.
};
