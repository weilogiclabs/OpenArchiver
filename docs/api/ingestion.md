# Ingestion Sources API Documentation

A comprehensive guide to using the Ingestion Sources API.

**Base Path:** `/v1/ingestion-sources`

---

## Authentication

All endpoints in this API are protected and require authentication. Requests must include an `Authorization` header containing a valid Bearer token. This can be a JWT obtained from the login endpoint or a `SUPER_API_KEY` for administrative tasks.

**Header Example:**
`Authorization: Bearer <YOUR_JWT_OR_SUPER_API_KEY>`

---

## Core Concepts

### Ingestion Providers

The `provider` field determines the type of email source. Each provider requires a different configuration object, for example:

-   `google_workspace`: For connecting to Google Workspace accounts via OAuth 2.0.
-   `microsoft_365`: For connecting to Microsoft 365 accounts via OAuth 2.0.
-   `generic_imap`: For connecting to any email server that supports IMAP.

### Ingestion Status

The `status` field tracks the state of the ingestion source.

-   `pending_auth`: The source has been created but requires user authorization (OAuth flow).
-   `active`: The source is authenticated and ready to sync.
-   `syncing`: An import job is currently in progress.
-   `paused`: The source is temporarily disabled.
-   `error`: An error occurred during the last sync.

---

## 1. Create Ingestion Source

-   **Method:** `POST`
-   **Path:** `/`
-   **Description:** Registers a new source for email ingestion. The `providerConfig` will vary based on the selected `provider`.

#### Request Body (`CreateIngestionSourceDto`)

-   `name` (string, required): A user-friendly name for the source (e.g., "Marketing Department G-Suite").
-   `provider` (string, required): One of `google_workspace`, `microsoft_365`, or `generic_imap`.
-   `providerConfig` (object, required): Configuration specific to the provider.

##### `providerConfig` for `google_workspace` / `microsoft_365`

```json
{
    "name": "Corporate Google Workspace",
    "provider": "google_workspace",
    "providerConfig": {
        "clientId": "your-oauth-client-id.apps.googleusercontent.com",
        "clientSecret": "your-super-secret-client-secret",
        "redirectUri": "https://yourapp.com/oauth/google/callback"
    }
}
```

##### `providerConfig` for `generic_imap`

```json
{
    "name": "Legacy IMAP Server",
    "provider": "generic_imap",
    "providerConfig": {
        "host": "imap.example.com",
        "port": 993,
        "secure": true,
        "username": "archive-user",
        "password": "imap-password"
    }
}
```

#### Responses

-   **Success (`201 Created`):** Returns the full `IngestionSource` object, which now includes a system-generated `id` and default status.

    ```json
    {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "Corporate Google Workspace",
        "provider": "google_workspace",
        "status": "pending_auth",
        "createdAt": "2025-07-11T12:00:00.000Z",
        "updatedAt": "2025-07-11T12:00:00.000Z",
        "providerConfig": { ... }
    }
    ```

-   **Error (`500 Internal Server Error`):** Indicates a server-side problem during creation.

---

## 2. Get All Ingestion Sources

-   **Method:** `GET`
-   **Path:** `/`
-   **Description:** Retrieves a list of all configured ingestion sources for the organization.

#### Responses

-   **Success (`200 OK`):** Returns an array of `IngestionSource` objects.

-   **Error (`500 Internal Server Error`):** Indicates a server-side problem.

---

## 3. Get Ingestion Source by ID

-   **Method:** `GET`
-   **Path:** `/:id`
-   **Description:** Fetches the details of a specific ingestion source.

#### URL Parameters

-   `id` (string, required): The UUID of the ingestion source.

#### Responses

-   **Success (`200 OK`):** Returns the corresponding `IngestionSource` object.

-   **Error (`404 Not Found`):** Returned if no source with the given ID exists.
-   **Error (`500 Internal Server Error`):** Indicates a server-side problem.

---

## 4. Update Ingestion Source

-   **Method:** `PUT`
-   **Path:** `/:id`
-   **Description:** Modifies an existing ingestion source. This is useful for changing the name, pausing a source, or updating its configuration.

#### URL Parameters

-   `id` (string, required): The UUID of the ingestion source to update.

#### Request Body (`UpdateIngestionSourceDto`)

All fields are optional. Only include the fields you want to change.

```json
{
    "name": "Marketing Dept G-Suite (Paused)",
    "status": "paused"
}
```

#### Responses

-   **Success (`200 OK`):** Returns the complete, updated `IngestionSource` object.

-   **Error (`404 Not Found`):** Returned if no source with the given ID exists.
-   **Error (`500 Internal Server Error`):** Indicates a server-side problem.

---

## 5. Delete Ingestion Source

-   **Method:** `DELETE`
-   **Path:** `/:id`
-   **Description:** Permanently removes an ingestion source. This action cannot be undone.

#### URL Parameters

-   `id` (string, required): The UUID of the ingestion source to delete.

#### Responses

-   **Success (`204 No Content`):** Indicates successful deletion with no body content.

-   **Error (`404 Not Found`):** Returned if no source with the given ID exists.
-   **Error (`500 Internal Server Error`):** Indicates a server-side problem.

---

## 6. Trigger Initial Import

-   **Method:** `POST`
-   **Path:** `/:id/sync`
-   **Description:** Initiates the email import process for a given source. This is an asynchronous operation that enqueues a background job and immediately returns a response. The status of the source will be updated to `syncing`.

#### URL Parameters

-   `id` (string, required): The UUID of the ingestion source to sync.

#### Responses

-   **Success (`202 Accepted`):** Confirms that the sync request has been accepted for processing.

    ```json
    {
        "message": "Initial import triggered successfully."
    }
    ```

-   **Error (`404 Not Found`):** Returned if no source with the given ID exists.
-   **Error (`500 Internal Server Error`):** Indicates a server-side problem.
