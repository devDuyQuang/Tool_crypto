"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { BotCard } from "@/components/product/BotCard";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { accountEnvironment } from "@/components/product/decisionPresenter";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import { productRiskPreset } from "@/services/productBot.service";
import type { Account } from "@/types/account";
import type { BotProfile, DecisionJournal, ProductBotDefaults, ProductRiskLevel, RuntimeStatus } from "@/types/botProfile";

function isSmokeProfile(bot: BotProfile) {
    const name = bot.name.toLowerCase();
    return name.includes("smoke") || name.includes("phase") || name.includes("test") || name.includes("fakecoin");
}

export default function BotProfilesPage() {
    const [rows, setRows] = useState<BotProfile[]>([]);
    const [runtimeByBot, setRuntimeByBot] = useState<Record<string, RuntimeStatus | null>>({});
    const [decisionByBot, setDecisionByBot] = useState<Record<string, DecisionJournal | null>>({});
    const [accountById, setAccountById] = useState<Record<string, Account | null>>({});
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [productDefaults, setProductDefaults] = useState<ProductBotDefaults | null>(null);
    const showSmoke = false;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [res, accountRes] = await Promise.all([
                botProfilesService.findAll({ page: 1, limit: 100, includeArchived: true }),
                accountsService.findAll({ page: 1, limit: 500 }).catch(() => null),
            ]);
            const bots = Array.isArray((res as any).data) ? (res as any).data as BotProfile[] : [];
            setRows(bots);
            const accounts = accountRes && Array.isArray((accountRes as any).data) ? (accountRes as any).data as Account[] : [];
            setAccounts(accounts);
            setAccountById(Object.fromEntries(accounts.map((account) => [String(account._id ?? account.id), account])));
            botProfilesService.okxDemoAutoProductDefaults()
                .then((defaults) => setProductDefaults(defaults))
                .catch(() => null);

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

    const updateBotConfig = async (bot: BotProfile, changes: { accountId?: string; riskLevel?: ProductRiskLevel; positionSizeUsdt?: number }) => {
        const payload: Record<string, unknown> = {};
        if (changes.accountId) payload.accountId = changes.accountId;
        if (changes.riskLevel) {
            const risk = productRiskPreset(productDefaults, changes.riskLevel);
            payload.riskPerTradePercent = risk.riskPerTradePercent;
            payload.dailyLossLimitPercent = risk.dailyLossLimitPercent;
        }
        if (changes.positionSizeUsdt !== undefined) {
            payload.maxNotionalPerTradeUsdt = changes.positionSizeUsdt;
        }
        try {
            await botProfilesService.update(bot._id, payload);
            toast.success("Đã cập nhật bot");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Không cập nhật được bot");
        }
    };

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
                eyebrow="Bot của tôi"
                title="Bot của tôi"
                description="Chọn tài khoản, chọn mức rủi ro, bật bot và theo dõi kết quả."
                actions={<Link href="/bot-profiles/create" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Tạo bot</Link>}
            />

            {visibleRows.length === 0 ? (
                <EmptyState
                    title="Chưa có bot vận hành"
                    description="Tạo bot đầu tiên, kết nối tài khoản sàn và bật bot khi bạn sẵn sàng."
                    action={<Link href="/bot-profiles/create" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Tạo bot đầu tiên</Link>}
                />
            ) : (
                <div className="space-y-2">
                    {visibleRows.map((bot) => (
                        <BotCard
                            key={bot._id}
                            bot={bot}
                            runtime={runtimeByBot[bot._id]}
                            latestDecision={decisionByBot[bot._id]}
                            environmentSource={accountEnvironment(accountById[bot.accountId]) ?? null}
                            accounts={accounts}
                            productDefaults={productDefaults}
                            onAccountChange={(accountId) => updateBotConfig(bot, { accountId })}
                            onRiskLevelChange={(riskLevel) => updateBotConfig(bot, { riskLevel })}
                            onPositionSizeChange={(positionSizeUsdt) => updateBotConfig(bot, { positionSizeUsdt })}
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
