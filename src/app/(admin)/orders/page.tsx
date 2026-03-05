"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

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
    const [status, setStatus] = useState<PlanStatus | "">("");

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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Lịch sử lệnh</h1>
                {/* ✅ Không còn Sync page / Create Order */}
            </div>

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
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-200">
                            <tr className="text-left">
                                <th className="p-3">Cặp</th>
                                <th className="p-3">Chiều</th>
                                <th className="p-3">Loại</th>
                                <th className="p-3">Giá vào</th>
                                <th className="p-3">Cắt lỗ</th>
                                <th className="p-3">Chốt lời</th>
                                <th className="p-3">Trạng thái</th>
                                <th className="p-3">Sàn</th>
                                <th className="p-3">Lần sync gần nhất</th>
                                <th className="p-3">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {rows.map((r) => {
                                const id = safeId(r);
                                const syncing = !!syncingIds[id];
                                const syncable = isSyncable(r);

                                return (
                                    <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                        <td className="p-3">{r.symbol}</td>
                                        <td className="p-3">{r.side}</td>
                                        <td className="p-3">{r.orderType}</td>
                                        <td className="p-3">{r.entry}</td>
                                        <td className="p-3">{r.sl}</td>
                                        <td className="p-3">{Array.isArray(r.tp) ? r.tp.join(", ") : "-"}</td>
                                        <td className="p-3">{r.status}</td>

                                        <td className="p-3">
                                            <span className={badgeClass(r.exchangeStatus)}>{r.exchangeStatus ?? "-"}</span>
                                        </td>

                                        <td className="p-3">
                                            {r.lastSyncAt ? new Date(r.lastSyncAt).toLocaleString() : "-"}
                                        </td>

                                        <td className="p-3">
                                            <button
                                                className="text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                                                disabled={loading || syncing || !syncable}
                                                onClick={() => onSyncOne(id)}
                                                title={!syncable ? "Chỉ sync lệnh đã EXECUTED" : syncing ? "Đang đồng bộ..." : "Đồng bộ sàn"}
                                            >
                                                {syncing ? "Đang sync..." : "Sync"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-3 text-gray-600 dark:text-gray-400" colSpan={10}>
                                        Không có lệnh nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}