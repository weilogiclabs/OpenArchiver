import { Job } from 'bullmq';
import { StorageService } from '../../services/StorageService';
// import { SearchService } from '../../services/SearchService';

// const storageService = new StorageService();
// const searchService = new SearchService();

interface IIndexEmailJob {
    filePath: string;
    ingestionSourceId: string;
}

export default async (job: Job<IIndexEmailJob>) => {
    const { filePath, ingestionSourceId } = job.data;
    console.log(`Processing index-email for file: ${filePath}`);

    // TODO:
    // 1. Read the email file from storage.
    // 2. Parse the email content.
    // 3. Index the email in the search engine.

    // const emailContent = await storageService.get(filePath);
    // await searchService.indexDocument(ingestionSourceId, emailContent);
};
