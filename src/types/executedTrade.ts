import type { AccountConnectionTarget, Platform } from "./account";
import type { AutoDecisionSide } from "./botProfile";

export type ExecutedTradeStatus = "OPEN" | "CLOSING" | "CLOSED" | "ERROR";

export type ExecutedTrade = {
    id: string;
    botProfileId: string;
    runtimeRunId?: string | null;
    accountId: string;
    exchange: Platform | string;
    connectionTarget: AccountConnectionTarget;
    symbol: string;
    strategyId?: string | null;
    strategyVersion?: string | null;
    direction: Exclude<AutoDecisionSide, "NO_TRADE">;
    status: ExecutedTradeStatus;
    entryTime: string;
    entryAvgPrice: number;
    filledContracts: number;
    stopPrice: number;
    targetPrice: number;
    protectionStatus?: string | null;
    exitTime?: string | null;
    exitAvgPrice?: number | null;
    exitReason?: string | null;
    grossPnl?: number | null;
    fees?: number | null;
    netPnl?: number | null;
    realizedR?: number | null;
    createdAt?: string;
    updatedAt?: string;
};
