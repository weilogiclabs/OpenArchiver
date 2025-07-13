import { Job } from 'bullmq';
import { IngestionService } from '../../services/IngestionService';
import { IInitialImportJob } from '@open-archive/types';

const ingestionService = new IngestionService();

export default async (job: Job<IInitialImportJob>) => {
    try {
        console.log(`Processing initial import for ingestion source: ${job.data.ingestionSourceId}`);
        await ingestionService.performBulkImport(job.data);
    } catch (error) {
        console.error(error);
    }
};
