// src/types/campaign.ts
import type { Paginated } from "./common";

export type MarginMode = "cross" | "isolated";

export interface Campaign {
    _id: string;
    name: string;
    crypto_exchange_id: string;
    code_id: string;
    account_id: string;

    margin: MarginMode;
    leverage: number;
    money: number;
    tp?: number;
    sl?: number;

    createdAt: string;
    updatedAt: string;
}

export type CampaignPaginated = Paginated<Campaign>;
