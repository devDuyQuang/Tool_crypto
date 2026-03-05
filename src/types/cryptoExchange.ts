export interface CryptoExchange {
    _id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

export type PageMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type Paginated<T> = {
    data: T[];
    meta: PageMeta;
};
