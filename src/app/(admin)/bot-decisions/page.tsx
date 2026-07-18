"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DecisionBadge } from "@/components/product/DecisionBadge";
import { EmptyState } from "@/components/product/EmptyState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotProfile, DecisionJournal } from "@/types/botProfile";

type Row = DecisionJournal & { botName?: string };

export default function BotDecisionsPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const profileRes = await botProfilesService.findAll({ page: 1, limit: 100, includeArchived: true });
                const profiles = Array.isArray((profileRes as any).data) ? (profileRes as any).data as BotProfile[] : [];
                const lists = await Promise.all(profiles.map(async (profile) => {
                    try {
                        const decisions = await botProfilesService.decisions(profile._id, { includeAcceptance: true });
                        return decisions.map((decision) => ({ ...decision, botName: profile.name }));
                    } catch {
                        return [];
                    }
                }));
                setRows(lists.flat().sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 200));
            } catch (e: any) {
                toast.error(e?.message || "Không tải được Decision Journal");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingState label="Đang tải nhật ký quyết định..." />;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Bot tự động"
                title="Nhật ký quyết định"
                description="Lưu cả LONG, SHORT, NO_TRADE và acceptance kỹ thuật. Các dòng ACCEPTANCE không được tính vào vận hành tự nhiên."
            />
            {rows.length === 0 ? <EmptyState title="Chưa có decision journal" /> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <table className="w-full min-w-[1320px] text-left text-sm">
                        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                            <tr><th className="p-3">Thời gian</th><th className="p-3">Scope</th><th className="p-3">Bot</th><th className="p-3">Symbol</th><th className="p-3">Context</th><th className="p-3">Strategy</th><th className="p-3">Scenario</th><th className="p-3">Setup</th><th className="p-3">Trigger</th><th className="p-3">Opportunity</th><th className="p-3">Decision</th><th className="p-3">Risk</th><th className="p-3">Entry</th><th className="p-3">Invalidation</th><th className="p-3">R:R</th><th className="p-3">Lý do</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rows.map((row) => (
                                <tr key={row._id ?? `${row.profileId}-${row.symbol}-${row.evaluatedCandleOpenTime}`}>
                                    <td className="p-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : row.evaluatedCandleOpenTime}</td>
                                    <td className="p-3"><StatusBadge value={row.sourceType ?? row.decisionScope ?? "NATURAL"} tone={row.sourceType === "ACCEPTANCE" || row.decisionScope === "ACCEPTANCE" ? "warning" : "success"} /></td>
                                    <td className="p-3"><Link href={`/bot-profiles/${row.profileId}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">{row.botName ?? row.profileId}</Link></td>
                                    <td className="p-3 font-medium text-gray-950 dark:text-white">{row.symbol}</td>
                                    <td className="p-3">{row.marketContextId?.slice?.(-8) ?? "-"}</td>
                                    <td className="p-3">{row.prices?.strategyKey ?? "-"}</td>
                                    <td className="p-3">{row.scenario}</td>
                                    <td className="p-3">{row.prices?.setupScore != null ? Math.round(row.prices.setupScore * 100) : "-"}</td>
                                    <td className="p-3">{row.triggerStatus}</td>
                                    <td className="p-3">{row.prices?.opportunityScore ?? "-"}</td>
                                    <td className="p-3"><DecisionBadge decision={row.decision} /></td>
                                    <td className="p-3"><StatusBadge value={row.riskEvaluation?.status ?? "NO_TRADE"} /></td>
                                    <td className="p-3">{row.prices?.proposedEntry ?? "-"}</td>
                                    <td className="p-3">{row.prices?.invalidation ?? "-"}</td>
                                    <td className="p-3">{row.riskEvaluation?.estimatedRiskReward?.toFixed?.(2) ?? "-"}</td>
                                    <td className="p-3">{row.reasonCodes.slice(0, 4).join(", ") || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
