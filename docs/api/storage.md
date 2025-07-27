# Storage Service API

The Storage Service provides an endpoint for downloading files from the configured storage provider.

## Endpoints

All endpoints in this service require authentication.

### GET /api/v1/storage/download

Downloads a file from the storage.

**Access:** Authenticated

#### Query Parameters

| Parameter | Type   | Description                                       |
| :-------- | :----- | :------------------------------------------------ |
| `path`    | string | The path to the file within the storage provider. |

#### Responses

-   **200 OK:** The file stream.
-   **400 Bad Request:** File path is required or invalid.
-   **404 Not Found:** File not found.
-   **500 Internal Server Error:** An unexpected error occurred.
