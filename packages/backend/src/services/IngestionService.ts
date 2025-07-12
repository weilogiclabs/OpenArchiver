import { db } from '../database';
import { ingestionSources } from '../database/schema';
import type {
    CreateIngestionSourceDto,
    UpdateIngestionSourceDto,
    IngestionSource,
    IngestionCredentials
} from '@open-archive/types';
import { eq } from 'drizzle-orm';
import { CryptoService } from './CryptoService';
import { EmailProviderFactory } from './EmailProviderFactory';
import { ingestionQueue, indexingQueue } from '../jobs/queues';
import { StorageService } from './StorageService';
import type { IInitialImportJob } from '@open-archive/types';


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

        await ingestionQueue.add('initial-import', { ingestionSourceId: source.id });

        return await this.update(id, { status: 'syncing' });
    }

    public async performBulkImport(job: IInitialImportJob): Promise<void> {
        const { ingestionSourceId } = job;
        const source = await IngestionService.findById(ingestionSourceId);

        if (!source) {
            throw new Error(`Ingestion source ${ingestionSourceId} not found.`);
        }

        console.log(`Starting bulk import for source: ${source.name} (${source.id})`);
        await IngestionService.update(ingestionSourceId, {
            status: 'syncing',
            lastSyncStartedAt: new Date()
        });

        const connector = EmailProviderFactory.createConnector(source);
        const storage = new StorageService();

        try {
            for await (const email of connector.fetchEmails()) {
                const filePath = `${source.id}/${email.id}.eml`;
                await storage.put(filePath, Buffer.from(email.body, 'utf-8'));
                await indexingQueue.add('index-email', {
                    filePath,
                    ingestionSourceId: source.id
                });
            }

            await IngestionService.update(ingestionSourceId, {
                status: 'active',
                lastSyncFinishedAt: new Date(),
                lastSyncStatusMessage: 'Successfully completed bulk import.'
            });
            console.log(`Bulk import finished for source: ${source.name} (${source.id})`);
        } catch (error) {
            console.error(`Bulk import failed for source: ${source.name} (${source.id})`, error);
            await IngestionService.update(ingestionSourceId, {
                status: 'error',
                lastSyncFinishedAt: new Date(),
                lastSyncStatusMessage: error instanceof Error ? error.message : 'An unknown error occurred.'
            });
            throw error; // Re-throw to allow BullMQ to handle the job failure
        }
    }
}
