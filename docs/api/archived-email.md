# Archived Email Service API

The Archived Email Service is responsible for retrieving archived emails and their details from the database and storage.

## Endpoints

All endpoints in this service require authentication.

### GET /api/v1/archived-emails/ingestion-source/:ingestionSourceId

Retrieves a paginated list of archived emails for a specific ingestion source.

**Access:** Authenticated

#### URL Parameters

| Parameter           | Type   | Description                                       |
| :------------------ | :----- | :------------------------------------------------ |
| `ingestionSourceId` | string | The ID of the ingestion source to get emails for. |

#### Query Parameters

| Parameter | Type   | Description                     | Default |
| :-------- | :----- | :------------------------------ | :------ |
| `page`    | number | The page number for pagination. | 1       |
| `limit`   | number | The number of items per page.   | 10      |

#### Responses

-   **200 OK:** A paginated list of archived emails.

    ```json
    {
        "items": [
            {
                "id": "email-id",
                "subject": "Test Email",
                "from": "sender@example.com",
                "sentAt": "2023-10-27T10:00:00.000Z",
                "hasAttachments": true,
                "recipients": [
                    { "name": "Recipient 1", "email": "recipient1@example.com" }
                ]
            }
        ],
        "total": 100,
        "page": 1,
        "limit": 10
    }
    ```

-   **500 Internal Server Error:** An unexpected error occurred.

### GET /api/v1/archived-emails/:id

Retrieves a single archived email by its ID, including its raw content and attachments.

**Access:** Authenticated

#### URL Parameters

| Parameter | Type   | Description                   |
| :-------- | :----- | :---------------------------- |
| `id`      | string | The ID of the archived email. |

#### Responses

-   **200 OK:** The archived email details.

    ```json
    {
        "id": "email-id",
        "subject": "Test Email",
        "from": "sender@example.com",
        "sentAt": "2023-10-27T10:00:00.000Z",
        "hasAttachments": true,
        "recipients": [
            { "name": "Recipient 1", "email": "recipient1@example.com" }
        ],
        "raw": "...",
        "attachments": [
            {
                "id": "attachment-id",
                "filename": "document.pdf",
                "mimeType": "application/pdf",
                "sizeBytes": 12345
            }
        ]
    }
    ```

-   **404 Not Found:** The archived email with the specified ID was not found.
-   **500 Internal Server Error:** An unexpected error occurred.

## Service Methods

### `getArchivedEmails(ingestionSourceId: string, page: number, limit: number): Promise<PaginatedArchivedEmails>`

Retrieves a paginated list of archived emails from the database for a given ingestion source.

-   **ingestionSourceId:** The ID of the ingestion source.
-   **page:** The page number for pagination.
-   **limit:** The number of items per page.
-   **Returns:** A promise that resolves to a `PaginatedArchivedEmails` object.

### `getArchivedEmailById(emailId: string): Promise<ArchivedEmail | null>`

Retrieves a single archived email by its ID, including its raw content and attachments.

-   **emailId:** The ID of the archived email.
-   **Returns:** A promise that resolves to an `ArchivedEmail` object or `null` if not found.
