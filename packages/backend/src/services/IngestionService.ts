import { db } from '../database';
import { ingestionSources } from '../database/schema';
import type { CreateIngestionSourceDto, UpdateIngestionSourceDto } from '@open-archive/types';
import { eq } from 'drizzle-orm';
import { Queue } from 'bullmq';

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
    public static async create(dto: CreateIngestionSourceDto) {
        // The DTO from the frontend uses `providerConfig` for simplicity.
        // We map it to the `credentials` column in the database schema.
        const { providerConfig, ...rest } = dto;
        const valuesToInsert = {
            ...rest,
            credentials: providerConfig
        };
        const [newSource] = await db.insert(ingestionSources).values(valuesToInsert).returning();
        return newSource;
    }

    public static async findAll() {
        return await db.select().from(ingestionSources);
    }

    public static async findById(id: string) {
        const [source] = await db.select().from(ingestionSources).where(eq(ingestionSources.id, id));
        if (!source) {
            throw new Error('Ingestion source not found');
        }
        return source;
    }

    public static async update(id: string, dto: UpdateIngestionSourceDto) {
        // The DTO from the frontend uses `providerConfig` for simplicity.
        // We map it to the `credentials` column in the database schema if it exists.
        const { providerConfig, ...rest } = dto;
        const valuesToUpdate: Partial<typeof ingestionSources.$inferInsert> = { ...rest };
        if (providerConfig) {
            valuesToUpdate.credentials = providerConfig;
        }

        const [updatedSource] = await db
            .update(ingestionSources)
            .set(valuesToUpdate)
            .where(eq(ingestionSources.id, id))
            .returning();
        if (!updatedSource) {
            throw new Error('Ingestion source not found');
        }
        return updatedSource;
    }

    public static async delete(id: string) {
        const [deletedSource] = await db
            .delete(ingestionSources)
            .where(eq(ingestionSources.id, id))
            .returning();
        if (!deletedSource) {
            throw new Error('Ingestion source not found');
        }
        return deletedSource;
    }

    public static async triggerInitialImport(id: string) {
        const source = await this.findById(id);

        await initialImportQueue.add('initial-import', { ingestionSourceId: source.id });

        return await this.update(id, { status: 'syncing' });
    }
}
