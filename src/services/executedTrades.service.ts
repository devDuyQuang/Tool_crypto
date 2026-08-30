import { apiFetch } from "@/lib/apiFetch";
import type { Paginated } from "@/types/common";
import type { ExecutedTrade } from "@/types/executedTrade";

export const executedTradesService = {
    findAll(params: { page: number; limit: number }) {
        const qs = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
        });
        return apiFetch<Paginated<ExecutedTrade>>(`/executed-trades?${qs.toString()}`);
    },

    findByBotProfile(botProfileId: string, params: { page: number; limit: number }) {
        const qs = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
        });
        return apiFetch<Paginated<ExecutedTrade>>(`/executed-trades/bot-profile/${botProfileId}?${qs.toString()}`);
    },
};
