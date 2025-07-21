import { Request, Response } from 'express';
import { SearchService } from '../../services/SearchService';
import type { SearchQuery } from '@open-archiver/types';

export class SearchController {
    private searchService: SearchService;

    constructor() {
        this.searchService = new SearchService();
    }

    public search = async (req: Request, res: Response): Promise<void> => {
        try {
            const { keywords, page, limit } = req.query;

            if (!keywords) {
                res.status(400).json({ message: 'Keywords are required' });
                return;
            }

            const results = await this.searchService.searchEmails({
                query: keywords as string,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10
            });

            res.status(200).json(results);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).json({ message });
        }
    };
}
