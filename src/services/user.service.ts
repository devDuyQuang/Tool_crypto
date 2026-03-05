import { apiFetch } from "@/lib/apiFetch";
import { withFeedback } from "@/lib/uiFeedback";

export type User = {
    _id: string;
    email: string;
    fullName?: string;
    role?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
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

export const userService = {
    findAll(params?: { page?: number; limit?: number; search?: string }) {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", String(params.page));
        if (params?.limit) qs.set("limit", String(params.limit));
        if (params?.search) qs.set("search", params.search);

        const query = qs.toString();
        return apiFetch<Paginated<User>>(`/users${query ? `?${query}` : ""}`);
    },

    findOne(id: string) {
        return apiFetch<User>(`/users/${id}`);
    },

    create(body: { email: string; password: string; fullName: string; role?: string; isActive?: boolean }) {
        return withFeedback(
            () =>
                apiFetch<User>("/users", {
                    method: "POST",
                    body: JSON.stringify(body),
                }),
            {
                loadingText: "Đang tạo user...",
                successText: "Tạo user thành công ✅",
            }
        );
    },

    update(
        id: string,
        body: Partial<{ email: string; password: string; fullName: string; role: string; isActive: boolean }>
    ) {
        return withFeedback(
            () =>
                apiFetch<User>(`/users/${id}`, {
                    method: "PATCH",
                    body: JSON.stringify(body),
                }),
            {
                loadingText: "Đang cập nhật user...",
                successText: "Cập nhật user thành công ✅",
            }
        );
    },

    remove(id: string) {
        return withFeedback(
            () =>
                apiFetch<{ message?: string }>(`/users/${id}`, {
                    method: "DELETE",
                }),
            {
                loadingText: "Đang xoá user...",
                successText: "Đã xoá user ✅",
            }
        );
    },
};
