import 'dotenv/config';

/**
 * @see https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/connections.md
 */
export const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: (process.env.REDIS_PORT && parseInt(process.env.REDIS_PORT, 10)) || 6379,
    maxRetriesPerRequest: null
};
