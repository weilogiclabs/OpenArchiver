import { Index, MeiliSearch } from 'meilisearch';
import { config } from '../config';

export class SearchService {
    private client: MeiliSearch;

    constructor() {
        this.client = new MeiliSearch({
            host: config.search.host,
            apiKey: config.search.apiKey,
        });
    }

    public async getIndex<T extends Record<string, any>>(name: string): Promise<Index<T>> {
        return this.client.index<T>(name);
    }

    public async addDocuments<T extends Record<string, any>>(
        indexName: string,
        documents: T[],
        primaryKey?: string
    ) {
        const index = await this.getIndex<T>(indexName);
        if (primaryKey) {
            index.update({ primaryKey });
        }
        return index.addDocuments(documents);
    }

    public async search<T extends Record<string, any>>(indexName: string, query: string, options?: any) {
        const index = await this.getIndex<T>(indexName);
        return index.search(query, options);
    }

    // Add other methods as needed (e.g., deleteDocuments, updateSettings)

    public async configureEmailIndex() {
        const index = await this.getIndex('emails');
        await index.updateSettings({
            searchableAttributes: [
                'subject',
                'body',
                'from',
                'to',
                'cc',
                'bcc',
                'attachments.filename',
                'attachments.content',
            ],
            filterableAttributes: ['from', 'to', 'cc', 'bcc', 'timestamp'],
            sortableAttributes: ['timestamp'],
        });
    }
}
