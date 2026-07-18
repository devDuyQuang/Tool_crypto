import { apiFetch } from "@/lib/apiFetch";
import type { Paginated } from "@/types/common";
import type {
    BotProfile,
    CreateBotProfilePayload,
    SymbolUniverse,
    UpdateBotProfilePayload,
    UpsertSymbolUniversePayload,
    ObservationRunResult,
    MarketContextRunResult,
    DecisionJournal,
    RuntimeStatus,
    DecisionOutcome,
    DecisionPerformance,
    EvaluateOutcomesResult,
    RuntimeRun,
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

    observeOnce(id: string) {
        return apiFetch<ObservationRunResult>(`/bot-profiles/${id}/observe-once`, { method: "POST" });
    },

    evaluateContextOnce(id: string) {
        return apiFetch<MarketContextRunResult>(`/bot-profiles/${id}/evaluate-context-once`, { method: "POST" });
    },

    start(id: string) {
        return apiFetch<{ ok: boolean; status: string }>(`/bot-profiles/${id}/start`, { method: "POST" });
    },

    pause(id: string) {
        return apiFetch<{ ok: boolean; status: string }>(`/bot-profiles/${id}/pause`, { method: "POST" });
    },

    stop(id: string) {
        return apiFetch<{ ok: boolean; status: string }>(`/bot-profiles/${id}/stop`, { method: "POST" });
    },

    runDryOnce(id: string) {
        return apiFetch<Record<string, any>>(`/bot-profiles/${id}/run-dry-once`, { method: "POST" });
    },

    runtimeStatus(id: string) {
        return apiFetch<RuntimeStatus>(`/bot-profiles/${id}/runtime-status`);
    },

    runtimeRuns(id: string) {
        return apiFetch<RuntimeRun[]>(`/bot-profiles/${id}/runtime-runs`);
    },

    decisions(id: string, params: { includeAcceptance?: boolean } = {}) {
        const qs = new URLSearchParams({
            ...(params.includeAcceptance ? { includeAcceptance: "true" } : {}),
        });
        const query = qs.toString();
        return apiFetch<DecisionJournal[]>(`/bot-profiles/${id}/decisions${query ? `?${query}` : ""}`);
    },

    evaluateOutcomes(id: string) {
        return apiFetch<EvaluateOutcomesResult>(`/bot-profiles/${id}/evaluate-outcomes`, { method: "POST" });
    },

    replay(id: string, payload: { symbol?: string; start?: string; end?: string } = {}) {
        return apiFetch<DecisionPerformance>(`/bot-profiles/${id}/replay`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    outcomes(id: string) {
        return apiFetch<DecisionOutcome[]>(`/bot-profiles/${id}/outcomes`);
    },

    performance(id: string) {
        return apiFetch<DecisionPerformance>(`/bot-profiles/${id}/performance`);
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
