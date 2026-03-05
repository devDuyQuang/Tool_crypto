import { apiFetch } from "@/lib/apiFetch";
import type { Code } from "@/types/code";
import type { Paginated } from "@/types/common";

export const codesService = {
    findAll(params: { page: number; limit: number; search?: string }) {
        const q = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
            ...(params.search ? { search: params.search } : {}),
        });

        return apiFetch<Paginated<Code>>(`/codes?${q.toString()}`);
    },

    findOne(id: string) {
        return apiFetch<Code>(`/codes/${id}`);
    },

    create(payload: { name: string }) {
        return apiFetch<Code>(`/codes`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    update(id: string, payload: { name: string }) {
        return apiFetch<Code>(`/codes/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    remove(id: string) {
        return apiFetch<{ message: string }>(`/codes/${id}`, {
            method: "DELETE",
        });
    },
};
