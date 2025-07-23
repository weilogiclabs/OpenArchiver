import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middleware/requireAuth';
import { IAuthService } from '../../services/AuthService';

export const createDashboardRouter = (authService: IAuthService): Router => {
    const router = Router();

    router.use(requireAuth(authService));

    router.get('/stats', dashboardController.getStats);
    router.get('/ingestion-history', dashboardController.getIngestionHistory);
    router.get('/ingestion-sources', dashboardController.getIngestionSources);
    router.get('/recent-syncs', dashboardController.getRecentSyncs);

    return router;
};
