export type PageMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type PageResponse<T> = {
    data: T[];
    meta: PageMeta;
};
