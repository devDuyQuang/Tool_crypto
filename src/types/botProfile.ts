import type { Platform } from "./account";

export type BotProfileStatus = "RUNNING" | "PAUSED" | "STOPPED" | "ARCHIVED";
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
    status: BotProfileStatus;
    platform: Platform;
    contextTimeframes: string[];
    triggerTimeframe: string;
    riskPerTradePercent: number;
    dailyLossLimitPercent: number;
    maxConcurrentPositions: number;
    maxLeverage: number;
    maxPositionsPerSymbol: number;
    maxTradesPerHour: number;
    marginType: "ISOLATED";
    maxMarginPerTradeUsdt: number;
    maxNotionalPerTradeUsdt: number;
    maxLossPerTradeUsdt: number;
    martingaleEnabled: boolean;
    averagingDownEnabled: boolean;
    productionBaselineAt?: string | null;
    productionBaselineSnapshot?: Record<string, any> | null;
    allowedDirections: BotAllowedDirections;
    strategyVersion: "SCALPING_V2";
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
    status?: BotProfileStatus;
    contextTimeframes: string[];
    triggerTimeframe: string;
    riskPerTradePercent: number;
    dailyLossLimitPercent: number;
    maxConcurrentPositions: number;
    maxPositionsPerSymbol: number;
    maxTradesPerHour: number;
    maxLeverage: number;
    marginType: "ISOLATED";
    maxMarginPerTradeUsdt: number;
    maxNotionalPerTradeUsdt: number;
    maxLossPerTradeUsdt: number;
    martingaleEnabled: boolean;
    averagingDownEnabled: boolean;
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

export type MarketSnapshotResult = {
    symbol: string;
    status: "READY" | "STALE" | "INCOMPLETE" | "ERROR";
    reasonCodes: string[];
    instrument?: {
        status?: string;
        productType?: string;
        tickSize?: number;
        stepSize?: number;
        minQty?: number;
        minNotional?: number;
    } | null;
    markPrice?: number | null;
    latestClosedCandles: Record<string, { closeTime: string; close: number; isClosed: boolean }>;
    freshness: Record<string, { ageMs: number; stale: boolean }>;
    missingCandleCount: number;
    snapshotAt: string;
};

export type ObservationRunResult = {
    observationRunId: string;
    profileId: string;
    status: "COMPLETED" | "PARTIAL" | "FAILED";
    symbolsRequested: string[];
    symbolsSucceeded: number;
    symbolsFailed: number;
    results: MarketSnapshotResult[];
};

export type MarketContextEvaluation = {
    _id?: string;
    profileId?: string;
    symbolUniverseId?: string | null;
    snapshotId?: string;
    symbol: string;
    exchange?: Platform;
    engineVersion?: string;
    contextStatus: "READY" | "REJECTED" | "ERROR";
    marketRegime?: "TREND" | "RANGE" | "TRANSITION" | "EXPANSION" | "UNCERTAIN";
    higherTimeframeBias?: "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED";
    structure?: "BULLISH" | "BEARISH" | "RANGE_BOUND" | "MIXED" | "UNDEFINED";
    volatility?: "LOW" | "NORMAL" | "HIGH" | "EXTREME" | "UNKNOWN";
    priceLocation?: "RANGE_LOW" | "RANGE_MIDDLE" | "RANGE_HIGH" | "ABOVE_RANGE" | "BELOW_RANGE" | "TREND_PULLBACK_ZONE" | "TREND_EXTENSION" | "UNKNOWN";
    timeframeAgreement?: "ALIGNED" | "PARTIAL" | "CONFLICTING" | "UNKNOWN";
    contextConfidence?: number;
    metrics?: Record<string, any>;
    reasonCodes: string[];
    warnings?: string[];
    evaluatedAt?: string;
};

export type MarketContextRunResult = {
    profileId: string;
    engineVersion: string;
    status: "COMPLETED" | "PARTIAL" | "FAILED";
    symbolsRequested: string[];
    symbolsSucceeded: number;
    symbolsFailed: number;
    results: MarketContextEvaluation[];
};

export type AutoDecisionSide = "LONG" | "SHORT" | "NO_TRADE";

export type DecisionJournal = {
    _id?: string;
    profileId: string;
    symbol: string;
    source?: string;
    decisionScope?: "NATURAL" | "ACCEPTANCE";
    sourceType?: "NATURAL" | "ACCEPTANCE";
    snapshotId: string;
    marketContextId: string;
    scenarioVersion: string;
    decisionEngineVersion: string;
    evaluatedCandleOpenTime: string;
    decision: AutoDecisionSide;
    scenario: string;
    triggerStatus: string;
    riskEvaluation: {
        status?: string;
        proposedRiskAmount?: number;
        proposedQuantity?: number;
        cappedLeverage?: number;
        estimatedRiskReward?: number | null;
        rejectionReasons?: string[];
    };
    prices: {
        strategyKey?: string;
        setupScore?: number;
        triggerScore?: number;
        opportunityScore?: number;
        opportunityRank?: number;
        opportunityMetrics?: {
            volumeLiquidity?: number;
            spreadBps?: number;
            atrPercent?: number;
            volatilityExpansion?: number;
            openInterestChange?: number | null;
            fundingRate?: number | null;
            structureActivity?: number;
        };
        proposedEntry?: number | null;
        invalidation?: number | null;
        targets?: number[];
    };
    reasonCodes: string[];
    warnings?: string[];
    createdAt?: string;
    isOldDecision?: boolean;
};

export type RuntimeRun = {
    _id?: string;
    runId: string;
    profileId: string;
    startedAt?: string;
    completedAt?: string | null;
    status: string;
    symbolsRequested?: string[];
    symbolsSucceeded?: number;
    symbolsFailed?: number;
    decisionsLong?: number;
    decisionsShort?: number;
    decisionsNoTrade?: number;
    totalDurationMs?: number | null;
    stageDurationsMs?: Record<string, number>;
    errorSummaries?: Array<Record<string, any>>;
};

export type RuntimeStatus = {
    profileId: string;
    status: BotProfileStatus;
    runtimeEnabled: boolean;
    lastRun?: RuntimeRun | null;
    nextScan?: string | null;
    baseline?: {
        productionBaselineAt?: string | null;
        scope: "ALL_HISTORY" | "CURRENT_BASELINE";
    };
    decisionCounts: Partial<Record<AutoDecisionSide, number>>;
    protectionSummary?: {
        hasActivePosition: boolean;
        hasProtectedPosition: boolean;
        activePositions: Array<{
            symbol: string;
            direction?: string;
            quantity?: number;
            protectionState?: string;
            orderPlanId?: string;
        }>;
    };
    latestDecisions: DecisionJournal[];
};

export type DecisionOutcomeStatus =
    | "PENDING"
    | "ENTRY_NOT_TOUCHED"
    | "OPEN"
    | "TARGET_HIT"
    | "STOP_HIT"
    | "EXPIRED"
    | "AMBIGUOUS"
    | "ERROR";

export type DecisionOutcome = {
    _id?: string;
    decisionJournalId: string;
    profileId: string;
    symbol: string;
    direction: AutoDecisionSide;
    decisionEngineVersion: string;
    scenarioVersion: string;
    evaluatedCandleOpenTime: string;
    proposedEntry?: number | null;
    invalidationPrice?: number | null;
    proposedTargets: number[];
    status: DecisionOutcomeStatus;
    entryTouchedAt?: string | null;
    firstTargetHitAt?: string | null;
    stopHitAt?: string | null;
    exitPrice?: number | null;
    grossR: number;
    feeR: number;
    slippageR: number;
    netR: number;
    simulatedPnl: number;
    MFE: Record<string, any>;
    MAE: Record<string, any>;
    candlesEvaluated: number;
    evaluationVersion: string;
    reasonCodes: string[];
    completedAt?: string | null;
};

export type DecisionPerformance = {
    profileId: string;
    evaluationVersion: string;
    policy: Record<string, any>;
    totals: {
        totalEvaluations: number;
        decisions: number;
        LONG: number;
        SHORT: number;
        NO_TRADE: number;
        entryTouched: number;
        targetHit: number;
        stopHit: number;
        expired: number;
        ambiguous: number;
        winRate: number;
        profitFactor: number | null;
        expectancyR: number;
        averageWinR: number;
        averageLossR: number;
        maxDrawdownR: number;
        totalFeeR: number;
        netR: number;
        sampleSize: number;
        sampleSizeWarning: boolean;
    };
    byDirection: Record<string, any>;
    bySymbol: Record<string, any>;
    byStrategy?: Record<string, any>;
    byHour?: Record<string, any>;
    matchedOutcomeCount: number;
};

export type EvaluateOutcomesResult = {
    profileId: string;
    evaluationVersion: string;
    policy: Record<string, any>;
    totalEvaluated: number;
    outcomes: DecisionOutcome[];
};
