import { Router } from 'express';
import { loginRateLimiter } from '../middleware/rateLimiter';
import type { AuthController } from '../controllers/auth.controller';

export const createAuthRouter = (authController: AuthController): Router => {
    const router = Router();

    /**
     * @route POST /api/v1/auth/login
     * @description Authenticates a user and returns a JWT.
     * @access Public
     */
    router.post('/login', loginRateLimiter, authController.login);

    return router;
};
