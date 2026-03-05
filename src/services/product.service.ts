import { apiFetch } from "@/lib/apiFetch";
import { PageResponse } from "@/types/pagination";
export type CategoryRef = { _id: string; name: string; slug?: string };

export type Product = {
    _id: string;
    name: string;
    slug: string;
    price: number;
    description?: string;
    content?: string;
    categoryId: string | { _id: string; name: string; slug?: string };
};

export type ProductCreateBody = {
    name: string;
    price: number;
    description?: string;
    content?: string;
    categoryId: string;
};

export type ProductUpdateBody = Partial<ProductCreateBody>;

export const productService = {
    findAll(params?: { page?: number; limit?: number; search?: string }) {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", String(params.page));
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.search) qs.set("search", params.search);

        const url = `/product${qs.toString() ? `?${qs}` : ""}`;
        return apiFetch<PageResponse<Product>>(url);
    },
    findOne(id: string) {
        return apiFetch<Product>(`/product/${id}`);
    },
    create(body: ProductCreateBody) {
        return apiFetch<Product>("/product", {
            method: "POST",
            body: JSON.stringify(body),
        });
    },
    update(id: string, body: ProductUpdateBody) {
        return apiFetch<Product>(`/product/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    },
    remove(id: string) {
        return apiFetch<any>(`/product/${id}`, { method: "DELETE" });
    },
};
