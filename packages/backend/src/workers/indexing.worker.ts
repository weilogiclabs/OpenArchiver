import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import indexEmailProcessor from '../jobs/processors/index-email.processor';

const worker = new Worker('indexing', indexEmailProcessor, { connection });

console.log('Indexing worker started');

process.on('SIGINT', () => worker.close());
process.on('SIGTERM', () => worker.close());
