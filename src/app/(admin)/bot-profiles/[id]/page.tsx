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
import {
    accountEnvironment,
    activePositionText,
    botEnvironment,
    environmentLabel,
    environmentTone,
    formatNullableValue,
    formatMoneyValue,
    formatNumber,
    presentDecision,
    productStatusMessage,
    productStateTone,
    reasonText,
    riskStatusText,
} from "@/components/product/decisionPresenter";
import { formatDateTime, humanLabel } from "@/components/product/humanLabels";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import { executedTradesService } from "@/services/executedTrades.service";
import type { Account } from "@/types/account";
import type { BotProfile, DecisionJournal, DecisionOutcome, DecisionPerformance, MarketContextRunResult, ObservationRunResult, RuntimeRun, RuntimeStatus } from "@/types/botProfile";
import type { ExecutedTrade } from "@/types/executedTrade";

const inputClass = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";
const tabs = ["Tổng quan", "Giao dịch", "Hiệu suất", "Cấu hình"] as const;
type Tab = string;

function describeScenario(scenario?: string) {
    if (!scenario || scenario === "NO_SCENARIO") return "Chưa có kịch bản đủ điều kiện";
    if (scenario.includes("BULLISH")) return "Sweep xuống dưới vùng thanh khoản và đóng lại phía trên";
    if (scenario.includes("BEARISH")) return "Sweep lên trên vùng thanh khoản và đóng lại phía dưới";
    if (scenario.includes("TREND_PULLBACK")) return "Theo xu hướng sau nhịp pullback";
    if (scenario.includes("BREAKOUT_EXPANSION")) return "Breakout mở rộng rồi retest";
    return scenario;
}

export default function BotProfileDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const [profile, setProfile] = useState<BotProfile | null>(null);
    const [account, setAccount] = useState<Account | null>(null);
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
    const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);
    const [runtimeBusy, setRuntimeBusy] = useState(false);
    const [outcomeBusy, setOutcomeBusy] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("Tổng quan");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const nextProfile = await botProfilesService.findOne(id);
            setProfile(nextProfile);
            accountsService.findOne(nextProfile.accountId).then(setAccount).catch(() => setAccount(null));
            await Promise.all([
                botProfilesService.runtimeStatus(id).then(setRuntimeStatus).catch(() => setRuntimeStatus(null)),
                botProfilesService.decisions(id).then(setDecisions).catch(() => setDecisions([])),
                botProfilesService.runtimeRuns(id).then(setRuntimeRuns).catch(() => setRuntimeRuns([])),
                botProfilesService.outcomes(id).then(setOutcomes).catch(() => setOutcomes([])),
                botProfilesService.performance(id).then(setPerformance).catch(() => setPerformance(null)),
                executedTradesService.findByBotProfile(id, { page: 1, limit: 30 }).then((res) => setExecutedTrades(res.data ?? [])).catch(() => setExecutedTrades([])),
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
    const openPositions = runtimeStatus?.protectionSummary?.activePositions ?? [];
    const presentedDecision = presentDecision(latestDecision, runtimeStatus);
    const today = runtimeStatus?.today;
    const universe = runtimeStatus?.universe;
    const latestClosedTrade = executedTrades.find((trade) => trade.status === "CLOSED");

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
            setActiveTab("Cấu hình");
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
            setActiveTab("Cấu hình");
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
            setActiveTab("Hiệu suất");
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
            setActiveTab("Hiệu suất");
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
                eyebrow="Bot của tôi"
                title={profile.name}
                description={`${profile.platform} · ${profile.symbolMode === "AUTO" ? `AUTO universe tối đa ${profile.maxAutoSymbols ?? 20} thị trường` : enabledSymbols.map((item) => item.symbol).join(", ") || "Chưa chọn coin"}`}
                actions={
                    profile.status === "RUNNING"
                        ? <button disabled={archived || runtimeBusy} onClick={() => runtimeAction("stop")} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">DỪNG BOT</button>
                        : <button disabled={!canStart || runtimeBusy} onClick={() => runtimeAction("start")} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700">BẬT BOT</button>
                }
            />

            <div className="flex flex-wrap gap-2">
                <StatusBadge value={profile.status} />
                <StatusBadge value={environmentLabel(accountEnvironment(account) ?? botEnvironment(profile))} tone={environmentTone(accountEnvironment(account) ?? botEnvironment(profile))} />
                {profile.description ? <span className="text-sm text-gray-500 dark:text-gray-400">{profile.description}</span> : null}
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
                <MetricCard label="Lời/lỗ gần nhất" value={formatMoneyValue(latestClosedTrade?.netPnl ?? null, "Chưa có dữ liệu")} helper="Chỉ tính ExecutedTrade thật" tone="dry" />
                <MetricCard label="Vị thế mở" value={activePositionText(runtimeStatus)} tone={openPositions.length ? "warning" : "success"} />
                <MetricCard label="Rủi ro hiện tại" value={riskStatusText(runtimeStatus)} tone={riskStatusText(runtimeStatus).includes("Cần") ? "error" : "success"} />
                <MetricCard label="Giao dịch hôm nay" value={today?.tradesToday ?? 0} helper="Không tính DecisionOutcome là trade thật" tone="dry" />
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
                <div className="space-y-6">
                    <section className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="flex w-full flex-col gap-3">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">BOT ĐANG LÀM GÌ?</h2>
                                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{presentedDecision.summary}</p>
                                <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-100">{productStatusMessage(profile, runtimeStatus)}</p>
                            </div>
                            <div className="min-w-0">
                                <StatusBadge value={presentedDecision.title} tone={productStateTone(presentedDecision.state)} />
                            </div>
                        </div>
                        <div className="mt-4 grid w-full grid-cols-1 gap-3 text-sm">
                            <div className="min-w-0 break-words"><b>Hoạt động:</b> {profile.status === "RUNNING" ? "Đang quét thị trường" : humanLabel(profile.status)}</div>
                            <div className="min-w-0 break-words"><b>Vị thế:</b> {activePositionText(runtimeStatus)}</div>
                            <div className="min-w-0 break-words"><b>Rủi ro:</b> {riskStatusText(runtimeStatus)}</div>
                        </div>
                        <div className="mt-5 grid w-full grid-cols-2 gap-3">
                            <MetricCard label="Universe" value={universe?.universeSize ?? enabledSymbols.length} helper={`${universe?.mode ?? profile.symbolMode ?? "MANUAL"} · ${universe?.source ?? "MANUAL"}`} />
                            <MetricCard label="Lượt scan hôm nay" value={today?.scansToday ?? 0} helper={`${today?.symbolsScannedToday ?? 0} symbol-scans`} />
                            <MetricCard label="Candidate / Setup" value={`${today?.candidatesToday ?? 0} / ${today?.setupsToday ?? 0}`} />
                            <MetricCard label="Entry ready / Trade" value={`${today?.entryReadyToday ?? 0} / ${today?.tradesToday ?? 0}`} />
                            <MetricCard label="Risk blocked" value={today?.riskBlockedToday ?? 0} tone={(today?.riskBlockedToday ?? 0) > 0 ? "warning" : "success"} />
                            <MetricCard label="Execution blocked" value={today?.executionBlockedToday ?? 0} tone={(today?.executionBlockedToday ?? 0) > 0 ? "warning" : "success"} />
                        </div>
                        {(today?.topNearMisses?.length ?? 0) > 0 ? (
                            <div className="mt-5 rounded-lg bg-gray-50 p-4 text-sm dark:bg-white/[0.04]">
                                <div className="font-semibold text-gray-950 dark:text-white">Gần đạt điều kiện</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {today?.topNearMisses.slice(0, 5).map((item: any, index) => {
                                        const label = Array.isArray(item) ? `${item[0]} · ${item[1]}` : `${item.reason ?? "-"} · ${item.count ?? 0}`;
                                        return <span key={`${label}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-200">{label}</span>;
                                    })}
                                </div>
                            </div>
                        ) : null}
                        {profile.status === "RUNNING" ? (
                            <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                                Hệ thống đang quét bối cảnh thị trường real-time và chờ tín hiệu đạt điểm chuẩn...
                            </div>
                        ) : null}
                    </section>

                    {openPositions.length ? (
                        <section className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Vị thế đang mở</h2>
                            <div className="mt-4 flex w-full flex-col space-y-2">
                                {openPositions.map((position) => (
                                    <div key={position.orderPlanId ?? position.symbol} className="flex w-full flex-col space-y-2 rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-800">
                                        <div className="flex w-full flex-col space-y-2">
                                            <div className="min-w-0 break-words font-semibold text-gray-950 dark:text-white">{position.symbol}</div>
                                            <div>
                                                <DecisionBadge decision={position.direction} />
                                            </div>
                                        </div>
                                        <div className="flex w-full flex-col space-y-2 text-gray-600 dark:text-gray-300">
                                            <div className="min-w-0 break-words">Size: <b>{formatNumber(position.quantity)}</b></div>
                                            <div className="min-w-0 break-words">Bảo vệ: <b>{humanLabel(position.protectionState)}</b></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <section className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                        <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Tín hiệu gần nhất</h2>
                        {latestDecision ? (
                            <div className="mt-4 flex w-full flex-col space-y-3 text-sm text-gray-700 dark:text-gray-200">
                                <div className="flex w-full flex-col gap-2">
                                    <DecisionBadge decision={latestDecision.decision} />
                                    <span className="min-w-0 break-words">{presentedDecision.title}</span>
                                </div>
                                {latestDecision.isOldDecision ? <StatusBadge value="Quyết định cũ" tone="warning" /> : null}
                                <div className="min-w-0 break-words"><b>Coin:</b> {latestDecision.symbol}</div>
                                <div className="min-w-0 break-words"><b>Diễn giải:</b> {presentedDecision.summary}</div>
                                <div className="min-w-0 break-words"><b>Điểm cơ hội:</b> {latestDecision.prices?.opportunityScore ?? "-"} / 100</div>
                                <div className="min-w-0 break-words"><b>Lý do chính:</b> {reasonText(latestDecision.reasonCodes?.[0])}</div>
                            </div>
                        ) : <EmptyState title="Đang quan sát thị trường" description="Bot chưa ghi nhận tín hiệu mới sau baseline hiện tại." />}
                    </section>
                </div>
            ) : null}

            {activeTab === "Giao dịch" ? (
                <section className="space-y-4">
                    <div className="grid w-full grid-cols-1 gap-3">
                        <MetricCard label="Vị thế đang mở" value={openPositions.length ? "Có" : "Không"} tone={openPositions.length ? "warning" : "success"} />
                        <MetricCard label="ExecutedTrade" value={executedTrades.length} helper="Ledger thực tế từ fill/position" />
                        <MetricCard label="PnL gần nhất" value={formatMoneyValue(latestClosedTrade?.netPnl ?? null, "Chưa có dữ liệu")} tone="dry" />
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <table className="w-full min-w-[1120px] text-left text-sm">
                            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                <tr><th className="p-3">Entry</th><th className="p-3">Coin</th><th className="p-3">Hướng</th><th className="p-3">Status</th><th className="p-3">Entry px</th><th className="p-3">Exit</th><th className="p-3">Exit reason</th><th className="p-3">Fees</th><th className="p-3">Net PnL</th><th className="p-3">R</th><th className="p-3">Bảo vệ</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {executedTrades.length === 0 ? (
                                    <tr><td colSpan={11} className="p-5 text-gray-500">Chưa có ExecutedTrade thật. DecisionOutcome/replay không được hiển thị như lịch sử giao dịch.</td></tr>
                                ) : executedTrades.map((trade) => (
                                    <tr key={trade.id}>
                                        <td className="p-3">{formatDateTime(trade.entryTime)}</td>
                                        <td className="p-3 font-medium text-gray-950 dark:text-white">{trade.symbol}</td>
                                        <td className="p-3"><DecisionBadge decision={trade.direction} /></td>
                                        <td className="p-3"><StatusBadge value={trade.status} /></td>
                                        <td className="p-3">{formatNullableValue(trade.entryAvgPrice)}</td>
                                        <td className="p-3">{trade.exitTime ? `${formatDateTime(trade.exitTime)} · ${formatNullableValue(trade.exitAvgPrice)}` : "Chưa có dữ liệu"}</td>
                                        <td className="p-3">{trade.exitReason ?? "Chưa có dữ liệu"}</td>
                                        <td className="p-3">{formatNullableValue(trade.fees, " USDT")}</td>
                                        <td className="p-3">{formatNullableValue(trade.netPnl, " USDT")}</td>
                                        <td className="p-3">{formatNullableValue(trade.realizedR, " R")}</td>
                                        <td className="p-3">{trade.protectionStatus ?? "Chưa có dữ liệu"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {activeTab === "Hiệu suất" ? (
                <section className="space-y-5">
                    <div className="grid w-full grid-cols-2 gap-3">
                        <MetricCard label="Lời/lỗ hôm nay" value="Chưa có nguồn PnL thực tế" helper="Hiệu suất bên dưới là outcome/replay" tone="dry" />
                        <MetricCard label="Tổng kết mô phỏng" value={performance?.totals.netR?.toFixed?.(2) ?? "0.00"} helper="Net R" tone={(performance?.totals.netR ?? 0) >= 0 ? "success" : "error"} />
                        <MetricCard label="Tỷ lệ thắng" value={`${Math.round((performance?.totals.winRate ?? 0) * 100)}%`} />
                        <MetricCard label="Số mẫu" value={performance?.totals.sampleSize ?? 0} />
                    </div>
                    <button disabled={outcomeBusy} onClick={evaluateOutcomes} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Cập nhật hiệu suất</button>
                </section>
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
                        <div className="grid w-full grid-cols-1 gap-4">
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
                    <div className="grid w-full grid-cols-2 gap-3">
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
                    <div className="grid w-full grid-cols-1 gap-4">
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
                <section className="grid w-full grid-cols-2 gap-3">
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
                        <form onSubmit={addSymbol} className="grid w-full grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
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

            {false ? (
                <section className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <button disabled={observing} onClick={observeOnce} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200">Quan sát thị trường một lần</button>
                        <button disabled={evaluatingContext} onClick={evaluateContextOnce} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200">Đánh giá context một lần</button>
                        <button disabled={runtimeBusy} onClick={() => runtimeAction("runDryOnce")} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200">Run dry once</button>
                        <button disabled={outcomeBusy} onClick={replay} className="rounded-lg border border-sky-300 px-4 py-2 text-sm font-medium text-sky-800 disabled:opacity-50 dark:border-sky-800 dark:text-sky-200">Replay read-only</button>
                    </div>

                    <details open className="rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-white/[0.03]">
                        <summary className="cursor-pointer font-semibold text-gray-950 dark:text-white">Chi tiết kỹ thuật</summary>
                        <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
                            {JSON.stringify({
                                runtimeStatus,
                                latestDecisionReasonCodes: latestDecision?.reasonCodes ?? [],
                                warnings: latestDecision?.warnings ?? [],
                                marketContext,
                                observation,
                            }, null, 2)}
                        </pre>
                    </details>
                </section>
            ) : null}
        </div>
    );
}
