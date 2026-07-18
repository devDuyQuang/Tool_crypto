"use client";

import Link from "next/link";
import type { BotProfile, DecisionJournal, RuntimeStatus } from "@/types/botProfile";
import { DecisionBadge } from "./DecisionBadge";
import { HealthIndicator } from "./HealthIndicator";
import { StatusBadge } from "./StatusBadge";

type BotCardProps = {
    bot: BotProfile;
    runtime?: RuntimeStatus | null;
    latestDecision?: DecisionJournal | null;
    onStart?: () => void;
    onPause?: () => void;
    onStop?: () => void;
};

export function BotCard({ bot, runtime, latestDecision, onStart, onPause, onStop }: BotCardProps) {
    const enabledSymbols = (bot.symbols ?? []).filter((s) => s.enabled);
    const health = bot.status === "RUNNING" ? "healthy" : bot.status === "PAUSED" ? "warning" : bot.status === "ARCHIVED" ? "error" : "unknown";
    const hasActivePosition = Boolean(runtime?.protectionSummary?.hasActivePosition);
    const hasProtectedPosition = Boolean(runtime?.protectionSummary?.hasProtectedPosition);
    const hasRiskPause = bot.status === "PAUSED" && runtime?.lastRun?.errorSummaries?.some((item) => String(item.code ?? item.message ?? "").includes("RISK"));
    const canStart = !["RUNNING", "ARCHIVED"].includes(bot.status);
    const canPause = bot.status === "RUNNING";
    const canStop = bot.status === "RUNNING" || bot.status === "PAUSED";

    return (
        <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/bot-profiles/${bot._id}`} className="text-lg font-semibold text-gray-950 hover:text-brand-600 dark:text-white">
                            {bot.name}
                        </Link>
                        <StatusBadge value={bot.status} />
                        {bot.status === "RUNNING" ? <StatusBadge value="Đang quét" /> : null}
                        {hasActivePosition ? <StatusBadge value="Đang có vị thế" /> : null}
                        {hasProtectedPosition ? <StatusBadge value="Đã bảo vệ" /> : null}
                        {hasActivePosition && !hasProtectedPosition ? <StatusBadge value="Không được bảo vệ" /> : null}
                        {hasRiskPause ? <StatusBadge value="Tạm dừng do rủi ro" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {bot.platform} · {enabledSymbols.length} symbol đang theo dõi
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {enabledSymbols.slice(0, 8).map((symbol) => (
                            <span key={symbol._id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-200">
                                {symbol.symbol}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button disabled={!canStart} onClick={onStart} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700">
                        START
                    </button>
                    <button disabled={!canPause} onClick={onPause} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 dark:border-amber-800 dark:text-amber-300 dark:disabled:border-gray-800">
                        PAUSE
                    </button>
                    <button disabled={!canStop} onClick={onStop} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 dark:border-gray-700 dark:text-gray-200">
                        STOP
                    </button>
                </div>
            </div>
            <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 text-sm dark:border-gray-800 md:grid-cols-4">
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Sức khỏe</div>
                    <div className="mt-1"><HealthIndicator health={health} label={bot.status === "RUNNING" ? "Đang quét" : bot.status} /></div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Lần quét cuối</div>
                    <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">{runtime?.lastRun?.completedAt ? new Date(runtime.lastRun.completedAt).toLocaleString() : "Chưa có"}</div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Quyết định mới nhất</div>
                    <div className="mt-1 space-y-1">
                        {latestDecision ? (
                            <>
                                <DecisionBadge decision={latestDecision.decision} />
                                <div className="text-xs text-gray-500 dark:text-gray-400">{latestDecision.prices?.strategyKey ?? "Chưa chọn strategy"}</div>
                            </>
                        ) : (
                            <div className="font-medium text-gray-900 dark:text-gray-100">Chưa có tín hiệu giao dịch mới</div>
                        )}
                    </div>
                </div>
                <div>
                    <div className="text-gray-500 dark:text-gray-400">Opportunity</div>
                    <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">{latestDecision?.prices?.opportunityScore ?? "-"} / 100</div>
                </div>
            </div>
        </article>
    );
}
