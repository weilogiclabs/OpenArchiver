import { Router } from 'express';
import { IngestionController } from '../controllers/ingestion.controller';
import { requireAuth } from '../middleware/requireAuth';
import { IAuthService } from '../../services/AuthService';

export const createIngestionRouter = (
    ingestionController: IngestionController,
    authService: IAuthService
): Router => {
    const router = Router();

    // Secure all routes in this module
    router.use(requireAuth(authService));

    router.post('/', ingestionController.create);

    router.get('/', ingestionController.findAll);

    router.get('/:id', ingestionController.findById);

    router.put('/:id', ingestionController.update);

    router.delete('/:id', ingestionController.delete);

    router.post('/:id/sync', ingestionController.triggerInitialImport);

    return router;
};
