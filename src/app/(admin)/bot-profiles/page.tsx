"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { BotCard } from "@/components/product/BotCard";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { MetricCard } from "@/components/product/MetricCard";
import { PageHeader } from "@/components/product/PageHeader";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotProfile, DecisionJournal, RuntimeStatus } from "@/types/botProfile";

function isSmokeProfile(bot: BotProfile) {
    const name = bot.name.toLowerCase();
    return name.includes("smoke") || name.includes("phase") || name.includes("test") || name.includes("fakecoin");
}

export default function BotProfilesPage() {
    const [rows, setRows] = useState<BotProfile[]>([]);
    const [runtimeByBot, setRuntimeByBot] = useState<Record<string, RuntimeStatus | null>>({});
    const [decisionByBot, setDecisionByBot] = useState<Record<string, DecisionJournal | null>>({});
    const [showSmoke, setShowSmoke] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await botProfilesService.findAll({ page: 1, limit: 100, includeArchived: true });
            const bots = Array.isArray((res as any).data) ? (res as any).data as BotProfile[] : [];
            setRows(bots);

            const visible = bots.filter((bot) => showSmoke || !isSmokeProfile(bot)).slice(0, 40);
            const runtimeEntries = await Promise.all(
                visible.map(async (bot) => {
                    try {
                        return [bot._id, await botProfilesService.runtimeStatus(bot._id)] as const;
                    } catch {
                        return [bot._id, null] as const;
                    }
                })
            );
            const decisionEntries = await Promise.all(
                visible.map(async (bot) => {
                    try {
                        const decisions = await botProfilesService.decisions(bot._id);
                        return [bot._id, decisions[0] ?? null] as const;
                    } catch {
                        return [bot._id, null] as const;
                    }
                })
            );
            setRuntimeByBot(Object.fromEntries(runtimeEntries));
            setDecisionByBot(Object.fromEntries(decisionEntries));
        } catch (e: any) {
            const message = e?.message || "Không tải được danh sách bot";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSmoke]);

    const visibleRows = useMemo(() => rows.filter((bot) => showSmoke || !isSmokeProfile(bot)), [rows, showSmoke]);
    const stats = useMemo(() => ({
        running: visibleRows.filter((bot) => bot.status === "RUNNING").length,
        paused: visibleRows.filter((bot) => bot.status === "PAUSED").length,
        stopped: visibleRows.filter((bot) => bot.status === "STOPPED").length,
        symbols: visibleRows.reduce((sum, bot) => sum + (bot.symbols ?? []).filter((symbol) => symbol.enabled).length, 0),
    }), [visibleRows]);

    const runAction = async (bot: BotProfile, action: "start" | "pause" | "stop") => {
        try {
            if (action === "start") await botProfilesService.start(bot._id);
            if (action === "pause") await botProfilesService.pause(bot._id);
            if (action === "stop") await botProfilesService.stop(bot._id);
            toast.success("Đã cập nhật trạng thái bot");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Không cập nhật được trạng thái bot");
        }
    };

    if (loading) return <LoadingState label="Đang tải danh sách bot..." />;
    if (error) return <ErrorState message={error} action={<button onClick={load} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Tải lại</button>} />;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Bot tự động"
                title="Danh sách bot"
                description="Quản lý các BotProfile, theo dõi trạng thái runtime và xem quyết định gần nhất. Profile smoke/test được ẩn mặc định để màn hình vận hành sạch hơn."
                actions={<Link href="/bot-profiles/create" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Tạo bot</Link>}
            />

            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="RUNNING" value={stats.running} tone="success" />
                <MetricCard label="PAUSED" value={stats.paused} tone="warning" />
                <MetricCard label="DRAFT/STOPPED" value={stats.stopped} />
                <MetricCard label="Symbol enabled" value={stats.symbols} tone="dry" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div>
                    <div className="font-medium text-gray-950 dark:text-white">Bộ lọc vận hành</div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ẩn profile smoke/test khỏi danh sách chính.</div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    <input type="checkbox" checked={showSmoke} onChange={(event) => setShowSmoke(event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                    Hiện smoke/test
                </label>
            </div>

            {visibleRows.length === 0 ? (
                <EmptyState
                    title="Chưa có bot vận hành"
                    description="Tạo BotProfile trước, sau đó thêm symbol và START khi runtime flag đã được bật."
                    action={<Link href="/bot-profiles/create" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Tạo bot đầu tiên</Link>}
                />
            ) : (
                <div className="space-y-4">
                    {visibleRows.map((bot) => (
                        <BotCard
                            key={bot._id}
                            bot={bot}
                            runtime={runtimeByBot[bot._id]}
                            latestDecision={decisionByBot[bot._id]}
                            onStart={() => runAction(bot, "start")}
                            onPause={() => runAction(bot, "pause")}
                            onStop={() => runAction(bot, "stop")}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
