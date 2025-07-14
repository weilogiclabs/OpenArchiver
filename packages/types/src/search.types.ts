import type { EmailDocument } from './email.types';

export interface SearchQuery {
    query: string;
    filters?: Record<string, any>;
    page?: number;
    limit?: number;
}

export interface SearchHit extends EmailDocument {
    _matchesPosition?: {
        [key: string]: { start: number; length: number; indices?: number[]; }[];
    };
    _formatted?: Partial<EmailDocument>;
}

export interface SearchResult {
    hits: SearchHit[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
