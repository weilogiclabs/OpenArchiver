# Auth Service API

The Auth Service is responsible for handling user authentication, including login and token verification.

## Endpoints

### POST /api/v1/auth/login

Authenticates a user and returns a JWT if the credentials are valid.

**Access:** Public

**Rate Limiting:** This endpoint is rate-limited to prevent brute-force attacks.

#### Request Body

| Field      | Type   | Description               |
| :--------- | :----- | :------------------------ |
| `email`    | string | The user's email address. |
| `password` | string | The user's password.      |

#### Responses

-   **200 OK:** Authentication successful.

    ```json
    {
        "accessToken": "your.jwt.token",
        "user": {
            "id": "user-id",
            "email": "user@example.com",
            "role": "user"
        }
    }
    ```

-   **400 Bad Request:** Email or password not provided.

    ```json
    {
        "message": "Email and password are required"
    }
    ```

-   **401 Unauthorized:** Invalid credentials.

    ```json
    {
        "message": "Invalid credentials"
    }
    ```

-   **500 Internal Server Error:** An unexpected error occurred.

    ```json
    {
        "message": "An internal server error occurred"
    }
    ```

## Service Methods

### `verifyPassword(password: string, hash: string): Promise<boolean>`

Compares a plain-text password with a hashed password to verify its correctness.

-   **password:** The plain-text password.
-   **hash:** The hashed password to compare against.
-   **Returns:** A promise that resolves to `true` if the password is valid, otherwise `false`.

### `login(email: string, password: string): Promise<LoginResponse | null>`

Handles the user login process. It finds the user by email, verifies the password, and generates a JWT upon successful authentication.

-   **email:** The user's email.
-   **password:** The user's password.
-   **Returns:** A promise that resolves to a `LoginResponse` object containing the `accessToken` and `user` details, or `null` if authentication fails.

### `verifyToken(token: string): Promise<AuthTokenPayload | null>`

Verifies the authenticity and expiration of a JWT.

-   **token:** The JWT string to verify.
-   **Returns:** A promise that resolves to the token's `AuthTokenPayload` if valid, otherwise `null`.
