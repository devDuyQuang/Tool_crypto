// src/services/campaigns.service.ts
import { apiFetch } from "@/lib/apiFetch";
import type { Campaign } from "@/types/campaign";
import type { Paginated } from "@/types/common"

export type CreateCampaignPayload = {
    name: string;
    accountId: string;
    codeId: string;
    symbol: string; // ✅ thêm
    margin: "cross" | "isolated";
    leverage: number;
    money: number;
    tp?: number;
    sl?: number;
};

export type UpdateCampaignPayload = Partial<Omit<CreateCampaignPayload, "accountId" | "codeId" | "symbol">>;

export const campaignsService = {
    findAll(params: { page: number; limit: number; search?: string }) {
        const q = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
            ...(params.search ? { search: params.search } : {}),
        });
        return apiFetch<Paginated<Campaign>>(`/campaigns?${q.toString()}`);
    },

    findOne(id: string) {
        return apiFetch<Campaign>(`/campaigns/${id}`);
    },

    create(payload: CreateCampaignPayload) {
        return apiFetch<Campaign>(`/campaigns`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    update(id: string, payload: UpdateCampaignPayload) {
        return apiFetch<Campaign>(`/campaigns/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    remove(id: string) {
        return apiFetch<{ message: string }>(`/campaigns/${id}`, { method: "DELETE" });
    },
};
