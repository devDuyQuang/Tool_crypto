import { apiFetch } from "@/lib/apiFetch";

export type AccountSymbolsResponse = {
    accountId: string;
    platform: string;
    symbols: string[];
};

export const accountsSymbolsService = {
    getSymbols(params: { accountId: string; q?: string; limit?: number }) {
        const qs = new URLSearchParams();
        if (params.q) qs.set("q", params.q);
        if (params.limit) qs.set("limit", String(params.limit));

        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        return apiFetch<AccountSymbolsResponse>(`/accounts/${params.accountId}/symbols${suffix}`);
    },
};
