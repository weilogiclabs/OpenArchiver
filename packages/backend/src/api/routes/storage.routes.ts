import { Router } from 'express';
import { StorageController } from '../controllers/storage.controller';
import { requireAuth } from '../middleware/requireAuth';
import { IAuthService } from '../../services/AuthService';

export const createStorageRouter = (
    storageController: StorageController,
    authService: IAuthService
): Router => {
    const router = Router();

    // Secure all routes in this module
    router.use(requireAuth(authService));

    router.get('/download', storageController.downloadFile);

    return router;
};
