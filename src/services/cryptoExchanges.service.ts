import { apiFetch } from "@/lib/apiFetch";
import type { CryptoExchange, Paginated } from "@/types/cryptoExchange";

export const cryptoExchangesService = {
    findAll(params?: { page?: number; limit?: number; search?: string }) {
        const q = new URLSearchParams();
        q.set("page", String(params?.page ?? 1));
        q.set("limit", String(params?.limit ?? 10));
        if (params?.search?.trim()) q.set("search", params.search.trim());

        return apiFetch<Paginated<CryptoExchange>>(`/crypto-exchanges?${q.toString()}`);
    },

    findOne(id: string) {
        return apiFetch<CryptoExchange>(`/crypto-exchanges/${id}`);
    },

    create(payload: { name: string }) {
        return apiFetch<CryptoExchange>(`/crypto-exchanges`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    update(id: string, payload: { name?: string }) {
        return apiFetch<CryptoExchange>(`/crypto-exchanges/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    remove(id: string) {
        return apiFetch<{ message: string }>(`/crypto-exchanges/${id}`, {
            method: "DELETE",
        });
    },
};
