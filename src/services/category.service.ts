import { apiFetch } from "@/lib/apiFetch";

export type Category = {
    _id: string;
    name: string;
    slug?: string;
    status?: boolean;
    file?: string;
};

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

export const categoryService = {
    findAll(params?: { page?: number; limit?: number; search?: string }) {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", String(params.page));
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.search) qs.set("search", params.search);

        const query = qs.toString();
        return apiFetch<Paginated<Category>>(`/category${query ? `?${query}` : ""}`);
    },

    findOne(id: string) {
        return apiFetch<Category>(`/category/${id}`);
    },

    create(body: any) {
        return apiFetch<Category>("/category", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },

    update(id: string, body: any) {
        return apiFetch<Category>(`/category/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    },

    remove(id: string) {
        return apiFetch<any>(`/category/${id}`, { method: "DELETE" });
    },
};
