# Search Service API

The Search Service provides an endpoint for searching indexed emails.

## Endpoints

All endpoints in this service require authentication.

### GET /api/v1/search

Performs a search query against the indexed emails.

**Access:** Authenticated

#### Query Parameters

| Parameter          | Type   | Description                                                            | Default |
| :----------------- | :----- | :--------------------------------------------------------------------- | :------ |
| `keywords`         | string | The search query.                                                      |         |
| `page`             | number | The page number for pagination.                                        | 1       |
| `limit`            | number | The number of items per page.                                          | 10      |
| `matchingStrategy` | string | The matching strategy to use (`all` or `last`).                        | `last`  |
| `filters`          | object | Key-value pairs for filtering results (e.g., `from=user@example.com`). |         |

#### Responses

-   **200 OK:** A search result object.

    ```json
    {
        "hits": [
            {
                "id": "email-id",
                "subject": "Test Email",
                "from": "sender@example.com",
                "_formatted": {
                    "subject": "<em>Test</em> Email"
                }
            }
        ],
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "processingTimeMs": 5
    }
    ```

-   **400 Bad Request:** Keywords are required.
-   **500 Internal Server Error:** An unexpected error occurred.
