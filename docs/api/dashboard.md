# Dashboard Service API

The Dashboard Service provides endpoints for retrieving statistics and data for the main dashboard.

## Endpoints

All endpoints in this service require authentication.

### GET /api/v1/dashboard/stats

Retrieves overall statistics, including the total number of archived emails, total storage used, and the number of failed ingestions in the last 7 days.

**Access:** Authenticated

#### Responses

-   **200 OK:** An object containing the dashboard statistics.

    ```json
    {
        "totalEmailsArchived": 12345,
        "totalStorageUsed": 54321098,
        "failedIngestionsLast7Days": 3
    }
    ```

### GET /api/v1/dashboard/ingestion-history

Retrieves the email ingestion history for the last 30 days, grouped by day.

**Access:** Authenticated

#### Responses

-   **200 OK:** An object containing the ingestion history.

    ```json
    {
        "history": [
            {
                "date": "2023-09-27T00:00:00.000Z",
                "count": 150
            },
            {
                "date": "2023-09-28T00:00:00.000Z",
                "count": 200
            }
        ]
    }
    ```

### GET /api/v1/dashboard/ingestion-sources

Retrieves a list of all ingestion sources along with their status and storage usage.

**Access:** Authenticated

#### Responses

-   **200 OK:** An array of ingestion source objects.

    ```json
    [
        {
            "id": "source-id-1",
            "name": "Google Workspace",
            "provider": "google",
            "status": "active",
            "storageUsed": 12345678
        },
        {
            "id": "source-id-2",
            "name": "Microsoft 365",
            "provider": "microsoft",
            "status": "error",
            "storageUsed": 87654321
        }
    ]
    ```

### GET /api/v1/dashboard/recent-syncs

Retrieves a list of recent synchronization jobs. (Note: This is currently a placeholder and will return an empty array).

**Access:** Authenticated

#### Responses

-   **200 OK:** An empty array.

    ```json
    []
    ```

### GET /api/v1/dashboard/indexed-insights

Retrieves insights from the indexed email data, such as the top senders.

**Access:** Authenticated

#### Responses

-   **200 OK:** An object containing indexed insights.

    ```json
    {
        "topSenders": [
            {
                "sender": "user@example.com",
                "count": 42
            }
        ]
    }
    ```
