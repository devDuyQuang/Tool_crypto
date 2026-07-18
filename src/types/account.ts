// src/types/account.ts
import type { Paginated } from "./common";

export type Platform = "BINANCE" | "OKX" | "BINGX";
export type AccountVerificationStatus = "VERIFIED" | "FAILED" | "NOT_VERIFIED";

export interface Account {
    id?: string;
    _id?: string;

    userId?: string;

    crypto_exchange_id: string; // ✅ bắt buộc để filter code theo exchange
    platform: Platform;
    label: string;
    apiKey: string;

    isActive: boolean;
    verificationStatus?: AccountVerificationStatus;
    lastVerifiedAt?: string | null;
    lastVerificationErrorCode?: string | null;
    lastVerificationMessage?: string | null;
    uid?: string;
    username?: string;
    canTrade?: boolean;
    tradingEnabled?: boolean;
    verifiedAt?: string | null;
    permissions?: string[];

    createdAt: string;
    updatedAt?: string;
}

export type AccountVerifyResult = {
    ok: boolean;
    verificationStatus: AccountVerificationStatus;
    errorCode?: string;
    message?: string;
    account: Account;
};

export type AccountPaginated = Paginated<Account>;
