"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DecisionBadge } from "@/components/product/DecisionBadge";
import { EmptyState } from "@/components/product/EmptyState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { formatNumber, presentDecision, productStateTone, reasonText } from "@/components/product/decisionPresenter";
import { formatDateTime, humanLabel } from "@/components/product/humanLabels";
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
                toast.error(e?.message || "Không tải được nhật ký quyết định");
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
                eyebrow="Nâng cao"
                title="Nhật ký quyết định"
                description="Bản đọc dành cho vận hành: ưu tiên bot đang làm gì, raw code nằm trong chi tiết kỹ thuật."
            />
            {rows.length === 0 ? <EmptyState title="Chưa có nhật ký quyết định" description="Khi bot chạy và ghi nhận thị trường, các quyết định sẽ xuất hiện ở đây." /> : (
                <div className="space-y-3">
                    {rows.map((row) => {
                        const presented = presentDecision(row, null, { ignoreStale: true });
                        const setup = row.prices?.setupScore != null ? Math.round(row.prices.setupScore * 100) : null;
                        return (
                            <article key={row._id ?? `${row.profileId}-${row.symbol}-${row.evaluatedCandleOpenTime}`} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                                <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_auto] lg:items-start">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link href={`/bot-profiles/${row.profileId}`} className="font-semibold text-gray-950 hover:text-brand-600 dark:text-white">{row.symbol}</Link>
                                            <DecisionBadge decision={row.decision} />
                                            <StatusBadge value={presented.title} tone={productStateTone(presented.state)} />
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">{row.botName ?? row.profileId} · {formatDateTime(row.createdAt ?? row.evaluatedCandleOpenTime)}</div>
                                    </div>
                                    <div className="text-sm leading-6 text-gray-700 dark:text-gray-200">
                                        <div className="font-medium text-gray-950 dark:text-white">{presented.summary}</div>
                                        <div className="mt-1 text-gray-500 dark:text-gray-400">{reasonText(row.reasonCodes?.[0])}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-52">
                                        <div>
                                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Setup</div>
                                            <div className="font-semibold text-gray-950 dark:text-white">{setup == null ? "-" : `${setup}/100`}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Opportunity</div>
                                            <div className="font-semibold text-gray-950 dark:text-white">{row.prices?.opportunityScore ?? "-"}</div>
                                        </div>
                                    </div>
                                </div>

                                <details className="mt-4 rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-800">
                                    <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-200">Xem chi tiết</summary>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        <div><b>Strategy:</b> {row.prices?.strategyKey ?? "-"}</div>
                                        <div><b>Scenario:</b> {row.scenario}</div>
                                        <div><b>Trigger:</b> {humanLabel(row.triggerStatus)}</div>
                                        <div><b>Risk:</b> {humanLabel(row.riskEvaluation?.status)}</div>
                                        <div><b>Entry:</b> {formatNumber(row.prices?.proposedEntry)}</div>
                                        <div><b>Invalidation:</b> {formatNumber(row.prices?.invalidation)}</div>
                                        <div><b>Target:</b> {formatNumber(row.prices?.targets?.[0])}</div>
                                        <div><b>R:R:</b> {row.riskEvaluation?.estimatedRiskReward?.toFixed?.(2) ?? "-"}</div>
                                    </div>
                                    <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]">
                                        <div className="font-semibold text-gray-950 dark:text-white">Chi tiết kỹ thuật</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(row.reasonCodes ?? []).length ? row.reasonCodes.map((code) => (
                                                <span key={code} className="rounded-md bg-white px-2 py-1 font-mono text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">{code}</span>
                                            )) : <span className="text-gray-500">Không có raw reason code.</span>}
                                        </div>
                                    </div>
                                </details>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
