import { Router } from 'express';
import { ingestionQueue } from '../../jobs/queues';

const router: Router = Router();

router.post('/trigger-job', async (req, res) => {
    try {
        const job = await ingestionQueue.add('initial-import', {
            ingestionSourceId: 'test-source-id-test-2345'
        });
        res.status(202).json({ message: 'Test job triggered successfully', jobId: job.id });
    } catch (error) {
        console.error('Failed to trigger test job', error);
        res.status(500).json({ message: 'Failed to trigger test job' });
    }
});

export default router;
