"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { MetricCard } from "@/components/product/MetricCard";
import { PageHeader } from "@/components/product/PageHeader";
import {
    activePositionText,
    formatMoneyValue,
    formatTradeCount,
    lastActivityText,
} from "@/components/product/decisionPresenter";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotProfile, RuntimeStatus } from "@/types/botProfile";

type DashboardState = {
    bots: BotProfile[];
    accounts: Account[];
    runtimeByBot: Record<string, RuntimeStatus | null>;
};

function isSmokeProfile(bot: BotProfile) {
    const name = bot.name.toLowerCase();
    return name.includes("smoke") || name.includes("test") || name.includes("phase");
}

export default function DashboardPage() {
    const [state, setState] = useState<DashboardState>({ bots: [], accounts: [], runtimeByBot: {} });
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
            const bots = (Array.isArray((botRes as any).data) ? (botRes as any).data as BotProfile[] : []).filter((bot) => !isSmokeProfile(bot));
            const accounts = Array.isArray((accountRes as any).data) ? (accountRes as any).data as Account[] : [];
            const runtimeEntries = await Promise.all(
                bots.slice(0, 20).map(async (bot) => {
                    try {
                        return [bot._id, await botProfilesService.runtimeStatus(bot._id)] as const;
                    } catch {
                        return [bot._id, null] as const;
                    }
                })
            );
            setState({ bots, accounts, runtimeByBot: Object.fromEntries(runtimeEntries) });
        } catch (e: any) {
            const message = e?.message || "Không tải được tổng quan";
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
        const runtimes = Object.values(state.runtimeByBot);
        const loadedRuntimeCount = runtimes.filter(Boolean).length;
        const openPositions = runtimes.reduce((sum, runtime) => sum + (runtime?.protectionSummary?.activePositions?.length ?? 0), 0);
        const tradesToday = runtimes.reduce((sum, runtime) => sum + Number(runtime?.today?.tradesToday ?? 0), 0);
        return { running, openPositions, loadedRuntimeCount, tradesToday };
    }, [state]);

    if (loading) return <LoadingState label="Đang tải tổng quan..." />;
    if (error) return <ErrorState message={error} action={<button onClick={load} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Tải lại</button>} />;

    const hasBot = state.bots.length > 0;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Tổng quan"
                title="Auto Trading Console"
                description="Luồng chính: kết nối sàn, tạo bot, bật bot và theo dõi kết quả."
                actions={<Link href={hasBot ? "/bot-profiles" : "/accounts/create"} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">{hasBot ? "Xem bot" : "Kết nối tài khoản sàn"}</Link>}
            />

            {!hasBot ? (
                <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="grid w-full grid-cols-1 gap-3">
                        {[
                            ["1", "Kết nối tài khoản sàn", "Thêm tài khoản và kiểm tra kết nối."],
                            ["2", "Tạo bot", "Chọn coin, số tiền mỗi lệnh và mức rủi ro."],
                            ["3", "Bật bot", "Bot sẽ tự quét tín hiệu theo cấu hình an toàn."],
                        ].map(([step, title, text]) => (
                            <div key={step} className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{step}</div>
                                <h2 className="mt-4 font-semibold text-gray-950 dark:text-white">{title}</h2>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <>
                    <div className="grid w-full grid-cols-1 gap-3">
                        <MetricCard label="Lời/lỗ hôm nay" value={formatMoneyValue(null)} tone="neutral" />
                        <MetricCard label="Vị thế đang mở" value={metrics.loadedRuntimeCount ? metrics.openPositions : "Chưa xác định"} helper={`Từ runtime status ${metrics.loadedRuntimeCount}/${state.bots.length} bot`} tone={metrics.openPositions ? "warning" : metrics.loadedRuntimeCount ? "success" : "dry"} />
                        <MetricCard label="Bot đang chạy" value={metrics.running} tone="success" />
                        <MetricCard label="Giao dịch hôm nay" value={formatTradeCount(metrics.tradesToday)} tone="neutral" />
                    </div>

                    <section className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Bot gần đây</h2>
                            <Link href="/bot-profiles" className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Xem tất cả</Link>
                        </div>
                        <div className="space-y-3">
                            {state.bots.slice(0, 5).map((bot) => {
                                const runtime = state.runtimeByBot[bot._id];
                                const latest = runtime?.latestDecisions?.[0] ?? null;
                                const isRunning = bot.status === "RUNNING";
                                const simpleStatus = isRunning ? "Đang hoạt động" : "Đã dừng";
                                return (
                                    <Link key={bot._id} href={`/bot-profiles/${bot._id}`} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-gray-100 p-3 hover:border-brand-200 dark:border-gray-800 dark:hover:border-brand-800">
                                        <div className="min-w-0">
                                            <div className="truncate font-semibold text-gray-950 dark:text-white">{bot.name}</div>
                                            <div className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{(bot.symbols ?? []).filter((s) => s.enabled).map((s) => s.symbol).join(", ") || "Chưa chọn coin"}</div>
                                        </div>
                                        <div className="flex min-w-[104px] flex-col items-end text-right">
                                            <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">Trạng thái</div>
                                            <span className={`mt-1 inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${isRunning ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300"}`}>
                                                {simpleStatus}
                                            </span>
                                        </div>
                                        <div className="min-w-0 rounded-lg bg-gray-50 p-2 dark:bg-white/[0.04]">
                                            <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">Vị thế</div>
                                            <div className="mt-1 truncate text-sm font-medium text-gray-950 dark:text-white">{activePositionText(runtime)}</div>
                                        </div>
                                        <div className="min-w-0 rounded-lg bg-gray-50 p-2 text-right dark:bg-white/[0.04]">
                                            <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-400">Hoạt động</div>
                                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{lastActivityText(runtime, latest)}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            {state.accounts.length === 0 ? (
                <EmptyState title="Chưa có tài khoản sàn" description="Hãy kết nối tài khoản sàn trước khi tạo bot." />
            ) : null}
        </div>
    );
}
