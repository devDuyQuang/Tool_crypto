import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotProfile, CreateBotProfilePayload, ProductBotDefaults, ProductRiskLevel } from "@/types/botProfile";

function accountId(account: Account) {
    return account._id ?? account.id ?? "";
}

export function isOkxDemoReadyAccount(account?: Account | null) {
    return Boolean(
        account &&
        account.platform === "OKX" &&
        account.connectionTarget === "OKX_DEMO" &&
        account.verificationStatus === "VERIFIED" &&
        account.isActive !== false &&
        account.canTrade &&
        account.tradingEnabled
    );
}

export function productRiskPreset(defaults: ProductBotDefaults | null | undefined, level: ProductRiskLevel) {
    const fallback = {
        LOW: { riskPerTradePercent: 0.25, dailyLossLimitPercent: 1.0 },
        MEDIUM: { riskPerTradePercent: 0.5, dailyLossLimitPercent: 2.0 },
        HIGH: { riskPerTradePercent: 1.0, dailyLossLimitPercent: 3.0 },
    };
    return defaults?.riskPresets?.[level] ?? fallback[level];
}

export function buildOkxDemoAutoBotPayload(input: {
    account: Account;
    defaults: ProductBotDefaults;
    riskLevel: ProductRiskLevel;
}): CreateBotProfilePayload {
    const risk = productRiskPreset(input.defaults, input.riskLevel);
    return {
        name: `OKX Demo Auto Bot - ${input.riskLevel}`,
        description: `Product AUTO bot (${input.riskLevel})`,
        accountId: accountId(input.account),
        status: "STOPPED",
        symbolMode: "AUTO",
        maxAutoSymbols: input.defaults.maxAutoSymbols,
        maxNewEntriesPerScan: 1,
        contextTimeframes: input.defaults.contextTimeframes,
        triggerTimeframe: input.defaults.triggerTimeframe,
        riskPerTradePercent: risk.riskPerTradePercent,
        dailyLossLimitPercent: risk.dailyLossLimitPercent,
        maxConcurrentPositions: input.defaults.maxConcurrentPositions,
        maxPositionsPerSymbol: input.defaults.maxPositionsPerSymbol,
        maxTradesPerHour: input.defaults.maxTradesPerHour,
        maxLeverage: input.defaults.maxLeverage,
        marginType: input.defaults.marginType,
        maxMarginPerTradeUsdt: input.defaults.maxMarginPerTradeUsdt,
        maxNotionalPerTradeUsdt: input.defaults.maxNotionalPerTradeUsdt,
        maxLossPerTradeUsdt: input.defaults.maxLossPerTradeUsdt,
        martingaleEnabled: input.defaults.martingaleEnabled,
        averagingDownEnabled: input.defaults.averagingDownEnabled,
        allowedDirections: input.defaults.allowedDirections,
    };
}

export function findReusableOkxDemoAutoBot(bots: BotProfile[], account: Account) {
    const id = accountId(account);
    return bots.find((bot) => (
        bot.accountId === id &&
        bot.platform === "OKX" &&
        bot.symbolMode === "AUTO" &&
        bot.status !== "ARCHIVED"
    )) ?? null;
}

export async function ensureStartedOkxDemoAutoBot(input: {
    account: Account;
    bots: BotProfile[];
    riskLevel: ProductRiskLevel;
}) {
    const defaults = await botProfilesService.okxDemoAutoProductDefaults();
    const existing = findReusableOkxDemoAutoBot(input.bots, input.account);
    const bot = existing ?? await botProfilesService.create(buildOkxDemoAutoBotPayload({
        account: input.account,
        defaults,
        riskLevel: input.riskLevel,
    }));
    if (bot.status !== "RUNNING") {
        await botProfilesService.start(bot._id);
    }
    return bot;
}
