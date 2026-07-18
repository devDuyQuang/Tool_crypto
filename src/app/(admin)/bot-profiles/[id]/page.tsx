"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { DecisionBadge } from "@/components/product/DecisionBadge";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { MetricCard } from "@/components/product/MetricCard";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { SymbolContextCard } from "@/components/product/SymbolContextCard";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotProfile, DecisionJournal, DecisionOutcome, DecisionPerformance, MarketContextRunResult, ObservationRunResult, RuntimeRun, RuntimeStatus } from "@/types/botProfile";

const inputClass = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";
const tabs = ["Tổng quan", "Thị trường", "Quyết định", "Kết quả mô phỏng", "Rủi ro", "Hoạt động", "Cấu hình"] as const;
type Tab = typeof tabs[number];

function describeScenario(scenario?: string) {
    if (!scenario || scenario === "NO_SCENARIO") return "Chưa có kịch bản đủ điều kiện";
    if (scenario.includes("BULLISH")) return "Sweep xuống dưới vùng thanh khoản và đóng lại phía trên";
    if (scenario.includes("BEARISH")) return "Sweep lên trên vùng thanh khoản và đóng lại phía dưới";
    if (scenario.includes("TREND_PULLBACK")) return "Theo xu hướng sau nhịp pullback";
    if (scenario.includes("BREAKOUT_EXPANSION")) return "Breakout mở rộng rồi retest";
    return scenario;
}

function describeDecision(decision?: string) {
    if (decision === "LONG") return "Có thiết lập mua giả lập, chỉ ghi journal";
    if (decision === "SHORT") return "Có thiết lập bán giả lập, chỉ ghi journal";
    return "Không giao dịch là kết quả bình thường khi điều kiện chưa đủ";
}

export default function BotProfileDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const [profile, setProfile] = useState<BotProfile | null>(null);
    const [symbol, setSymbol] = useState("");
    const [priority, setPriority] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [observing, setObserving] = useState(false);
    const [evaluatingContext, setEvaluatingContext] = useState(false);
    const [observation, setObservation] = useState<ObservationRunResult | null>(null);
    const [marketContext, setMarketContext] = useState<MarketContextRunResult | null>(null);
    const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus | null>(null);
    const [runtimeRuns, setRuntimeRuns] = useState<RuntimeRun[]>([]);
    const [decisions, setDecisions] = useState<DecisionJournal[]>([]);
    const [outcomes, setOutcomes] = useState<DecisionOutcome[]>([]);
    const [performance, setPerformance] = useState<DecisionPerformance | null>(null);
    const [runtimeBusy, setRuntimeBusy] = useState(false);
    const [outcomeBusy, setOutcomeBusy] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("Tổng quan");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const nextProfile = await botProfilesService.findOne(id);
            setProfile(nextProfile);
            await Promise.all([
                botProfilesService.runtimeStatus(id).then(setRuntimeStatus).catch(() => setRuntimeStatus(null)),
                botProfilesService.decisions(id).then(setDecisions).catch(() => setDecisions([])),
                botProfilesService.runtimeRuns(id).then(setRuntimeRuns).catch(() => setRuntimeRuns([])),
                botProfilesService.outcomes(id).then(setOutcomes).catch(() => setOutcomes([])),
                botProfilesService.performance(id).then(setPerformance).catch(() => setPerformance(null)),
            ]);
        } catch (e: any) {
            const message = e?.message || "Không tải được bot";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const enabledSymbols = useMemo(() => (profile?.symbols ?? []).filter((row) => row.enabled), [profile]);
    const naturalDecisions = useMemo(() => decisions.filter((row) => row.sourceType !== "ACCEPTANCE" && row.decisionScope !== "ACCEPTANCE"), [decisions]);
    const latestDecision = naturalDecisions[0] ?? runtimeStatus?.latestDecisions?.[0] ?? null;
    const opportunityRows = useMemo(() => naturalDecisions.filter((row) => row.prices?.opportunityScore != null).slice(0, 12), [naturalDecisions]);
    const outcomeByDecision = useMemo(() => new Map(outcomes.map((outcome) => [outcome.decisionJournalId, outcome])), [outcomes]);
    const archived = profile?.status === "ARCHIVED";
    const canStart = !archived && profile?.status !== "RUNNING";

    const addSymbol = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!symbol.trim()) return;
        try {
            await botProfilesService.addSymbol(id, { symbol, priority, enabled: true });
            setSymbol("");
            setPriority((value) => value + 1);
            toast.success("Đã thêm symbol");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Không thêm được symbol");
        }
    };

    const setEnabled = async (symbolId: string, enabled: boolean) => {
        try {
            await botProfilesService.updateSymbol(id, symbolId, { enabled });
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Không cập nhật được symbol");
        }
    };

    const removeSymbol = async (symbolId: string) => {
        if (!confirm("Xóa symbol khỏi bot này?")) return;
        try {
            await botProfilesService.removeSymbol(id, symbolId);
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Không xóa được symbol");
        }
    };

    const archive = async () => {
        if (!confirm("Lưu trữ bot này? Bot sẽ không còn được START.")) return;
        try {
            await botProfilesService.archive(id);
            toast.success("Đã lưu trữ bot");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Lưu trữ thất bại");
        }
    };

    const observeOnce = async () => {
        setObserving(true);
        try {
            const result = await botProfilesService.observeOnce(id);
            setObservation(result);
            setActiveTab("Thị trường");
            toast.success("Đã quan sát dữ liệu một lần");
        } catch (e: any) {
            toast.error(e?.message || "Quan sát dữ liệu thất bại");
        } finally {
            setObserving(false);
        }
    };

    const evaluateContextOnce = async () => {
        setEvaluatingContext(true);
        try {
            const result = await botProfilesService.evaluateContextOnce(id);
            setMarketContext(result);
            setActiveTab("Thị trường");
            toast.success("Đã đánh giá bối cảnh");
        } catch (e: any) {
            toast.error(e?.message || "Đánh giá bối cảnh thất bại");
        } finally {
            setEvaluatingContext(false);
        }
    };

    const runtimeAction = async (action: "start" | "pause" | "stop" | "runDryOnce") => {
        setRuntimeBusy(true);
        try {
            await botProfilesService[action](id);
            toast.success(action === "runDryOnce" ? "Đã chạy một vòng runtime" : "Đã cập nhật runtime");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Runtime action thất bại");
        } finally {
            setRuntimeBusy(false);
        }
    };

    const evaluateOutcomes = async () => {
        setOutcomeBusy(true);
        try {
            const result = await botProfilesService.evaluateOutcomes(id);
            toast.success(`Đã đánh giá ${result.totalEvaluated} decision`);
            const [nextOutcomes, nextPerformance] = await Promise.all([
                botProfilesService.outcomes(id),
                botProfilesService.performance(id),
            ]);
            setOutcomes(nextOutcomes);
            setPerformance(nextPerformance);
            setActiveTab("Kết quả mô phỏng");
        } catch (e: any) {
            toast.error(e?.message || "Đánh giá outcome thất bại");
        } finally {
            setOutcomeBusy(false);
        }
    };

    const replay = async () => {
        setOutcomeBusy(true);
        try {
            const result = await botProfilesService.replay(id);
            setPerformance(result);
            setActiveTab("Kết quả mô phỏng");
            toast.success("Đã chạy historical replay read-only");
        } catch (e: any) {
            toast.error(e?.message || "Replay thất bại");
        } finally {
            setOutcomeBusy(false);
        }
    };

    if (loading) return <LoadingState label="Đang tải bot..." />;
    if (error) return <ErrorState message={error} action={<button onClick={load} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Tải lại</button>} />;
    if (!profile) return <EmptyState title="Không tìm thấy bot" />;

    return (
        <div className="space-y-6">
            <PageHeader
                backHref="/bot-profiles"
                eyebrow="Bot tự động"
                title={profile.name}
                description={profile.description || "Console vận hành bot. Execution chỉ đi qua runtime/OMS; màn hình này không đặt lệnh thủ công."}
                actions={
                    <>
                        <Link href={`/bot-profiles/${id}/edit`} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.05]">Chỉnh sửa</Link>
                        <button disabled={!canStart || runtimeBusy} onClick={() => runtimeAction("start")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700">START</button>
                        <button disabled={archived || runtimeBusy} onClick={() => runtimeAction("pause")} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 disabled:opacity-50 dark:border-amber-800 dark:text-amber-300">PAUSE</button>
                        <button disabled={archived || runtimeBusy} onClick={() => runtimeAction("stop")} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200">STOP</button>
                    </>
                }
            />

            <div className="flex flex-wrap gap-2">
                <StatusBadge value={profile.status} />
                <StatusBadge value={profile.platform} />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Symbol enabled" value={enabledSymbols.length} helper={enabledSymbols.map((item) => item.symbol).join(", ") || "Chưa có"} tone="dry" />
                <MetricCard label="Runtime" value={runtimeStatus?.status || profile.status} helper={runtimeStatus?.runtimeEnabled ? "AUTO_RUNTIME_V2_ENABLED=true" : "Runtime flag đang khóa"} tone={runtimeStatus?.status === "RUNNING" ? "success" : "neutral"} />
                <MetricCard label="Quyết định mới nhất" value={latestDecision ? <DecisionBadge decision={latestDecision.decision} /> : "Chưa có"} helper={latestDecision ? `${latestDecision.symbol}${latestDecision.isOldDecision ? " · Quyết định cũ" : ""}` : "Chưa có tín hiệu giao dịch mới"} />
                <MetricCard label="Lỗi runtime" value={runtimeStatus?.lastRun?.errorSummaries?.length || 0} helper="Lần quét gần nhất" tone={runtimeStatus?.lastRun?.errorSummaries?.length ? "error" : "success"} />
            </div>

            <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                <div className="flex min-w-max gap-2">
                    {tabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-3 py-3 text-sm font-medium ${activeTab === tab ? "border-brand-600 text-brand-700 dark:text-brand-300" : "border-transparent text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === "Tổng quan" ? (
                <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Trạng thái vận hành</h2>
                        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                            <div><b>Tài khoản:</b> {profile.platform}</div>
                            <div><b>Last run:</b> {runtimeStatus?.lastRun?.startedAt ? new Date(runtimeStatus.lastRun.startedAt).toLocaleString() : "-"}</div>
                            <div><b>Next scan:</b> {runtimeStatus?.nextScan ? new Date(runtimeStatus.nextScan).toLocaleString() : "-"}</div>
                            <div><b>LONG:</b> {runtimeStatus?.decisionCounts?.LONG || 0}</div>
                            <div><b>SHORT:</b> {runtimeStatus?.decisionCounts?.SHORT || 0}</div>
                            <div><b>NO_TRADE:</b> {runtimeStatus?.decisionCounts?.NO_TRADE || 0}</div>
                            <div><b>Strategy:</b> Scalping V2</div>
                            <div><b>Scope:</b> {runtimeStatus?.baseline?.scope ?? "ALL_HISTORY"}</div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <button disabled={archived || observing} onClick={observeOnce} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Quan sát dữ liệu một lần</button>
                            <button disabled={archived || evaluatingContext} onClick={evaluateContextOnce} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200">Đánh giá bối cảnh một lần</button>
                            <button disabled={!canStart || runtimeBusy} onClick={() => runtimeAction("runDryOnce")} className="rounded-lg border border-sky-200 px-4 py-2 text-sm font-medium text-sky-700 disabled:opacity-50 dark:border-sky-800 dark:text-sky-300">Chạy một vòng kiểm tra</button>
                            <button disabled={outcomeBusy} onClick={evaluateOutcomes} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300">Đánh giá kết quả mô phỏng</button>
                        </div>
                    </section>
                    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Quyết định gần nhất</h2>
                        {latestDecision ? (
                            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                                <div className="flex items-center gap-2"><DecisionBadge decision={latestDecision.decision} /><span>{describeDecision(latestDecision.decision)}</span></div>
                                {latestDecision.isOldDecision ? <StatusBadge value="Quyết định cũ" tone="warning" /> : null}
                                <div><b>Symbol:</b> {latestDecision.symbol}</div>
                                <div><b>Scenario:</b> {describeScenario(latestDecision.scenario)}</div>
                                <div><b>Strategy:</b> {latestDecision.prices?.strategyKey ?? "-"}</div>
                                <div><b>Opportunity:</b> {latestDecision.prices?.opportunityScore ?? "-"} / 100</div>
                                <div><b>Trigger:</b> {latestDecision.triggerStatus}</div>
                                <div><b>Risk:</b> {latestDecision.riskEvaluation?.status ?? "-"}</div>
                            </div>
                        ) : <EmptyState title="Chưa có tín hiệu giao dịch mới" description="Runtime chưa ghi natural decision nào sau baseline hiện tại." />}
                    </section>
                </div>
            ) : null}

            {activeTab === "Thị trường" ? (
                <div className="space-y-5">
                    <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Opportunity Scanner</h2>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Xếp hạng scanner cho các mã đang có sóng. Điểm này dùng để chọn top symbol cho runtime, không phải tín hiệu thắng.</p>
                            </div>
                            <StatusBadge value="READ_ONLY" tone="dry" />
                        </div>
                        {opportunityRows.length ? (
                            <div className="mt-4 overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                        <tr><th className="p-3">Rank</th><th className="p-3">Symbol</th><th className="p-3">Có sóng</th><th className="p-3">Strategy</th><th className="p-3">Setup</th><th className="p-3">Trigger</th><th className="p-3">Spread bps</th><th className="p-3">ATR%</th><th className="p-3">Expansion</th><th className="p-3">Decision</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {opportunityRows.map((row) => (
                                            <tr key={`${row._id || row.symbol}-${row.evaluatedCandleOpenTime}`}>
                                                <td className="p-3">{row.prices?.opportunityRank ?? "-"}</td>
                                                <td className="p-3 font-medium text-gray-950 dark:text-white">{row.symbol}</td>
                                                <td className="p-3">{row.prices?.opportunityScore ?? "-"} / 100</td>
                                                <td className="p-3">{row.prices?.strategyKey ?? "-"}</td>
                                                <td className="p-3">{row.prices?.setupScore != null ? Math.round(row.prices.setupScore * 100) : "-"}</td>
                                                <td className="p-3">{row.prices?.triggerScore != null ? Math.round(row.prices.triggerScore * 100) : "-"}</td>
                                                <td className="p-3">{row.prices?.opportunityMetrics?.spreadBps ?? "-"}</td>
                                                <td className="p-3">{row.prices?.opportunityMetrics?.atrPercent ?? "-"}</td>
                                                <td className="p-3">{row.prices?.opportunityMetrics?.volatilityExpansion ?? "-"}</td>
                                                <td className="p-3"><DecisionBadge decision={row.decision} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <EmptyState title="Chưa có tín hiệu giao dịch mới" description="Runtime chưa có natural decision sau baseline để tính opportunity vận hành." />}
                    </section>

                    {marketContext?.results?.length ? (
                        <div className="grid gap-4 lg:grid-cols-3">
                            {marketContext.results.map((context) => <SymbolContextCard key={`${context.symbol}-${context.snapshotId}`} context={context} />)}
                        </div>
                    ) : <EmptyState title="Chưa có Market Context trong phiên giao diện này" description="Bấm Đánh giá bối cảnh một lần hoặc xem Decision Journal để biết context đã dùng trong runtime." />}

                    {observation ? (
                        <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                    <tr><th className="p-3">Symbol</th><th className="p-3">Instrument</th><th className="p-3">Mark</th><th className="p-3">H4</th><th className="p-3">H1</th><th className="p-3">M15</th><th className="p-3">Freshness</th><th className="p-3">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {observation.results.map((row) => (
                                        <tr key={row.symbol}>
                                            <td className="p-3 font-medium text-gray-950 dark:text-white">{row.symbol}</td>
                                            <td className="p-3">{row.instrument?.status || "-"}</td>
                                            <td className="p-3">{row.markPrice ?? "-"}</td>
                                            <td className="p-3">{row.latestClosedCandles?.H4?.close ?? "-"}</td>
                                            <td className="p-3">{row.latestClosedCandles?.H1?.close ?? "-"}</td>
                                            <td className="p-3">{row.latestClosedCandles?.M15?.close ?? "-"}</td>
                                            <td className="p-3">{Object.entries(row.freshness || {}).map(([tf, value]) => `${tf}:${value.stale ? "STALE" : "OK"}`).join(" · ")}</td>
                                            <td className="p-3"><StatusBadge value={row.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    ) : null}
                </div>
            ) : null}

            {activeTab === "Quyết định" ? (
                <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <table className="w-full min-w-[1500px] text-left text-sm">
                        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                            <tr>
                                <th className="p-3">Thời gian</th><th className="p-3">Symbol</th><th className="p-3">Context</th><th className="p-3">Strategy</th><th className="p-3">Scenario</th><th className="p-3">Setup</th><th className="p-3">Trigger</th><th className="p-3">Opportunity</th><th className="p-3">Quyết định</th><th className="p-3">Risk</th><th className="p-3">Outcome</th><th className="p-3">Net R</th><th className="p-3">MFE</th><th className="p-3">MAE</th><th className="p-3">Entry</th><th className="p-3">Invalidation</th><th className="p-3">Target</th><th className="p-3">R:R</th><th className="p-3">Lý do</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {decisions.length === 0 ? (
                                <tr><td className="p-5 text-gray-500" colSpan={19}>Chưa có Decision Journal.</td></tr>
                            ) : decisions.map((row) => {
                                const outcome = row._id ? outcomeByDecision.get(row._id) : undefined;
                                return (
                                    <tr key={row._id || `${row.symbol}-${row.evaluatedCandleOpenTime}`}>
                                        <td className="p-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : row.evaluatedCandleOpenTime}</td>
                                        <td className="p-3 font-medium text-gray-950 dark:text-white">{row.symbol}</td>
                                        <td className="p-3">{row.marketContextId?.slice?.(-8) || "-"}</td>
                                        <td className="p-3">{row.prices?.strategyKey ?? "-"}</td>
                                        <td className="p-3">{describeScenario(row.scenario)}</td>
                                        <td className="p-3">{row.prices?.setupScore != null ? Math.round(row.prices.setupScore * 100) : "-"}</td>
                                        <td className="p-3">{row.triggerStatus}</td>
                                        <td className="p-3">{row.prices?.opportunityScore ?? "-"}</td>
                                        <td className="p-3"><DecisionBadge decision={row.decision} /></td>
                                        <td className="p-3"><StatusBadge value={row.riskEvaluation?.status ?? "NO_TRADE"} /></td>
                                        <td className="p-3"><StatusBadge value={outcome?.status ?? (row.decision === "NO_TRADE" ? "NO_TRADE" : "PENDING")} /></td>
                                        <td className="p-3">{outcome?.netR?.toFixed?.(2) ?? "-"}</td>
                                        <td className="p-3">{outcome?.MFE?.r?.toFixed?.(2) ?? "-"}</td>
                                        <td className="p-3">{outcome?.MAE?.r?.toFixed?.(2) ?? "-"}</td>
                                        <td className="p-3">{row.prices?.proposedEntry ?? "-"}</td>
                                        <td className="p-3">{row.prices?.invalidation ?? "-"}</td>
                                        <td className="p-3">{row.prices?.targets?.[0] ?? "-"}</td>
                                        <td className="p-3">{row.riskEvaluation?.estimatedRiskReward?.toFixed?.(2) ?? "-"}</td>
                                        <td className="p-3">{row.reasonCodes.slice(0, 3).join(", ") || "-"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            ) : null}

            {activeTab === "Kết quả mô phỏng" ? (
                <section className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                        <div>
                            Đây là kết quả mô phỏng từ candle đã đóng, không phải PnL thật và không có lệnh nào được đặt.
                        </div>
                        <div className="flex gap-2">
                            <button disabled={outcomeBusy} onClick={evaluateOutcomes} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Cập nhật outcome</button>
                            <button disabled={outcomeBusy} onClick={replay} className="rounded-lg border border-sky-300 px-4 py-2 text-sm font-medium text-sky-800 disabled:opacity-50 dark:border-sky-800 dark:text-sky-200">Replay read-only</button>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard label="Decisions evaluated" value={performance?.totals.totalEvaluations ?? outcomes.length} helper={`${performance?.totals.sampleSize ?? 0} mẫu performance chính`} />
                        <MetricCard label="Entry touched" value={performance?.totals.entryTouched ?? outcomes.filter((item) => item.entryTouchedAt).length} />
                        <MetricCard label="Win / Loss" value={`${performance?.totals.targetHit ?? 0} / ${performance?.totals.stopHit ?? 0}`} helper={`Win rate ${Math.round((performance?.totals.winRate ?? 0) * 100)}%`} />
                        <MetricCard label="Net R" value={performance?.totals.netR?.toFixed?.(2) ?? "0.00"} helper={`Fee R ${performance?.totals.totalFeeR?.toFixed?.(2) ?? "0.00"}`} tone={(performance?.totals.netR ?? 0) >= 0 ? "success" : "error"} />
                        <MetricCard label="Expectancy" value={performance?.totals.expectancyR?.toFixed?.(2) ?? "0.00"} />
                        <MetricCard label="Profit factor" value={performance?.totals.profitFactor == null ? "∞" : performance.totals.profitFactor.toFixed?.(2)} />
                        <MetricCard label="Max drawdown" value={performance?.totals.maxDrawdownR?.toFixed?.(2) ?? "0.00"} tone="warning" />
                        <MetricCard label="Ambiguous" value={performance?.totals.ambiguous ?? outcomes.filter((item) => item.status === "AMBIGUOUS").length} helper="Loại khỏi performance chính" tone="warning" />
                    </div>
                    {performance?.totals.sampleSizeWarning ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                            Sample size còn nhỏ. Không nên kết luận strategy chỉ từ nhóm dữ liệu này.
                        </div>
                    ) : null}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h3 className="font-semibold text-gray-950 dark:text-white">Replay theo strategy</h3>
                            <div className="mt-3 space-y-2 text-sm">
                                {Object.entries(performance?.byStrategy ?? {}).slice(0, 8).map(([strategy, row]: any) => (
                                    <div key={strategy} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                        <span className="truncate">{strategy}</span>
                                        <span className="font-medium">{row.netR?.toFixed?.(2) ?? "0.00"} R · {row.decisions ?? 0} decision</span>
                                    </div>
                                ))}
                                {!Object.keys(performance?.byStrategy ?? {}).length ? <div className="text-gray-500">Chưa có replay theo strategy.</div> : null}
                            </div>
                        </section>
                        <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h3 className="font-semibold text-gray-950 dark:text-white">Replay theo khung giờ</h3>
                            <div className="mt-3 space-y-2 text-sm">
                                {Object.entries(performance?.byHour ?? {}).slice(-8).map(([hour, row]: any) => (
                                    <div key={hour} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2 dark:bg-white/[0.04]">
                                        <span>{hour}:00Z</span>
                                        <span className="font-medium">{row.netR?.toFixed?.(2) ?? "0.00"} R · {row.decisions ?? 0} decision</span>
                                    </div>
                                ))}
                                {!Object.keys(performance?.byHour ?? {}).length ? <div className="text-gray-500">Chưa có replay theo giờ.</div> : null}
                            </div>
                        </section>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                <tr><th className="p-3">Symbol</th><th className="p-3">Direction</th><th className="p-3">Status</th><th className="p-3">Entry</th><th className="p-3">Exit</th><th className="p-3">Gross R</th><th className="p-3">Fee R</th><th className="p-3">Slippage R</th><th className="p-3">Net R</th><th className="p-3">MFE R</th><th className="p-3">MAE R</th><th className="p-3">Reason</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {outcomes.length === 0 ? (
                                    <tr><td colSpan={12} className="p-5 text-gray-500">Chưa có outcome. Bấm Cập nhật outcome để đánh giá các LONG/SHORT đã có.</td></tr>
                                ) : outcomes.map((outcome) => (
                                    <tr key={outcome._id ?? outcome.decisionJournalId}>
                                        <td className="p-3 font-medium text-gray-950 dark:text-white">{outcome.symbol}</td>
                                        <td className="p-3"><DecisionBadge decision={outcome.direction} /></td>
                                        <td className="p-3"><StatusBadge value={outcome.status} /></td>
                                        <td className="p-3">{outcome.proposedEntry ?? "-"}</td>
                                        <td className="p-3">{outcome.exitPrice ?? "-"}</td>
                                        <td className="p-3">{outcome.grossR?.toFixed?.(2)}</td>
                                        <td className="p-3">{outcome.feeR?.toFixed?.(2)}</td>
                                        <td className="p-3">{outcome.slippageR?.toFixed?.(2)}</td>
                                        <td className="p-3">{outcome.netR?.toFixed?.(2)}</td>
                                        <td className="p-3">{outcome.MFE?.r?.toFixed?.(2) ?? "-"}</td>
                                        <td className="p-3">{outcome.MAE?.r?.toFixed?.(2) ?? "-"}</td>
                                        <td className="p-3">{outcome.reasonCodes?.slice(0, 3).join(", ") || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {activeTab === "Rủi ro" ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Risk mỗi lệnh" value={`${profile.riskPerTradePercent}%`} helper="Dùng cho runtime quantity giả định" />
                    <MetricCard label="Daily loss limit" value={`${profile.dailyLossLimitPercent}%`} />
                    <MetricCard label="Max positions" value={profile.maxConcurrentPositions} />
                    <MetricCard label="Max leverage" value={`${profile.maxLeverage}x`} />
                </section>
            ) : null}

            {activeTab === "Hoạt động" ? (
                <section className="space-y-4">
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                <tr><th className="p-3">Run</th><th className="p-3">Bắt đầu</th><th className="p-3">Kết thúc</th><th className="p-3">Duration</th><th className="p-3">Status</th><th className="p-3">Symbols</th><th className="p-3">Decisions</th><th className="p-3">Errors</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {runtimeRuns.length === 0 ? (
                                    <tr><td className="p-5 text-gray-500" colSpan={8}>Chưa có lịch sử lần quét.</td></tr>
                                ) : runtimeRuns.map((run, index) => (
                                    <tr key={run._id ?? run.runId ?? index}>
                                        <td className="p-3 font-mono text-xs">{run.runId ?? run._id ?? "-"}</td>
                                        <td className="p-3">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}</td>
                                        <td className="p-3">{run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}</td>
                                        <td className="p-3">{run.totalDurationMs != null ? `${Math.round(run.totalDurationMs / 1000)}s` : "-"}</td>
                                        <td className="p-3"><StatusBadge value={run.status} /></td>
                                        <td className="p-3">{run.symbolsSucceeded ?? 0}/{run.symbolsRequested?.length ?? run.symbolsRequested ?? 0}</td>
                                        <td className="p-3">L {run.decisionsLong ?? 0} · S {run.decisionsShort ?? 0} · N {run.decisionsNoTrade ?? 0}</td>
                                        <td className="p-3">{run.errorSummaries?.length ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="font-semibold text-gray-950 dark:text-white">Audit cấu hình</h2>
                        <div className="mt-3 divide-y divide-gray-100 text-sm dark:divide-gray-800">
                            {(profile.audits || []).length === 0 ? <div className="py-3 text-gray-500">Chưa có audit.</div> : profile.audits?.map((audit) => (
                                <div key={audit._id} className="py-3">
                                    <span className="font-medium">{audit.action}</span> <span className="text-gray-500">{audit.createdAt ? new Date(audit.createdAt).toLocaleString() : ""}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </section>
            ) : null}

            {activeTab === "Cấu hình" ? (
                <section className="space-y-5">
                    {!archived ? (
                        <form onSubmit={addSymbol} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:grid-cols-[1fr_120px_auto]">
                            <input className={inputClass} placeholder="BTCUSDT" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
                            <input className={inputClass} type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
                            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Lưu symbol</button>
                        </form>
                    ) : null}
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                <tr><th className="p-3">Symbol</th><th className="p-3">Enabled</th><th className="p-3">Priority</th><th className="p-3">Cooldown</th><th className="p-3 text-right">Thao tác</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {profile.symbols.length === 0 ? (
                                    <tr><td className="p-5 text-gray-500" colSpan={5}>Chưa có symbol.</td></tr>
                                ) : profile.symbols.map((row) => (
                                    <tr key={row._id}>
                                        <td className="p-3 font-medium text-gray-950 dark:text-white">{row.symbol}</td>
                                        <td className="p-3"><StatusBadge value={row.enabled ? "ENABLED" : "DISABLED"} /></td>
                                        <td className="p-3">{row.priority}</td>
                                        <td className="p-3">{row.cooldownMinutes ?? "-"}</td>
                                        <td className="p-3">
                                            <div className="flex justify-end gap-3">
                                                <button disabled={archived} className="text-brand-600 disabled:opacity-50" onClick={() => setEnabled(row._id, !row.enabled)}>{row.enabled ? "Tắt" : "Bật"}</button>
                                                <button disabled={archived} className="text-rose-600 disabled:opacity-50" onClick={() => removeSymbol(row._id)}>Xóa khỏi bot</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end">
                        <button disabled={archived} onClick={archive} className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300">Lưu trữ bot</button>
                    </div>
                </section>
            ) : null}

            <details className="rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-white/[0.03]">
                <summary className="cursor-pointer font-semibold text-gray-950 dark:text-white">Chi tiết kỹ thuật</summary>
                <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
                    {JSON.stringify({ latestDecisionReasonCodes: latestDecision?.reasonCodes ?? [], warnings: latestDecision?.warnings ?? [], marketContext }, null, 2)}
                </pre>
            </details>
        </div>
    );
}
