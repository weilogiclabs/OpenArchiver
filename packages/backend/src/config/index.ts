import { storage } from './storage';
import { app } from './app';
import { searchConfig } from './search';
import { connection as redisConfig } from './redis';

export const config = {
    storage,
    app,
    search: searchConfig,
    redis: redisConfig,
};
