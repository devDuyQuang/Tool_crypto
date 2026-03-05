import { apiFetch } from "@/lib/apiFetch";
import type { Paginated } from "@/types/common";
import type { Code } from "@/types/code";

export type ExchangeCodeMap = {
    _id: string;
    crypto_exchange_id: string;
    code_id: string;
    createdAt?: string;
    updatedAt?: string;
};

export const cryptoExchangeCodesService = {
    findAll(params?: { page?: number; limit?: number; cryptoExchangeId?: string }) {
        const q = new URLSearchParams();
        q.set("page", String(params?.page ?? 1));
        q.set("limit", String(params?.limit ?? 200));
        if (params?.cryptoExchangeId) q.set("cryptoExchangeId", params.cryptoExchangeId);

        return apiFetch<Paginated<ExchangeCodeMap>>(`/crypto-exchange-codes?${q.toString()}`);
    },

    findByExchange(cryptoExchangeId: string) {
        return this.findAll({ page: 1, limit: 50, cryptoExchangeId });
    },

    findCodesByExchange(exchangeId: string) {
        return apiFetch<Code[]>(`/crypto-exchange-codes/exchanges/${exchangeId}/codes`);
    },

    // ✅ FIX: unwrap đúng shape { success, data: { data: [], meta } }
    async findFirstCodeIdByExchange(exchangeId: string) {
        const res: any = await this.findByExchange(exchangeId);

        // apiFetch của bạn đang unwrap tới json.data
        // => res sẽ là { data: [...], meta: {...} }
        const list: any[] = Array.isArray(res?.data) ? res.data : [];

        return list?.[0]?.code_id ?? "";
    },
};
