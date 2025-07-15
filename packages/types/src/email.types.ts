/**
 * Represents a single email address, including an optional name and the email address itself.
 */
export interface EmailAddress {
    name: string;
    address: string;
}

/**
 * Defines the structure for an email attachment, including its filename, content type, size, and the raw content as a buffer.
 */
export interface EmailAttachment {
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
}

/**
 * Describes the universal structure for a raw email object, designed to be compatible with various ingestion sources like IMAP and Google Workspace.
 * This type serves as a standardized representation of an email before it is processed and stored in the database.
 */
export interface EmailObject {
    /** A unique identifier for the email, typically assigned by the source provider. */
    id: string;
    /** An array of `EmailAddress` objects representing the sender(s). */
    from: EmailAddress[];
    /** An array of `EmailAddress` objects representing the primary recipient(s). */
    to: EmailAddress[];
    /** An optional array of `EmailAddress` objects for carbon copy (CC) recipients. */
    cc?: EmailAddress[];
    /** An optional array of `EmailAddress` objects for blind carbon copy (BCC) recipients. */
    bcc?: EmailAddress[];
    /** The subject line of the email. */
    subject: string;
    /** The plain text body of the email. */
    body: string;
    /** The HTML version of the email body, if available. */
    html: string;
    /** A record of all email headers, where keys are header names and values can be a string or an array of strings. */
    headers: Record<string, string | string[]>;
    /** An array of `EmailAttachment` objects found in the email. */
    attachments: EmailAttachment[];
    /** The date and time when the email was received. */
    receivedAt: Date;
    /** An optional buffer containing the full raw EML content of the email, which is useful for archival and compliance purposes. */
    eml?: Buffer;
    /** The email address of the user whose mailbox this email belongs to. */
    userEmail?: string;
    /** The full, raw content of the email, typically in base64url-encoded format for APIs like Gmail. */
    raw?: string;
}

// Define the structure of the document to be indexed in Meilisearch
export interface EmailDocument {
    id: string; // The unique ID of the email
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    attachments: {
        filename: string;
        content: string; // Extracted text from the attachment
    }[];
    timestamp: number;
    ingestionSourceId: string;
    // other metadata
}
