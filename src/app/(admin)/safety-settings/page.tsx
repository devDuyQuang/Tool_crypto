"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { EmptyState } from "@/components/product/EmptyState";
import { LoadingState } from "@/components/product/LoadingState";
import { MetricCard } from "@/components/product/MetricCard";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { accountEnvironment, environmentLabel, environmentTone, riskStatusText } from "@/components/product/decisionPresenter";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotProfile, RuntimeStatus } from "@/types/botProfile";

export default function SafetySettingsPage() {
    const [bots, setBots] = useState<BotProfile[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [runtimeByBot, setRuntimeByBot] = useState<Record<string, RuntimeStatus | null>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [botRes, accountRes] = await Promise.all([
                botProfilesService.findAll({ page: 1, limit: 100, includeArchived: true }),
                accountsService.findAll({ page: 1, limit: 100 }),
            ]);
            const nextBots = Array.isArray((botRes as any).data) ? (botRes as any).data as BotProfile[] : [];
            const nextAccounts = Array.isArray((accountRes as any).data) ? (accountRes as any).data as Account[] : [];
            const runtimeEntries = await Promise.all(nextBots.slice(0, 50).map(async (bot) => {
                try {
                    return [bot._id, await botProfilesService.runtimeStatus(bot._id)] as const;
                } catch {
                    return [bot._id, null] as const;
                }
            }));
            setBots(nextBots);
            setAccounts(nextAccounts);
            setRuntimeByBot(Object.fromEntries(runtimeEntries));
        } catch (e: any) {
            const message = e?.message || "Không tải được dữ liệu an toàn";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const summary = useMemo(() => {
        const runtimes = Object.values(runtimeByBot);
        const loadedRuntimeCount = runtimes.filter(Boolean).length;
        const activePositions = runtimes.flatMap((runtime) => runtime?.protectionSummary?.activePositions ?? []);
        const unprotected = activePositions.filter((position) => String(position.protectionState ?? "").toUpperCase() !== "PROTECTED");
        const tradingEnabled = accounts.filter((account) => account.tradingEnabled).length;
        const unknown = bots.length > 0 && loadedRuntimeCount === 0;
        return { activePositions, unprotected, tradingEnabled, loadedRuntimeCount, unknown };
    }, [accounts, bots.length, runtimeByBot]);

    if (loading) return <LoadingState label="Đang tải an toàn hệ thống..." />;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="An toàn"
                title="An toàn"
                description="Theo dõi giới hạn rủi ro, quyền đặt lệnh và các vị thế cần bảo vệ. Frontend không phải source of truth của risk."
            />

            {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                    Không thể tải dữ liệu an toàn. <button onClick={load} className="font-semibold underline">Thử lại</button>
                </div>
            ) : null}

            {!error ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="An toàn hệ thống"
                            value={summary.unknown ? "Chưa xác định" : summary.unprotected.length ? "Cần kiểm tra" : "Bình thường"}
                            helper={summary.unknown ? "Không tải được runtime status" : `Từ runtime status ${summary.loadedRuntimeCount}/${bots.length} bot`}
                            tone={summary.unknown ? "dry" : summary.unprotected.length ? "error" : "success"}
                        />
                        <MetricCard label="Vị thế đang mở" value={summary.unknown ? "Chưa xác định" : summary.activePositions.length} tone={summary.activePositions.length ? "warning" : summary.unknown ? "dry" : "success"} />
                        <MetricCard label="Vị thế thiếu bảo vệ" value={summary.unknown ? "Chưa xác định" : summary.unprotected.length} tone={summary.unprotected.length ? "error" : summary.unknown ? "dry" : "success"} />
                        <MetricCard label="Tài khoản cho phép đặt lệnh" value={summary.tradingEnabled} />
                    </div>

                    {bots.length === 0 ? (
                        <EmptyState title="Chưa có bot để theo dõi an toàn" description="Tạo bot trước, sau đó các giới hạn rủi ro sẽ được hiển thị tại đây." />
                    ) : (
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Giới hạn theo bot</h2>
                            {bots.map((bot) => {
                                const runtime = runtimeByBot[bot._id];
                                const account = accounts.find((item) => (item._id ?? item.id) === bot.accountId);
                                return (
                                    <article key={bot._id} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <Link href={`/bot-profiles/${bot._id}`} className="font-semibold text-gray-950 hover:text-brand-600 dark:text-white">{bot.name}</Link>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <StatusBadge value={bot.status} />
                                                    <StatusBadge value={environmentLabel(accountEnvironment(account) ?? bot.environment)} tone={environmentTone(accountEnvironment(account) ?? bot.environment)} />
                                                    <StatusBadge value={riskStatusText(runtime)} tone={riskStatusText(runtime).includes("Cần") ? "error" : "success"} />
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{(bot.symbols ?? []).filter((item) => item.enabled).map((item) => item.symbol).join(", ") || "Chưa chọn coin"}</div>
                                        </div>
                                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                                            <div>Risk mỗi lệnh: <b>{bot.riskPerTradePercent}%</b></div>
                                            <div>Giới hạn lỗ ngày: <b>{bot.dailyLossLimitPercent}%</b></div>
                                            <div>Vị thế đồng thời: <b>{bot.maxConcurrentPositions}</b></div>
                                            <div>Trade mỗi giờ: <b>{bot.maxTradesPerHour}</b></div>
                                            <div>Margin mỗi lệnh: <b>{bot.maxMarginPerTradeUsdt} USDT</b></div>
                                            <div>Notional tối đa: <b>{bot.maxNotionalPerTradeUsdt} USDT</b></div>
                                            <div>Loss tối đa: <b>{bot.maxLossPerTradeUsdt} USDT</b></div>
                                            <div>Đòn bẩy: <b>{bot.maxLeverage}x</b></div>
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    )}
                </>
            ) : null}
        </div>
    );
}
