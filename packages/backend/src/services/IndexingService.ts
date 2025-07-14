import { Attachment, EmailDocument } from '@open-archiver/types';
import { SearchService } from './SearchService';
import { StorageService } from './StorageService';
import { extractText } from '../helpers/textExtractor';
import DatabaseService from './DatabaseService';
import { archivedEmails, attachments, emailAttachments } from '../database/schema';
import { eq } from 'drizzle-orm';
import { streamToBuffer } from '../helpers/streamToBuffer';
import { simpleParser } from 'mailparser';

interface DbRecipients {
    to: { name: string; address: string; }[];
    cc: { name: string; address: string; }[];
    bcc: { name: string; address: string; }[];
}

export class IndexingService {
    private dbService: typeof DatabaseService;
    private searchService: SearchService;
    private storageService: StorageService;

    constructor(
        dbService: typeof DatabaseService,
        searchService: SearchService,
        storageService: StorageService,
    ) {
        this.dbService = dbService;
        this.searchService = searchService;
        this.storageService = storageService;
    }

    public async indexEmailById(emailId: string): Promise<void> {
        const email = await this.dbService.db.query.archivedEmails.findFirst({
            where: eq(archivedEmails.id, emailId),
        });

        if (!email) {
            throw new Error(`Email with ID ${emailId} not found for indexing.`);
        }

        let emailAttachmentsResult: Attachment[] = [];
        if (email.hasAttachments) {
            emailAttachmentsResult = await this.dbService.db
                .select({
                    id: attachments.id,
                    filename: attachments.filename,
                    mimeType: attachments.mimeType,
                    sizeBytes: attachments.sizeBytes,
                    contentHashSha256: attachments.contentHashSha256,
                    storagePath: attachments.storagePath,
                })
                .from(emailAttachments)
                .innerJoin(attachments, eq(emailAttachments.attachmentId, attachments.id))
                .where(eq(emailAttachments.emailId, emailId));
        }

        const document = await this.createEmailDocument(email, emailAttachmentsResult);
        await this.searchService.addDocuments('emails', [document], 'id');
    }

    private async createEmailDocument(
        email: typeof archivedEmails.$inferSelect,
        attachments: Attachment[]
    ): Promise<EmailDocument> {
        const attachmentContents = await this.extractAttachmentContents(attachments);

        const emailBodyStream = await this.storageService.get(email.storagePath);
        const emailBodyBuffer = await streamToBuffer(emailBodyStream);
        const parsedEmail = await simpleParser(emailBodyBuffer);
        const emailBodyText =
            parsedEmail.text ||
            parsedEmail.html ||
            (await extractText(emailBodyBuffer, 'text/plain')) ||
            '';

        const recipients = email.recipients as DbRecipients;

        return {
            id: email.id,
            from: email.senderEmail,
            to: recipients.to?.map((r) => r.address) || [],
            cc: recipients.cc?.map((r) => r.address) || [],
            bcc: recipients.bcc?.map((r) => r.address) || [],
            subject: email.subject || '',
            body: emailBodyText,
            attachments: attachmentContents,
            timestamp: new Date(email.sentAt).getTime(),
            ingestionSourceId: email.ingestionSourceId
        };
    }

    private async extractAttachmentContents(
        attachments: Attachment[]
    ): Promise<{ filename: string; content: string; }[]> {
        const extractedAttachments = [];
        for (const attachment of attachments) {
            try {
                const fileStream = await this.storageService.get(
                    attachment.storagePath
                );
                const fileBuffer = await streamToBuffer(fileStream);
                const textContent = await extractText(
                    fileBuffer,
                    attachment.mimeType || ''
                );
                extractedAttachments.push({
                    filename: attachment.filename,
                    content: textContent,
                });
            } catch (error) {
                console.error(
                    `Failed to extract text from attachment: ${attachment.filename}`,
                    error
                );
                // Decide on error handling: skip attachment or fail the job
            }
        }
        return extractedAttachments;
    }

}
