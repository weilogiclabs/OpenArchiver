/**
 * Represents a single recipient of an email.
 */
export interface Recipient {
    name?: string;
    email: string;
}

/**
 * Represents a single attachment of an email.
 */
export interface Attachment {
    id: string;
    filename: string;
    mimeType: string | null;
    sizeBytes: number;
    storagePath: string;
}

/**
 * Represents a single archived email.
 */
export interface ArchivedEmail {
    id: string;
    ingestionSourceId: string;
    messageIdHeader: string | null;
    sentAt: Date;
    subject: string | null;
    senderName: string | null;
    senderEmail: string;
    recipients: Recipient[];
    storagePath: string;
    storageHashSha256: string;
    sizeBytes: number;
    isIndexed: boolean;
    hasAttachments: boolean;
    isOnLegalHold: boolean;
    archivedAt: Date;
    attachments?: Attachment[];
    raw?: Buffer;
}

/**
 * Represents a paginated list of archived emails.
 */
export interface PaginatedArchivedEmails {
    items: ArchivedEmail[];
    total: number;
    page: number;
    limit: number;
}
