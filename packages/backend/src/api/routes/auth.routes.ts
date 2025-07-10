import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';

export const createAuthRouter = (authController: AuthController): Router => {
    const router = Router();

    /**
     * @route POST /api/v1/auth/login
     * @description Authenticates a user and returns a JWT.
     * @access Public
     */
    router.post('/login', authController.login);

    return router;
};
