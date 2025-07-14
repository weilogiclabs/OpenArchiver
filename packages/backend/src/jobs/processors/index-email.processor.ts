import { Job } from 'bullmq';
import { IndexingService } from '../../services/IndexingService';
import { SearchService } from '../../services/SearchService';
import { StorageService } from '../../services/StorageService';
import DatabaseService from '../../services/DatabaseService';

const searchService = new SearchService();
const storageService = new StorageService();
const indexingService = new IndexingService(DatabaseService, searchService, storageService);

export default async function (job: Job<{ emailId: string; }>) {
    const { emailId } = job.data;
    console.log(`Indexing email with ID: ${emailId}`);
    await indexingService.indexEmailById(emailId);
}
