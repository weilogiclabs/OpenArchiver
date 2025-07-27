# Installation Guide

This guide will walk you through setting up Open Archiver using Docker Compose. This is the recommended method for deploying the application.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your server or local machine.
-   A server or local machine with at least 2GB of RAM.
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
