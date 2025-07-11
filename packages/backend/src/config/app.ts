import 'dotenv/config';

export const app = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT_BACKEND ? parseInt(process.env.PORT_BACKEND, 10) : 4000,
    encryptionKey: process.env.ENCRYPTION_KEY,
};
