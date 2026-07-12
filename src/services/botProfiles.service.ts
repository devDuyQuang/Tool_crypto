import { apiFetch } from "@/lib/apiFetch";
import type { Paginated } from "@/types/common";
import type {
    BotProfile,
    CreateBotProfilePayload,
    SymbolUniverse,
    UpdateBotProfilePayload,
    UpsertSymbolUniversePayload,
} from "@/types/botProfile";

export const botProfilesService = {
    findAll(params: { page: number; limit: number; includeArchived?: boolean }) {
        const qs = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
            ...(params.includeArchived ? { includeArchived: "true" } : {}),
        });
        return apiFetch<Paginated<BotProfile>>(`/bot-profiles?${qs.toString()}`);
    },

    findOne(id: string) {
        return apiFetch<BotProfile>(`/bot-profiles/${id}`);
    },

    create(payload: CreateBotProfilePayload) {
        return apiFetch<BotProfile>("/bot-profiles", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    update(id: string, payload: UpdateBotProfilePayload) {
        return apiFetch<BotProfile>(`/bot-profiles/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    archive(id: string) {
        return apiFetch<BotProfile>(`/bot-profiles/${id}/archive`, { method: "POST" });
    },

    addSymbol(id: string, payload: UpsertSymbolUniversePayload) {
        return apiFetch<SymbolUniverse>(`/bot-profiles/${id}/symbols`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    updateSymbol(id: string, symbolId: string, payload: Partial<UpsertSymbolUniversePayload>) {
        return apiFetch<SymbolUniverse>(`/bot-profiles/${id}/symbols/${symbolId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    removeSymbol(id: string, symbolId: string) {
        return apiFetch<{ ok: boolean }>(`/bot-profiles/${id}/symbols/${symbolId}`, {
            method: "DELETE",
        });
    },
};
