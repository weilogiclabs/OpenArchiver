import { IStorageProvider, StorageConfig } from '@open-archiver/types';
import { LocalFileSystemProvider } from './storage/LocalFileSystemProvider';
import { S3StorageProvider } from './storage/S3StorageProvider';
import { config } from '../config/index';

export class StorageService implements IStorageProvider {
    private provider: IStorageProvider;

    constructor(storageConfig: StorageConfig = config.storage) {
        switch (storageConfig.type) {
            case 'local':
                this.provider = new LocalFileSystemProvider(storageConfig);
                break;
            case 's3':
                this.provider = new S3StorageProvider(storageConfig);
                break;
            default:
                throw new Error('Invalid storage provider type');
        }
    }

    put(path: string, content: Buffer | NodeJS.ReadableStream): Promise<void> {
        return this.provider.put(path, content);
    }

    get(path: string): Promise<NodeJS.ReadableStream> {
        return this.provider.get(path);
    }

    delete(path: string): Promise<void> {
        return this.provider.delete(path);
    }

    exists(path: string): Promise<boolean> {
        return this.provider.exists(path);
    }
}
