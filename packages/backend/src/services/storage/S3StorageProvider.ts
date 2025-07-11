import { IStorageProvider, S3StorageConfig } from '@open-archive/types';
import {
    S3Client,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    NotFound,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export class S3StorageProvider implements IStorageProvider {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(config: S3StorageConfig) {
        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            forcePathStyle: config.forcePathStyle,
        });
        this.bucket = config.bucket;
    }

    async put(path: string, content: Buffer | NodeJS.ReadableStream): Promise<void> {
        const upload = new Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key: path,
                Body: content instanceof Readable ? content : Readable.from(content),
            },
        });

        await upload.done();
    }

    async get(path: string): Promise<NodeJS.ReadableStream> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        try {
            const response = await this.client.send(command);
            if (response.Body instanceof Readable) {
                return response.Body;
            }
            throw new Error('Readable stream not found in S3 response');
        } catch (error) {
            if (error instanceof NotFound) {
                throw new Error('File not found');
            }
            throw error;
        }
    }

    async delete(path: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });
        await this.client.send(command);
    }

    async exists(path: string): Promise<boolean> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: path,
        });

        try {
            await this.client.send(command);
            return true;
        } catch (error) {
            if (error instanceof NotFound) {
                return false;
            }
            throw error;
        }
    }
}
