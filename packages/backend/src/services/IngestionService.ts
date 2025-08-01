import { db } from '../database';
import { ingestionSources } from '../database/schema';
import type {
    CreateIngestionSourceDto,
    UpdateIngestionSourceDto,
    IngestionSource,
    IngestionCredentials
} from '@open-archiver/types';
import { and, eq } from 'drizzle-orm';
import { CryptoService } from './CryptoService';
import { EmailProviderFactory } from './EmailProviderFactory';
import { ingestionQueue } from '../jobs/queues';
import { StorageService } from './StorageService';
import type { IInitialImportJob, EmailObject } from '@open-archiver/types';
import { archivedEmails, attachments as attachmentsSchema, emailAttachments } from '../database/schema';
import { createHash } from 'crypto';
import { logger } from '../config/logger';
import { IndexingService } from './IndexingService';
import { SearchService } from './SearchService';
import { DatabaseService } from './DatabaseService';


export class IngestionService {
    private static decryptSource(source: typeof ingestionSources.$inferSelect): IngestionSource {
        const decryptedCredentials = CryptoService.decryptObject<IngestionCredentials>(
            source.credentials as string
        );
        return { ...source, credentials: decryptedCredentials } as IngestionSource;
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

        // Get the original source to compare the status later
        const originalSource = await this.findById(id);

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

        const decryptedSource = this.decryptSource(updatedSource);

        // If the status has changed to auth_success, trigger the initial import
        if (
            originalSource.status !== 'auth_success' &&
            decryptedSource.status === 'auth_success'
        ) {
            await this.triggerInitialImport(decryptedSource.id);
        }

        return decryptedSource;
    }

    public static async delete(id: string): Promise<IngestionSource> {
        const source = await this.findById(id);
        if (!source) {
            throw new Error('Ingestion source not found');
        }

        // Delete all emails and attachments from storage
        const storage = new StorageService();
        const emailPath = `open-archiver/${source.name.replaceAll(' ', '-')}-${source.id}/`;
        await storage.delete(emailPath);


        // Delete all emails from the database
        // NOTE: This is done by database CASADE, change when CASADE relation no longer exists.
        // await db.delete(archivedEmails).where(eq(archivedEmails.ingestionSourceId, id));

        // Delete all documents from Meilisearch
        const searchService = new SearchService();
        await searchService.deleteDocumentsByFilter('emails', `ingestionSourceId = ${id}`);

        const [deletedSource] = await db
            .delete(ingestionSources)
            .where(eq(ingestionSources.id, id))
            .returning();

        return this.decryptSource(deletedSource);
    }

    public static async triggerInitialImport(id: string): Promise<void> {
        const source = await this.findById(id);

        await ingestionQueue.add('initial-import', { ingestionSourceId: source.id });

    }

    public static async triggerForceSync(id: string): Promise<void> {
        const source = await this.findById(id);

        if (!source) {
            throw new Error('Ingestion source not found');
        }

        await ingestionQueue.add('continuous-sync', { ingestionSourceId: source.id });
    }

    public async performBulkImport(job: IInitialImportJob): Promise<void> {
        console.log('performing bulk import');
        const { ingestionSourceId } = job;
        const source = await IngestionService.findById(ingestionSourceId);
        if (!source) {
            throw new Error(`Ingestion source ${ingestionSourceId} not found.`);
        }

        console.log(`Starting bulk import for source: ${source.name} (${source.id})`);
        await IngestionService.update(ingestionSourceId, {
            status: 'importing',
            lastSyncStartedAt: new Date()
        });

        const connector = EmailProviderFactory.createConnector(source);

        try {
            if (connector.listAllUsers) {
                // For multi-mailbox providers, dispatch a job for each user
                for await (const user of connector.listAllUsers()) {
                    const userEmail = user.primaryEmail;
                    if (userEmail) {
                        await ingestionQueue.add('process-mailbox', {
                            ingestionSourceId: source.id,
                            userEmail: userEmail,
                        });
                    }
                }
            } else {
                // For single-mailbox providers, dispatch a single job
                // console.log('source.credentials ', source.credentials);
                await ingestionQueue.add('process-mailbox', {
                    ingestionSourceId: source.id,
                    userEmail: source.credentials.type === 'generic_imap' ? source.credentials.username : 'Default'
                });
            }


            // await IngestionService.update(ingestionSourceId, {
            //     status: 'active',
            //     lastSyncFinishedAt: new Date(),
            //     lastSyncStatusMessage: 'Successfully initiated bulk import for all mailboxes.'
            // });
            // console.log(`Bulk import job dispatch finished for source: ${source.name} (${source.id})`);
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

    public async processEmail(
        email: EmailObject,
        source: IngestionSource,
        storage: StorageService,
        userEmail: string
    ): Promise<void> {
        try {
            // Generate a unique message ID for the email. If the email already has a message-id header, use that.
            // Otherwise, generate a new one based on the email's hash, source ID, and email ID.
            const messageIdHeader = email.headers.get('message-id');
            let messageId: string | undefined;
            if (Array.isArray(messageIdHeader)) {
                messageId = messageIdHeader[0];
            } else if (typeof messageIdHeader === 'string') {
                messageId = messageIdHeader;
            }
            if (!messageId) {
                messageId = `generated-${createHash('sha256').update(email.eml ?? Buffer.from(email.body, 'utf-8')).digest('hex')}-${source.id}-${email.id}`;
            }
            // Check if an email with the same message ID has already been imported for the current ingestion source. This is to prevent duplicate imports when an email is present in multiple mailboxes (e.g., "Inbox" and "All Mail").
            const existingEmail = await db.query.archivedEmails.findFirst({
                where: and(
                    eq(archivedEmails.messageIdHeader, messageId),
                    eq(archivedEmails.ingestionSourceId, source.id)
                )
            });

            if (existingEmail) {
                logger.info({ messageId, ingestionSourceId: source.id }, 'Skipping duplicate email');
                return;
            }

            console.log('processing email, ', email.id, email.subject);
            const emlBuffer = email.eml ?? Buffer.from(email.body, 'utf-8');
            const emailHash = createHash('sha256').update(emlBuffer).digest('hex');
            const emailPath = `open-archiver/${source.name.replaceAll(' ', '-')}-${source.id}/emails/${email.id}.eml`;
            await storage.put(emailPath, emlBuffer);

            const [archivedEmail] = await db
                .insert(archivedEmails)
                .values({
                    ingestionSourceId: source.id,
                    userEmail,
                    messageIdHeader: messageId,
                    sentAt: email.receivedAt,
                    subject: email.subject,
                    senderName: email.from[0]?.name,
                    senderEmail: email.from[0]?.address,
                    recipients: {
                        to: email.to,
                        cc: email.cc,
                        bcc: email.bcc
                    },
                    storagePath: emailPath,
                    storageHashSha256: emailHash,
                    sizeBytes: emlBuffer.length,
                    hasAttachments: email.attachments.length > 0
                })
                .returning();

            if (email.attachments.length > 0) {
                for (const attachment of email.attachments) {
                    const attachmentBuffer = attachment.content;
                    const attachmentHash = createHash('sha256').update(attachmentBuffer).digest('hex');
                    const attachmentPath = `open-archiver/${source.name.replaceAll(' ', '-')}-${source.id}/attachments/${attachment.filename}`;
                    await storage.put(attachmentPath, attachmentBuffer);

                    const [newAttachment] = await db
                        .insert(attachmentsSchema)
                        .values({
                            filename: attachment.filename,
                            mimeType: attachment.contentType,
                            sizeBytes: attachment.size,
                            contentHashSha256: attachmentHash,
                            storagePath: attachmentPath
                        })
                        .onConflictDoUpdate({
                            target: attachmentsSchema.contentHashSha256,
                            set: { filename: attachment.filename }
                        })
                        .returning();

                    await db
                        .insert(emailAttachments)
                        .values({
                            emailId: archivedEmail.id,
                            attachmentId: newAttachment.id
                        })
                        .onConflictDoNothing();
                }
            }
            // adding to indexing queue
            //Instead: index by email (raw email object, ingestion id)
            console.log('Indexing email: ', email.subject);
            // await indexingQueue.add('index-email', {
            //     emailId: archivedEmail.id,
            // });
            const searchService = new SearchService();
            const storageService = new StorageService();
            const databaseService = new DatabaseService();
            const indexingService = new IndexingService(databaseService, searchService, storageService);
            await indexingService.indexByEmail(email, source.id, archivedEmail.id);
        } catch (error) {
            logger.error({
                message: `Failed to process email ${email.id} for source ${source.id}`,
                error,
                emailId: email.id,
                ingestionSourceId: source.id
            });
        }
    }
}
