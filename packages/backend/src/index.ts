import express from 'express';
import dotenv from 'dotenv';
import { AuthController } from './api/controllers/auth.controller';
import { IngestionController } from './api/controllers/ingestion.controller';
import { ArchivedEmailController } from './api/controllers/archived-email.controller';
import { StorageController } from './api/controllers/storage.controller';
import { requireAuth } from './api/middleware/requireAuth';
import { createAuthRouter } from './api/routes/auth.routes';
import { createIngestionRouter } from './api/routes/ingestion.routes';
import { createArchivedEmailRouter } from './api/routes/archived-email.routes';
import { createStorageRouter } from './api/routes/storage.routes';
import testRouter from './api/routes/test.routes';
import { AuthService } from './services/AuthService';
import { AdminUserService } from './services/UserService';
import { StorageService } from './services/StorageService';



// Load environment variables
dotenv.config();

// --- Environment Variable Validation ---
const {
    PORT_BACKEND,
    JWT_SECRET,
    JWT_EXPIRES_IN
} = process.env;


if (!PORT_BACKEND || !JWT_SECRET || !JWT_EXPIRES_IN) {
    throw new Error('Missing required environment variables for the backend.');
}

// --- Dependency Injection Setup ---

const userService = new AdminUserService();
const authService = new AuthService(userService, JWT_SECRET, JWT_EXPIRES_IN);
const authController = new AuthController(authService);
const ingestionController = new IngestionController();
const archivedEmailController = new ArchivedEmailController();
const storageService = new StorageService();
const storageController = new StorageController(storageService);

// --- Express App Initialization ---
const app = express();

// Middleware
app.use(express.json()); // For parsing application/json

// --- Routes ---
const authRouter = createAuthRouter(authController);
const ingestionRouter = createIngestionRouter(ingestionController, authService);
const archivedEmailRouter = createArchivedEmailRouter(archivedEmailController, authService);
const storageRouter = createStorageRouter(storageController, authService);
app.use('/v1/auth', authRouter);
app.use('/v1/ingestion-sources', ingestionRouter);
app.use('/v1/archived-emails', archivedEmailRouter);
app.use('/v1/storage', storageRouter);
app.use('/v1/test', testRouter);

// Example of a protected route
app.get('/v1/protected', requireAuth(authService), (req, res) => {
    res.json({
        message: 'You have accessed a protected route!',
        user: req.user // The user payload is attached by the requireAuth middleware
    });
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// --- Server Start ---
const startServer = async () => {
    try {
        app.listen(PORT_BACKEND, () => {
            console.log(`Backend listening at http://localhost:${PORT_BACKEND}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);
    }
};

startServer();
