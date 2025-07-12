import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import initialImportProcessor from '../jobs/processors/initial-import.processor';
import continuousSyncProcessor from '../jobs/processors/continuous-sync.processor';

const processor = async (job: any) => {
    switch (job.name) {
        case 'initial-import':
            return initialImportProcessor(job);
        case 'continuous-sync':
            return continuousSyncProcessor(job);
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
};

const worker = new Worker('ingestion', processor, { connection });

console.log('Ingestion worker started');

process.on('SIGINT', () => worker.close());
process.on('SIGTERM', () => worker.close());
