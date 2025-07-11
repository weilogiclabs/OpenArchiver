import { db } from '../database';
import { ingestionSources } from '../database/schema';
import type {
    CreateIngestionSourceDto,
    UpdateIngestionSourceDto,
    IngestionSource,
    IngestionCredentials
} from '@open-archive/types';
import { eq } from 'drizzle-orm';
import { Queue } from 'bullmq';
import { CryptoService } from './CryptoService';
import { EmailProviderFactory } from './EmailProviderFactory';

// This assumes you have a BullMQ queue instance exported from somewhere
// In a real setup, this would be injected or imported from a central place.
let initialImportQueue: Queue;

// TODO: Initialize and connect to the actual BullMQ queue.
// For now, we'll use a mock for demonstration purposes.
if (process.env.NODE_ENV !== 'production') {
    initialImportQueue = {
        add: async (name: string, data: any) => {
            console.log(`Mock Queue: Job '${name}' added with data:`, data);
            return Promise.resolve({} as any);
        }
    } as Queue;
}

export class IngestionService {
    private static decryptSource(source: typeof ingestionSources.$inferSelect): IngestionSource {
        const decryptedCredentials = CryptoService.decryptObject<IngestionCredentials>(
            source.credentials as string
        );
        return { ...source, credentials: decryptedCredentials };
    }

    public static async create(dto: CreateIngestionSourceDto): Promise<IngestionSource> {
        const { providerConfig, ...rest } = dto;

        const encryptedCredentials = CryptoService.encryptObject(providerConfig);

        const valuesToInsert = {
            ...rest,
            status: 'pending_auth' as const,
            credentials: encryptedCredentials
        };

        const [newSource] = await db.insert(ingestionSources).values(valuesToInsert).returning();

        const decryptedSource = this.decryptSource(newSource);

        // Test the connection
        const connector = EmailProviderFactory.createConnector(decryptedSource);
        const isConnected = await connector.testConnection();

        if (isConnected) {
            return await this.update(decryptedSource.id, { status: 'auth_success' });
        }

        return decryptedSource;
    }

    public static async findAll(): Promise<IngestionSource[]> {
        const sources = await db.select().from(ingestionSources);
        return sources.map(this.decryptSource);
    }

    public static async findById(id: string): Promise<IngestionSource> {
        const [source] = await db.select().from(ingestionSources).where(eq(ingestionSources.id, id));
        if (!source) {
            throw new Error('Ingestion source not found');
        }
        return this.decryptSource(source);
    }

    public static async update(
        id: string,
        dto: UpdateIngestionSourceDto
    ): Promise<IngestionSource> {
        const { providerConfig, ...rest } = dto;
        const valuesToUpdate: Partial<typeof ingestionSources.$inferInsert> = { ...rest };

        if (providerConfig) {
            // Encrypt the new credentials before updating
            valuesToUpdate.credentials = CryptoService.encryptObject(providerConfig);
        }

        const [updatedSource] = await db
            .update(ingestionSources)
            .set(valuesToUpdate)
            .where(eq(ingestionSources.id, id))
            .returning();

        if (!updatedSource) {
            throw new Error('Ingestion source not found');
        }
        return this.decryptSource(updatedSource);
    }

    public static async delete(id: string): Promise<IngestionSource> {
        const [deletedSource] = await db
            .delete(ingestionSources)
            .where(eq(ingestionSources.id, id))
            .returning();
        if (!deletedSource) {
            throw new Error('Ingestion source not found');
        }
        return this.decryptSource(deletedSource);
    }

    public static async triggerInitialImport(id: string): Promise<IngestionSource> {
        const source = await this.findById(id);

        await initialImportQueue.add('initial-import', { ingestionSourceId: source.id });

        return await this.update(id, { status: 'syncing' });
    }
}
