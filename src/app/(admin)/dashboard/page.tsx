"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { OrderPlan } from "@/services/orders.service";
import { ordersService } from "@/services/orders.service";

// ===== Helpers =====
type Stats = {
    totalPlans: number;

    byPlanStatus: Record<string, number>;
    byExchangeStatus: Record<string, number>;

    openOnExchange: number;
    closedOnExchange: number;
    pendingOnExchange: number;

    realizedPnl: number;
    unrealizedPnl: number;
    totalPnl: number;

    closedWin: number;
    closedLose: number;
    winRate: number;
};

function toNum(x: any): number {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
}

function pickNumber(obj: any, keys: string[]): number | null {
    if (!obj || typeof obj !== "object") return null;
    for (const k of keys) {
        const v = obj?.[k];
        const n = Number(v);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

function getPnlFromSnapshot(snapshot: any) {
    const realized =
        pickNumber(snapshot, [
            "realizedPnl",
            "realizedPnlUsd",
            "realized_profit",
            "realizedProfit",
            "profitRealized",
            "rpnl",
            "rPnl",
            "pnlRealized",
        ]) ?? 0;

    const unrealized =
        pickNumber(snapshot, [
            "unrealizedPnl",
            "unrealizedPnlUsd",
            "unrealized_profit",
            "unrealizedProfit",
            "profitUnrealized",
            "upnl",
            "uPnl",
            "pnlUnrealized",
        ]) ?? 0;

    const totalFallback =
        pickNumber(snapshot, ["pnl", "profit", "profitUsd", "pnlUsd", "totalPnl"]) ?? 0;

    const useFallback = realized === 0 && unrealized === 0 && totalFallback !== 0;

    return {
        realized: useFallback ? totalFallback : realized,
        unrealized,
    };
}

/**
 * ✅ Trạng thái sàn "thực tế" suy từ exchangeSnapshot:
 * - OPEN: còn positionAmt != 0 OR còn openOrders (NEW/PARTIALLY_FILLED)
 * - CLOSED: positionAmt == 0 AND không còn openOrders active
 * - PENDING: chưa có snapshot nhưng DB báo PENDING / hoặc status plan mới EXECUTED mà chưa sync
 * - fallback: dùng exchangeStatus DB nếu không có snapshot
 */
function deriveExchangeStatus(p: any): "OPEN" | "CLOSED" | "PENDING" | "UNKNOWN" {
    const snap = p?.exchangeSnapshot;
    const dbStatus = (p?.exchangeStatus ?? "UNKNOWN") as string;

    // Chưa sync snapshot lần nào
    if (!snap) {
        if (dbStatus === "PENDING") return "PENDING";
        // nếu plan EXECUTED mà chưa có snapshot => cũng coi là PENDING (đang chờ sync lên sàn)
        if (p?.status === "EXECUTED") return "PENDING";
        return (dbStatus as any) ?? "UNKNOWN";
    }

    const posAmt = Number(snap?.position?.positionAmt ?? 0);
    const openOrders = Array.isArray(snap?.openOrders) ? snap.openOrders : [];

    // position còn tồn tại => OPEN
    if (Number.isFinite(posAmt) && posAmt !== 0) return "OPEN";

    // openOrders còn NEW/PARTIALLY_FILLED => vẫn OPEN (vì lệnh còn treo)
    const hasActiveOrder = openOrders.some((o: any) => {
        const st = String(o?.status ?? "").toUpperCase();
        return st === "NEW" || st === "PARTIALLY_FILLED";
    });
    if (hasActiveOrder) return "OPEN";

    // sạch position + sạch open orders => CLOSED
    return "CLOSED";
}

async function fetchAllOrders(opts?: { pageSize?: number; maxPages?: number }) {
    const pageSize = opts?.pageSize ?? 50;
    const maxPages = opts?.maxPages ?? 50;

    let page = 1;
    let all: OrderPlan[] = [];

    while (page <= maxPages) {
        const res = await ordersService.findAll({ page, limit: pageSize });
        const data: OrderPlan[] = Array.isArray((res as any)?.data) ? (res as any).data : [];
        all = all.concat(data);

        const totalPages = (res as any)?.meta?.totalPages ?? 1;
        if (page >= totalPages) break;
        page += 1;
    }

    return all;
}

function formatMoney(n: number) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Card({
    title,
    value,
    sub,
}: {
    title: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
            {sub ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</div> : null}
        </div>
    );
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<OrderPlan[]>([]);
    const pollingLockRef = useRef(false);

    // ✅ Sync nhẹ các lệnh EXECUTED nhưng chưa "CLOSED thật" theo snapshot
    const syncLight = async (list: OrderPlan[]) => {
        const candidates = list.filter((o: any) => {
            if (o?.status !== "EXECUTED") return false;

            // Nếu có snapshot rồi => chỉ sync nếu vẫn chưa CLOSED theo snapshot
            const eff = deriveExchangeStatus(o);
            if (eff === "CLOSED") return false;

            // Nếu chưa có snapshot => sync để kéo snapshot về
            return true;
        });

        const targets = candidates.slice(0, 15);
        if (!targets.length) return;

        setSyncing(true);
        try {
            await Promise.allSettled(targets.map((o) => ordersService.sync(o._id)));
        } finally {
            setSyncing(false);
        }
    };

    const load = async (doSync = true) => {
        setLoading(true);
        setError(null);

        try {
            const all = await fetchAllOrders({ pageSize: 50, maxPages: 100 });

            if (doSync) {
                await syncLight(all);
                const after = await fetchAllOrders({ pageSize: 50, maxPages: 100 });
                setOrders(after);
            } else {
                setOrders(all);
            }
        } catch (e: any) {
            const msg = e?.message || "Load dashboard stats failed";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ polling 7s
    useEffect(() => {
        const t = setInterval(async () => {
            if (pollingLockRef.current) return;
            pollingLockRef.current = true;
            try {
                await load(true);
            } finally {
                pollingLockRef.current = false;
            }
        }, 7000);

        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stats: Stats = useMemo(() => {
        const byPlanStatus: Record<string, number> = {};
        const byExchangeStatus: Record<string, number> = {};

        let realizedPnl = 0;
        let unrealizedPnl = 0;

        let openOnExchange = 0;
        let closedOnExchange = 0;
        let pendingOnExchange = 0;

        let closedWin = 0;
        let closedLose = 0;

        for (const p of orders) {
            const planStatus = (p as any).status ?? "UNKNOWN";
            const exStatus = deriveExchangeStatus(p);

            byPlanStatus[planStatus] = (byPlanStatus[planStatus] ?? 0) + 1;
            byExchangeStatus[exStatus] = (byExchangeStatus[exStatus] ?? 0) + 1;

            if (exStatus === "OPEN") openOnExchange += 1;
            else if (exStatus === "CLOSED") closedOnExchange += 1;
            else if (exStatus === "PENDING") pendingOnExchange += 1;

            const snapshot = (p as any).exchangeSnapshot;
            const pnl = getPnlFromSnapshot(snapshot);

            if (exStatus === "CLOSED") {
                realizedPnl += toNum(pnl.realized);
                if (toNum(pnl.realized) >= 0) closedWin += 1;
                else closedLose += 1;
            } else if (exStatus === "OPEN") {
                unrealizedPnl += toNum(pnl.unrealized);
            } else {
                realizedPnl += toNum(pnl.realized);
                unrealizedPnl += toNum(pnl.unrealized);
            }
        }

        const totalPnl = realizedPnl + unrealizedPnl;
        const closedTotal = closedWin + closedLose;
        const winRate = closedTotal > 0 ? (closedWin / closedTotal) * 100 : 0;

        return {
            totalPlans: orders.length,
            byPlanStatus,
            byExchangeStatus,
            openOnExchange,
            closedOnExchange,
            pendingOnExchange,
            realizedPnl,
            unrealizedPnl,
            totalPnl,
            closedWin,
            closedLose,
            winRate,
        };
    }, [orders]);

    return (
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Bảng điều khiển</h1>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => load(true)}
                        disabled={loading || syncing}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              text-gray-700 hover:bg-gray-50 disabled:opacity-50
              dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                    >
                        {syncing ? "Đang sync..." : "Refresh + Sync"}
                    </button>
                </div>
            </div>

            {loading && <div className="text-sm text-gray-600 dark:text-gray-400">Đang tải thống kê...</div>}

            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <Card title="Tổng số lệnh" value={stats.totalPlans} />
                        <Card title="Lệnh đang mở trên sàn (OPEN*)" value={stats.openOnExchange} sub="OPEN = còn position hoặc còn order NEW/PARTIALLY_FILLED" />
                        <Card title="Lệnh đã đóng (CLOSED*)" value={stats.closedOnExchange} sub="CLOSED = position=0 và không còn openOrders active" />
                        <Card title="Chờ đồng bộ / PENDING" value={stats.pendingOnExchange} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <Card title="PnL đã chốt (Realized)" value={formatMoney(stats.realizedPnl)} sub="Tính từ exchangeSnapshot nếu có realizedPnl" />
                        <Card title="PnL đang chạy (Unrealized)" value={formatMoney(stats.unrealizedPnl)} sub="Tính từ exchangeSnapshot nếu có unrealizedPnl" />
                        <Card
                            title="PnL tổng"
                            value={formatMoney(stats.totalPnl)}
                            sub={`Winrate (CLOSED): ${stats.winRate.toFixed(1)}% • Win: ${stats.closedWin} / Lose: ${stats.closedLose}`}
                        />
                    </div>

                    {/* Optional: breakdown */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h2 className="text-lg font-semibold">Trạng thái theo Plan</h2>
                            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-200">
                                        <tr className="text-left">
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Số lượng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {Object.entries(stats.byPlanStatus).map(([k, v]) => (
                                            <tr key={k}>
                                                <td className="p-3">{k}</td>
                                                <td className="p-3">{v}</td>
                                            </tr>
                                        ))}
                                        {Object.keys(stats.byPlanStatus).length === 0 && (
                                            <tr>
                                                <td className="p-3 text-gray-600 dark:text-gray-400" colSpan={2}>
                                                    Không có dữ liệu
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h2 className="text-lg font-semibold">Trạng thái theo Sàn (Effective)</h2>
                            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-200">
                                        <tr className="text-left">
                                            <th className="p-3">ExchangeStatus</th>
                                            <th className="p-3">Số lượng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {Object.entries(stats.byExchangeStatus).map(([k, v]) => (
                                            <tr key={k}>
                                                <td className="p-3">{k}</td>
                                                <td className="p-3">{v}</td>
                                            </tr>
                                        ))}
                                        {Object.keys(stats.byExchangeStatus).length === 0 && (
                                            <tr>
                                                <td className="p-3 text-gray-600 dark:text-gray-400" colSpan={2}>
                                                    Không có dữ liệu
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}