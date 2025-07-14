import { count, desc, eq } from 'drizzle-orm';
import { db } from '../database';
import { archivedEmails, attachments, emailAttachments } from '../database/schema';
import type { PaginatedArchivedEmails, ArchivedEmail, Recipient } from '@open-archiver/types';
import { StorageService } from './StorageService';
import type { Readable } from 'stream';

interface DbRecipients {
    to: { name: string; address: string; }[];
    cc: { name: string; address: string; }[];
    bcc: { name: string; address: string; }[];
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

export class ArchivedEmailService {
    private static mapRecipients(dbRecipients: unknown): Recipient[] {
        const { to = [], cc = [], bcc = [] } = dbRecipients as DbRecipients;

        const allRecipients = [...to, ...cc, ...bcc];

        return allRecipients.map((r) => ({
            name: r.name,
            email: r.address
        }));
    }

    public static async getArchivedEmails(
        ingestionSourceId: string,
        page: number,
        limit: number
    ): Promise<PaginatedArchivedEmails> {
        const offset = (page - 1) * limit;

        const [total] = await db
            .select({
                count: count(archivedEmails.id)
            })
            .from(archivedEmails)
            .where(eq(archivedEmails.ingestionSourceId, ingestionSourceId));

        const items = await db
            .select()
            .from(archivedEmails)
            .where(eq(archivedEmails.ingestionSourceId, ingestionSourceId))
            .orderBy(desc(archivedEmails.sentAt))
            .limit(limit)
            .offset(offset);

        return {
            items: items.map((item) => ({
                ...item,
                recipients: this.mapRecipients(item.recipients)
            })),
            total: total.count,
            page,
            limit
        };
    }

    public static async getArchivedEmailById(emailId: string): Promise<ArchivedEmail | null> {
        const [email] = await db
            .select()
            .from(archivedEmails)
            .where(eq(archivedEmails.id, emailId));

        if (!email) {
            return null;
        }

        const storage = new StorageService();
        const rawStream = await storage.get(email.storagePath);
        const raw = await streamToBuffer(rawStream as Readable);

        const mappedEmail = {
            ...email,
            recipients: this.mapRecipients(email.recipients),
            raw
        };

        if (email.hasAttachments) {
            const emailAttachmentsResult = await db
                .select({
                    id: attachments.id,
                    filename: attachments.filename,
                    mimeType: attachments.mimeType,
                    sizeBytes: attachments.sizeBytes,
                    storagePath: attachments.storagePath
                })
                .from(emailAttachments)
                .innerJoin(attachments, eq(emailAttachments.attachmentId, attachments.id))
                .where(eq(emailAttachments.emailId, emailId));

            // const attachmentsWithRaw = await Promise.all(
            //     emailAttachmentsResult.map(async (attachment) => {
            //         const rawStream = await storage.get(attachment.storagePath);
            //         const raw = await streamToBuffer(rawStream as Readable);
            //         return { ...attachment, raw };
            //     })
            // );

            return {
                ...mappedEmail,
                attachments: emailAttachmentsResult
            };
        }

        return mappedEmail;
    }
}
