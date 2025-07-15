import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import initialImportProcessor from '../jobs/processors/initial-import.processor';
import continuousSyncProcessor from '../jobs/processors/continuous-sync.processor';
import { processMailboxProcessor } from '../jobs/processors/process-mailbox.processor';

const processor = async (job: any) => {
    switch (job.name) {
        case 'initial-import':
            return initialImportProcessor(job);
        case 'continuous-sync':
            return continuousSyncProcessor(job);
        case 'process-mailbox':
            return processMailboxProcessor(job);
        default:
            throw new Error(`Unknown job name: ${job.name}`);
    }
};

const worker = new Worker('ingestion', processor, {
    connection,
    removeOnComplete: {
        count: 100, // keep last 100 jobs
    },
    removeOnFail: {
        count: 500, // keep last 500 failed jobs
    },
});

console.log('Ingestion worker started');

process.on('SIGINT', () => worker.close());
process.on('SIGTERM', () => worker.close());
