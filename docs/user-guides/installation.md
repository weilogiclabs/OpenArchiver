# Installation Guide

This guide will walk you through setting up Open Archiver using Docker Compose. This is the recommended method for deploying the application.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your server or local machine.
-   A server or local machine with at least 4GB of RAM (2GB of RAM if you use external Postgres, Redis (Valkey) and Meilisearch instances).
-   [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) installed on your server or local machine.

## 1. Clone the Repository

First, clone the Open Archiver repository to your machine:

```bash
git clone https://github.com/LogicLabs-OU/OpenArchiver.git
cd OpenArchiver
```

## 2. Configure Your Environment

The application is configured using environment variables. You'll need to create a `.env` file to store your configuration.

Copy the example environment file for Docker:

```bash
cp .env.example.docker .env
```

Now, open the `.env` file in a text editor and customize the settings.

### Important Configuration

You must change the following placeholder values to secure your instance:

-   `POSTGRES_PASSWORD`: A strong, unique password for the database.
-   `REDIS_PASSWORD`: A strong, unique password for the Valkey/Redis service.
-   `MEILI_MASTER_KEY`: A complex key for Meilisearch.
-   `JWT_SECRET`: A long, random string for signing authentication tokens.
-   `ADMIN_PASSWORD`: A strong password for the initial admin user.
-   `ENCRYPTION_KEY`: A 32-byte hex string for encrypting sensitive data in the database. You can generate one with the following command:
    ```bash
    openssl rand -hex 32
    ```

### Storage Configuration

By default, the Docker Compose setup uses local filesystem storage, which is persisted using a Docker volume named `archiver-data`. This is suitable for most use cases.

If you want to use S3-compatible object storage, change the `STORAGE_TYPE` to `s3` and fill in your S3 credentials (`STORAGE_S3_*` variables).

### Using External Services

For convenience, the `docker-compose.yml` file includes services for PostgreSQL, Valkey (Redis), and Meilisearch. However, you can use your own external or managed instances for these services.

To do so:

1.  **Update your `.env` file**: Change the host, port, and credential variables to point to your external service instances. For example, you would update `DATABASE_URL`, `REDIS_HOST`, and `MEILI_HOST`.
2.  **Modify `docker-compose.yml`**: Remove or comment out the service definitions for `postgres`, `valkey`, and `meilisearch` from your `docker-compose.yml` file.

This will configure the Open Archiver application to connect to your services instead of starting the default ones.

### Environment Variable Reference

Here is a complete list of environment variables available for configuration:

#### Application Settings

| Variable        | Description                        | Default Value |
| --------------- | ---------------------------------- | ------------- |
| `NODE_ENV`      | The application environment.       | `development` |
| `PORT_BACKEND`  | The port for the backend service.  | `4000`        |
| `PORT_FRONTEND` | The port for the frontend service. | `3000`        |

#### Docker Compose Service Configuration

These variables are used by `docker-compose.yml` to configure the services.

| Variable            | Description                                     | Default Value                                            |
| ------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `POSTGRES_DB`       | The name of the PostgreSQL database.            | `open_archive`                                           |
| `POSTGRES_USER`     | The username for the PostgreSQL database.       | `admin`                                                  |
| `POSTGRES_PASSWORD` | The password for the PostgreSQL database.       | `password`                                               |
| `DATABASE_URL`      | The connection URL for the PostgreSQL database. | `postgresql://admin:password@postgres:5432/open_archive` |
| `MEILI_MASTER_KEY`  | The master key for Meilisearch.                 | `aSampleMasterKey`                                       |
| `MEILI_HOST`        | The host for the Meilisearch service.           | `http://meilisearch:7700`                                |
| `REDIS_HOST`        | The host for the Valkey (Redis) service.        | `valkey`                                                 |
| `REDIS_PORT`        | The port for the Valkey (Redis) service.        | `6379`                                                   |
| `REDIS_PASSWORD`    | The password for the Valkey (Redis) service.    | `defaultredispassword`                                   |
| `REDIS_TLS_ENABLED` | Enable or disable TLS for Redis.                | `false`                                                  |

#### Storage Settings

| Variable                       | Description                                      | Default Value             |
| ------------------------------ | ------------------------------------------------ | ------------------------- |
| `STORAGE_TYPE`                 | The storage backend to use (`local` or `s3`).    | `local`                   |
| `STORAGE_LOCAL_ROOT_PATH`      | The root path for local file storage.            | `/var/data/open-archiver` |
| `STORAGE_S3_ENDPOINT`          | The endpoint for S3-compatible storage.          |                           |
| `STORAGE_S3_BUCKET`            | The bucket name for S3-compatible storage.       |                           |
| `STORAGE_S3_ACCESS_KEY_ID`     | The access key ID for S3-compatible storage.     |                           |
| `STORAGE_S3_SECRET_ACCESS_KEY` | The secret access key for S3-compatible storage. |                           |
| `STORAGE_S3_REGION`            | The region for S3-compatible storage.            |                           |
| `STORAGE_S3_FORCE_PATH_STYLE`  | Force path-style addressing for S3.              | `false`                   |

#### Security & Authentication

| Variable         | Description                                         | Default Value                              |
| ---------------- | --------------------------------------------------- | ------------------------------------------ |
| `JWT_SECRET`     | A secret key for signing JWT tokens.                | `a-very-secret-key-that-you-should-change` |
| `JWT_EXPIRES_IN` | The expiration time for JWT tokens.                 | `7d`                                       |
| `ADMIN_EMAIL`    | The email for the initial admin user.               | `admin@local.com`                          |
| `ADMIN_PASSWORD` | The password for the initial admin user.            | `a_strong_password_that_you_should_change` |
| `SUPER_API_KEY`  | An API key with super admin privileges.             |                                            |
| `ENCRYPTION_KEY` | A 32-byte hex string for encrypting sensitive data. |                                            |

## 3. Run the Application

Once you have configured your `.env` file, you can start all the services using Docker Compose:

```bash
docker compose up -d
```

This command will:

-   Pull the required Docker images for the frontend, backend, database, and other services.
-   Create and start the containers in the background (`-d` flag).
-   Create the persistent volumes for your data.

You can check the status of the running containers with:

```bash
docker compose ps
```

## 4. Access the Application

Once the services are running, you can access the Open Archiver web interface by navigating to `http://localhost:3000` in your web browser.

You can log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you configured in your `.env` file.

## 5. Next Steps

After successfully deploying and logging into Open Archiver, the next step is to configure your ingestion sources to start archiving emails.

-   [Connecting to Google Workspace](./email-providers/google-workspace.md)
-   [Connecting to Microsoft 365](./email-providers/microsoft-365.md)
-   [Connecting to a Generic IMAP Server](./email-providers/imap.md)

## Updating Your Installation

To update your Open Archiver instance to the latest version, run the following commands:

```bash
# Pull the latest changes from the repository
git pull

# Pull the latest Docker images
docker compose pull

# Restart the services with the new images
docker compose up -d
```
