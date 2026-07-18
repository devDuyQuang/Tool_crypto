"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { DecisionBadge } from "@/components/product/DecisionBadge";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { HealthIndicator } from "@/components/product/HealthIndicator";
import { LoadingState } from "@/components/product/LoadingState";
import { MetricCard } from "@/components/product/MetricCard";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotProfile, DecisionJournal, RuntimeStatus } from "@/types/botProfile";

type DashboardState = {
    bots: BotProfile[];
    accounts: Account[];
    runtimeByBot: Record<string, RuntimeStatus | null>;
    decisions: DecisionJournal[];
};

function isSmokeProfile(bot: BotProfile) {
    const name = bot.name.toLowerCase();
    return name.includes("smoke") || name.includes("test") || name.includes("phase");
}

function naturalDecisions(decisions: DecisionJournal[]) {
    return decisions.filter((decision) => decision.sourceType !== "ACCEPTANCE" && decision.decisionScope !== "ACCEPTANCE");
}

export default function DashboardPage() {
    const [state, setState] = useState<DashboardState>({ bots: [], accounts: [], runtimeByBot: {}, decisions: [] });
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
            const bots = Array.isArray((botRes as any).data) ? (botRes as any).data as BotProfile[] : [];
            const accounts = Array.isArray((accountRes as any).data) ? (accountRes as any).data as Account[] : [];
            const visibleBots = bots.filter((bot) => !isSmokeProfile(bot));

            const runtimeEntries = await Promise.all(
                visibleBots.slice(0, 20).map(async (bot) => {
                    try {
                        const runtime = await botProfilesService.runtimeStatus(bot._id);
                        return [bot._id, runtime] as const;
                    } catch {
                        return [bot._id, null] as const;
                    }
                })
            );

            const decisionLists = await Promise.all(
                visibleBots.slice(0, 10).map(async (bot) => {
                    try {
                        return await botProfilesService.decisions(bot._id);
                    } catch {
                        return [];
                    }
                })
            );

            setState({
                bots: visibleBots,
                accounts,
                runtimeByBot: Object.fromEntries(runtimeEntries),
                decisions: naturalDecisions(decisionLists.flat()).sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 8),
            });
        } catch (e: any) {
            const message = e?.message || "Không tải được dashboard vận hành";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const metrics = useMemo(() => {
        const running = state.bots.filter((bot) => bot.status === "RUNNING").length;
        const paused = state.bots.filter((bot) => bot.status === "PAUSED").length;
        const stopped = state.bots.filter((bot) => bot.status === "STOPPED").length;
        const symbolsScanning = state.bots
            .filter((bot) => bot.status === "RUNNING")
            .reduce((sum, bot) => sum + (bot.symbols ?? []).filter((s) => s.enabled).length, 0);
        const counts = state.decisions.reduce(
            (acc, decision) => {
                acc[decision.decision] = (acc[decision.decision] ?? 0) + 1;
                return acc;
            },
            { LONG: 0, SHORT: 0, NO_TRADE: 0 } as Record<string, number>
        );
        const runtimeErrors = Object.values(state.runtimeByBot).filter((runtime) => String(runtime?.lastRun?.status ?? "").toUpperCase() === "FAILED").length;
        const activeAccounts = state.accounts.filter((account) => account.isActive).length;
        const lastRun = Object.values(state.runtimeByBot)
            .map((runtime) => runtime?.lastRun?.completedAt ?? runtime?.lastRun?.startedAt)
            .filter(Boolean)
            .sort()
            .at(-1);

        return { running, paused, stopped, symbolsScanning, counts, runtimeErrors, activeAccounts, lastRun };
    }, [state]);

    if (loading) return <LoadingState label="Đang tải Auto Bot Operations Dashboard..." />;
    if (error) return <ErrorState message={error} action={<button onClick={load} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Tải lại</button>} />;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Auto Trading Console"
                title="Bảng điều khiển vận hành bot"
                description="Theo dõi runtime tự động, sức khỏe dữ liệu, quyết định mới nhất và trạng thái tài khoản. Execution được kiểm soát ở backend; màn hình này không có nút đặt lệnh thủ công."
                actions={<Link href="/bot-profiles" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Quản lý bot</Link>}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Bot đang chạy" value={metrics.running} helper={`${metrics.paused} tạm dừng · ${metrics.stopped} dừng/nháp`} tone="success" />
                <MetricCard label="Symbol đang quét" value={metrics.symbolsScanning} helper="Tính theo bot RUNNING" tone="dry" />
                <MetricCard label="Lần quét cuối" value={metrics.lastRun ? new Date(metrics.lastRun).toLocaleTimeString() : "Chưa có"} helper={metrics.lastRun ? new Date(metrics.lastRun).toLocaleDateString() : "Runtime chưa ghi run"} />
                <MetricCard label="Lỗi runtime" value={metrics.runtimeErrors} helper="Từ lần quét gần nhất" tone={metrics.runtimeErrors ? "error" : "success"} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="LONG" value={metrics.counts.LONG} helper="Nhật ký quyết định gần đây" tone="success" />
                <MetricCard label="SHORT" value={metrics.counts.SHORT} helper="Nhật ký quyết định gần đây" tone="error" />
                <MetricCard label="NO_TRADE" value={metrics.counts.NO_TRADE} helper="Kết quả bình thường khi điều kiện chưa đủ" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Bot đang chạy</h2>
                        <Link href="/bot-profiles" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Xem tất cả</Link>
                    </div>
                    <div className="space-y-3">
                        {state.bots.filter((bot) => bot.status === "RUNNING").length === 0 ? (
                            <EmptyState title="Chưa có bot đang chạy" description="START chỉ khả dụng cho profile khi runtime flag đã bật ở backend." />
                        ) : (
                            state.bots.filter((bot) => bot.status === "RUNNING").map((bot) => (
                                <Link key={bot._id} href={`/bot-profiles/${bot._id}`} className="block rounded-lg border border-gray-100 p-4 hover:border-brand-200 dark:border-gray-800 dark:hover:border-brand-800">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="font-semibold text-gray-950 dark:text-white">{bot.name}</div>
                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{bot.platform} · {(bot.symbols ?? []).filter((s) => s.enabled).length} symbol</div>
                                        </div>
                                        <StatusBadge value={bot.status} />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Sức khỏe hệ thống</h2>
                    <div className="mt-4 space-y-4">
                        <HealthIndicator health={metrics.activeAccounts > 0 ? "healthy" : "warning"} label={`${metrics.activeAccounts} tài khoản đang hoạt động`} />
                        <HealthIndicator health={metrics.runtimeErrors ? "error" : "healthy"} label={metrics.runtimeErrors ? "Có lỗi runtime cần xem" : "Không có lỗi runtime gần đây"} />
                        <HealthIndicator health="healthy" label="Giao dịch chỉ chạy khi account đã xác minh và bật quyền giao dịch" />
                        <p className="rounded-lg bg-sky-50 p-3 text-sm leading-6 text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
                            Context confidence chỉ đo độ chắc chắn phân loại bối cảnh, không phải xác suất thắng.
                        </p>
                    </div>
                </section>
            </div>

            <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Quyết định mới nhất</h2>
                    <Link href="/bot-decisions" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Mở nhật ký</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                            <tr>
                                <th className="py-3">Thời gian</th>
                                <th className="py-3">Symbol</th>
                                <th className="py-3">Scenario</th>
                                <th className="py-3">Trigger</th>
                                <th className="py-3">Quyết định</th>
                                <th className="py-3">Risk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {state.decisions.length === 0 ? (
                                <tr><td colSpan={6} className="py-5 text-gray-500 dark:text-gray-400">Chưa có tín hiệu giao dịch mới.</td></tr>
                            ) : state.decisions.map((decision) => (
                                <tr key={decision._id ?? `${decision.symbol}-${decision.evaluatedCandleOpenTime}`}>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">{decision.createdAt ? new Date(decision.createdAt).toLocaleString() : "-"}</td>
                                    <td className="py-3 font-medium text-gray-950 dark:text-white">{decision.symbol}</td>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">{decision.scenario}</td>
                                    <td className="py-3 text-gray-600 dark:text-gray-300">{decision.triggerStatus}</td>
                                    <td className="py-3"><DecisionBadge decision={decision.decision} /></td>
                                    <td className="py-3"><StatusBadge value={decision.riskEvaluation?.status ?? "NO_TRADE"} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
