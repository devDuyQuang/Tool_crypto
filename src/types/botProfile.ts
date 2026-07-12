import type { AccountEnvironment, Platform } from "./account";

export type BotProfileMode = "DRY_RUN" | "DEMO_AUTO" | "LIVE";
export type BotProfileStatus = "DRAFT" | "PAUSED" | "ARCHIVED";
export type BotAllowedDirections = "LONG" | "SHORT" | "BOTH";

export type SymbolUniverse = {
    _id: string;
    botProfileId: string;
    symbol: string;
    enabled: boolean;
    priority: number;
    maxRiskPercentOverride?: number | null;
    maxLeverageOverride?: number | null;
    cooldownMinutes?: number | null;
    instrumentSnapshot?: Record<string, any> | null;
    metadata?: Record<string, any>;
    createdAt?: string;
    updatedAt?: string;
};

export type BotProfile = {
    _id: string;
    name: string;
    description?: string | null;
    accountId: string;
    mode: BotProfileMode;
    status: BotProfileStatus;
    platform: Platform;
    environment: AccountEnvironment;
    contextTimeframes: string[];
    triggerTimeframe: string;
    riskPerTradePercent: number;
    dailyLossLimitPercent: number;
    maxConcurrentPositions: number;
    maxLeverage: number;
    allowedDirections: BotAllowedDirections;
    strategyVersion: "V2_DRAFT";
    createdBy: string;
    createdAt?: string;
    updatedAt?: string;
    symbols: SymbolUniverse[];
    audits?: Array<{
        _id: string;
        action: string;
        metadata: Record<string, any>;
        createdAt?: string;
    }>;
};

export type CreateBotProfilePayload = {
    name: string;
    description?: string | null;
    accountId: string;
    mode?: BotProfileMode;
    status?: BotProfileStatus;
    contextTimeframes: string[];
    triggerTimeframe: string;
    riskPerTradePercent: number;
    dailyLossLimitPercent: number;
    maxConcurrentPositions: number;
    maxLeverage: number;
    allowedDirections: BotAllowedDirections;
};

export type UpdateBotProfilePayload = Partial<CreateBotProfilePayload>;

export type UpsertSymbolUniversePayload = {
    symbol: string;
    enabled?: boolean;
    priority?: number;
    maxRiskPercentOverride?: number | null;
    maxLeverageOverride?: number | null;
    cooldownMinutes?: number | null;
    metadata?: Record<string, any>;
};
