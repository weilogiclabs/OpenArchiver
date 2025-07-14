import { Request, Response } from 'express';
import { SearchService } from '../../services/SearchService';
import type { SearchQuery } from '@open-archive/types';

export class SearchController {
    private searchService: SearchService;

    constructor() {
        this.searchService = new SearchService();
    }

    public search = async (req: Request, res: Response): Promise<void> => {
        try {
            const { query, filters, page, limit } = req.body as SearchQuery;

            if (!query) {
                res.status(400).json({ message: 'Query is required' });
                return;
            }

            const results = await this.searchService.searchEmails({
                query,
                filters,
                page,
                limit
            });

            res.status(200).json(results);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message });
        }
    };
}
