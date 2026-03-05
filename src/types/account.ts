// src/types/account.ts
import type { Paginated } from "./common";

export type Platform = "BINANCE" | "OKX" | "BYBIT";

export interface Account {
    id?: string;
    _id?: string;

    userId?: string;

    crypto_exchange_id: string; // ✅ bắt buộc để filter code theo exchange
    platform: Platform;
    label: string;
    apiKey: string;

    isActive: boolean;

    createdAt: string;
    updatedAt?: string;
}

export type AccountPaginated = Paginated<Account>;
