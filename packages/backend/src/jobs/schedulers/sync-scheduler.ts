import { ingestionQueue } from '../queues';

const scheduleContinuousSync = async () => {
    // This job will run every 15 minutes
    await ingestionQueue.add(
        'schedule-continuous-sync',
        {},
        {
            repeat: {
                pattern: '* * * * *', // Every 15 minutes
            },
        }
    );
};

scheduleContinuousSync().then(() => {
    console.log('Continuous sync scheduler started.');
});
