"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { DecisionBadge } from "@/components/product/DecisionBadge";
import { EmptyState } from "@/components/product/EmptyState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { environmentLabel, environmentTone, formatMoneyValue, formatNumber } from "@/components/product/decisionPresenter";

import {
    ordersService,
    type OrderPlan,
    type PlanStatus,
    type ExchangeStatus,
} from "@/services/orders.service";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { getSocket } from "@/lib/socket";

type Meta = { page: number; limit: number; total: number; totalPages: number };
const EMPTY_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };

function safeId(x: any) {
    return x?._id ?? x?.id ?? "";
}

function badgeClass(v?: string) {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs border";
    if (!v)
        return `${base} border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800/50`;
    if (v === "OPEN")
        return `${base} border-green-300 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-200 dark:bg-green-900/30`;
    if (v === "CLOSED")
        return `${base} border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800/50`;
    if (v === "PENDING")
        return `${base} border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-200 dark:bg-yellow-900/30`;
    return `${base} border-gray-300 text-gray-700 bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800/50`;
}

function protectionLabel(value?: string | null) {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "PROTECTED") return "Đã có SL/TP";
    if (normalized === "UNPROTECTED") return "Thiếu bảo vệ";
    if (normalized === "REPAIR_REQUIRED" || normalized === "RECONCILIATION_REQUIRED") return "Cần kiểm tra";
    if (!normalized || normalized === "NOT_STARTED") return "Chưa bắt đầu";
    return value ?? "Chưa rõ";
}

function orderUserState(row: OrderPlan) {
    const status = String(row.status ?? "").toUpperCase();
    const exchange = String(row.exchangeStatus ?? "").toUpperCase();
    const protection = String(row.protectionState ?? "").toUpperCase();
    if (protection === "UNPROTECTED" || protection === "REPAIR_REQUIRED" || protection === "RECONCILIATION_REQUIRED") {
        return { label: "Thiếu bảo vệ", tone: "error" as const };
    }
    if (exchange === "CLOSED" || status === "EXPIRED") return { label: "Đã đóng hoặc hết hạn", tone: "stopped" as const };
    if (exchange === "OPEN") return { label: "Đang mở theo sàn", tone: "success" as const };
    if (status === "PREVIEW") return { label: "Đang chờ gửi lệnh", tone: "neutral" as const };
    if (status === "EXECUTED" && exchange === "PENDING") return { label: "Đã gửi lệnh, đang chờ đồng bộ", tone: "warning" as const };
    if (status === "EXECUTED") return { label: "Đã gửi lệnh", tone: "warning" as const };
    return { label: "Chưa xác định trạng thái", tone: "dry" as const };
}

function isSyncable(row: OrderPlan) {
    return row.status === "EXECUTED";
}
function shouldSyncRow(row: OrderPlan) {
    return row.status === "EXECUTED" && row.exchangeStatus !== "CLOSED";
}

export default function OrdersPage() {
    const [rows, setRows] = useState<OrderPlan[]>([]);
    const [meta, setMeta] = useState<Meta>(EMPTY_META);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<PlanStatus | "">("EXECUTED");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});
    const reqIdRef = useRef(0);

    const canPrev = page > 1;
    const canNext = page < (meta?.totalPages ?? 1);

    const [token, setToken] = useState<string | null>(null);
    useEffect(() => {
        setToken(localStorage.getItem("accessToken"));
    }, []);

    // nếu muốn room theo account: setAccountId từ select account
    const [accountId, setAccountId] = useState<string | undefined>(undefined);

    const patchRow = useCallback((planId: string, patch: Partial<OrderPlan>) => {
        setRows((prev) => prev.map((r) => (r._id === planId ? { ...r, ...patch } : r)));
    }, []);

    // ✅ realtime: update row
    useOrdersRealtime({
        token,
        accountId,
        onPlanUpdated: (plan) => {
            if (!plan?._id) return;
            setRows((prev) => {
                const idx = prev.findIndex((x) => x._id === plan._id);
                if (idx === -1) return prev;
                const next = [...prev];
                next[idx] = { ...next[idx], ...plan };
                return next;
            });
        },
    });

    const fetchData = useCallback(async () => {
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const res = await ordersService.findAll({
                page,
                limit,
                status: status || undefined,
                // accountId, // nếu backend support filter
            });

            if (reqId !== reqIdRef.current) return;

            setRows(Array.isArray(res?.data) ? res.data : []);
            setMeta({
                page: res?.meta?.page ?? page,
                limit: res?.meta?.limit ?? limit,
                total: res?.meta?.total ?? 0,
                totalPages: res?.meta?.totalPages ?? 1,
            });
        } catch (e: any) {
            if (reqId !== reqIdRef.current) return;
            setRows([]);
            setMeta({ page: 1, limit, total: 0, totalPages: 1 });
            setError(e?.message || "Tải danh sách lệnh thất bại");
        } finally {
            if (reqId === reqIdRef.current) setLoading(false);
        }
    }, [page, limit, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ✅ Polling fallback: chỉ poll khi socket không connect
    const pollingLockRef = useRef(false);
    useEffect(() => {
        if (!token) return;
        const s = getSocket(token);

        const tick = async () => {
            if (s.connected) return;
            if (pollingLockRef.current) return;
            pollingLockRef.current = true;
            try {
                await fetchData();
            } finally {
                pollingLockRef.current = false;
            }
        };

        const t = setInterval(tick, 7000);
        return () => clearInterval(t);
    }, [token, fetchData]);

    const onSyncOne = useCallback(
        async (planId: string) => {
            try {
                setSyncingIds((m) => ({ ...m, [planId]: true }));
                const res = await ordersService.sync(planId);

                patchRow(planId, {
                    exchangeStatus: (res.exchangeStatus as ExchangeStatus) ?? "PENDING",
                    lastSyncAt: res.lastSyncAt ?? new Date().toISOString(),
                    exchangeSnapshot: res.exchangeSnapshot,
                    ...(res.status ? { status: res.status as any } : {}),
                });

                toast.success("Đồng bộ OK ✅");
            } catch (e: any) {
                toast.error(e?.message || "Đồng bộ thất bại ❌");
            } finally {
                setSyncingIds((m) => {
                    const next = { ...m };
                    delete next[planId];
                    return next;
                });
            }
        },
        [patchRow]
    );

    // ✅ vẫn giữ logic này (không dùng UI nữa) — có thể thầy sẽ muốn dùng sau
    const onSyncPage = useCallback(async () => {
        const targets = rows.filter(shouldSyncRow).slice(0, 20);
        if (!targets.length) {
            toast.info("Trang này không có lệnh EXECUTED cần đồng bộ");
            return;
        }

        try {
            const ids = targets.map((r) => r._id);
            setSyncingIds((m) => {
                const next = { ...m };
                ids.forEach((id) => (next[id] = true));
                return next;
            });

            const results = await Promise.allSettled(targets.map((r) => ordersService.sync(r._id)));

            let ok = 0;
            results.forEach((rr, idx) => {
                const id = targets[idx]._id;
                if (rr.status === "fulfilled") {
                    ok++;
                    const res = rr.value;
                    patchRow(id, {
                        exchangeStatus: (res.exchangeStatus as ExchangeStatus) ?? "PENDING",
                        lastSyncAt: res.lastSyncAt ?? new Date().toISOString(),
                        exchangeSnapshot: res.exchangeSnapshot,
                        ...(res.status ? { status: res.status as any } : {}),
                    });
                }
            });

            toast.success(`Đã đồng bộ ${ok}/${targets.length} lệnh ✅`);
        } catch (e: any) {
            toast.error(e?.message || "Đồng bộ trang thất bại ❌");
        } finally {
            setSyncingIds({});
        }
    }, [rows, patchRow]);

    // ✅ BỎ 2 nút theo yêu cầu thầy: Sync page + Create Order
    // const headerRight = useMemo(() => { ... }, []);

    return (
        <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <PageHeader
                eyebrow="Giao dịch"
                title="Lệnh / vị thế hiện tại"
                description="Theo dõi order plan và trạng thái sàn hiện có. Chỉ khi backend/sàn báo OPEN mới hiển thị như vị thế đang mở."
            />

            <div className="flex flex-wrap gap-3 items-center">
                <select
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-900
          focus:outline-none focus:ring-2 focus:ring-brand-500/40
          dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    value={status}
                    onChange={(e) => {
                        setPage(1);
                        setStatus(e.target.value as any);
                    }}
                    disabled={loading}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PREVIEW">PREVIEW</option>
                    <option value="EXECUTED">EXECUTED</option>
                    <option value="EXPIRED">EXPIRED</option>
                </select>

                <select
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-900
          focus:outline-none focus:ring-2 focus:ring-brand-500/40
          dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    value={limit}
                    onChange={(e) => {
                        setPage(1);
                        setLimit(Number(e.target.value));
                    }}
                    disabled={loading}
                >
                    {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            {n}/trang
                        </option>
                    ))}
                </select>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tổng: {meta.total} • Trang {meta.page}/{meta.totalPages || 1}
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2
            text-gray-700 hover:bg-gray-50 disabled:opacity-50
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                        disabled={!canPrev || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Trang trước
                    </button>
                    <button
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2
            text-gray-700 hover:bg-gray-50 disabled:opacity-50
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                        disabled={!canNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Trang sau
                    </button>
                </div>
            </div>

            {loading && <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải...</p>}

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && (
                rows.length === 0 ? (
                    <EmptyState title="Không có lệnh/vị thế phù hợp bộ lọc" description="Không có OrderPlan nào ở trạng thái đang xem. Điều này không tự động chứng minh tài khoản không có vị thế nếu backend chưa đồng bộ." />
                ) : (
                    <div className="space-y-3">
                        {rows.map((r) => {
                                const id = safeId(r);
                                const syncing = !!syncingIds[id];
                                const syncable = isSyncable(r);
                                const userState = orderUserState(r);

                                return (
                                    <article key={id} className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-brand-200 hover:bg-gray-50/60 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-800 dark:hover:bg-white/[0.05]">
                                        <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.9fr)_minmax(360px,1.45fr)_minmax(190px,auto)] lg:items-start">
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="font-semibold text-gray-950 dark:text-white">{r.symbol}</h2>
                                                    <DecisionBadge decision={r.side} />
                                                    <StatusBadge value={environmentLabel(r.connectionTarget ?? r.environment)} tone={environmentTone(r.connectionTarget ?? r.environment)} />
                                                </div>
                                                <div><StatusBadge value={userState.label} tone={userState.tone} /></div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{r.orderType} · {r.marginType} · {r.leverage}x</div>
                                            </div>

                                            <div className="grid gap-3 text-sm md:grid-cols-3">
                                                <div><span className="text-gray-500 dark:text-gray-400">Size</span><div className="font-medium">{formatNumber(r.qty, 6)}</div></div>
                                                <div><span className="text-gray-500 dark:text-gray-400">Entry</span><div className="font-medium">{formatNumber(r.entry)}</div></div>
                                                <div><span className="text-gray-500 dark:text-gray-400">PnL thực tế</span><div className="font-medium">{formatMoneyValue(null)}</div></div>
                                                <div><span className="text-gray-500 dark:text-gray-400">Stop Loss</span><div className="font-medium">{formatNumber(r.sl)}</div></div>
                                                <div><span className="text-gray-500 dark:text-gray-400">Take Profit</span><div className="font-medium">{Array.isArray(r.tp) && r.tp.length ? r.tp.map((tp) => formatNumber(tp)).join(", ") : "-"}</div></div>
                                                <div><span className="text-gray-500 dark:text-gray-400">Bảo vệ</span><div className="font-medium">{protectionLabel(r.protectionState)}</div></div>
                                            </div>

                                            <div className="flex flex-col items-end text-right space-y-1">
                                                <span className={badgeClass(r.exchangeStatus)}>{r.exchangeStatus ?? "Chưa đồng bộ"}</span>
                                                <StatusBadge value={r.status} />
                                                <div className="flex items-center justify-end gap-1.5 text-gray-400 dark:text-gray-500">
                                                    <span className="text-xs">{r.lastSyncAt ? new Date(r.lastSyncAt).toLocaleString() : "Chưa đồng bộ"}</span>
                                                    <button
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                                                        disabled={loading || syncing || !syncable}
                                                        onClick={() => onSyncOne(id)}
                                                        title={!syncable ? "Chỉ sync lệnh đã EXECUTED" : syncing ? "Đang đồng bộ..." : "Đồng bộ sàn"}
                                                        aria-label="Đồng bộ sàn"
                                                    >
                                                        <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                                                    </button>
                                                </div>
                                                <details className="relative text-sm">
                                                    <summary className="cursor-pointer list-none text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white">Chi tiết kỹ thuật</summary>
                                                    <pre className="absolute right-0 z-20 mt-3 max-h-72 w-[min(720px,calc(100vw-2rem))] overflow-auto rounded-lg bg-gray-950 p-3 text-left text-xs text-gray-100 shadow-2xl">
                                                        {JSON.stringify({
                                                            orderPlanId: r._id,
                                                            accountId: r.accountId,
                                                            status: r.status,
                                                            exchangeStatus: r.exchangeStatus,
                                                            protectionState: r.protectionState,
                                                            sizingSnapshot: r.sizingSnapshot,
                                                            exchangeSnapshot: r.exchangeSnapshot,
                                                            metadata: r.metadata,
                                                            failureReason: r.failureReason,
                                                        }, null, 2)}
                                                    </pre>
                                                </details>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                    </div>
                )
            )}
        </div>
    );
}
