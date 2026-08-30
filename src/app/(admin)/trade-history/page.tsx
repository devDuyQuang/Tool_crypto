"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DecisionBadge } from "@/components/product/DecisionBadge";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { formatNullableValue } from "@/components/product/decisionPresenter";
import { formatDateTime } from "@/components/product/humanLabels";
import { executedTradesService } from "@/services/executedTrades.service";
import type { PageMeta } from "@/types/common";
import type { ExecutedTrade } from "@/types/executedTrade";

const EMPTY_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 1 };

export default function TradeHistoryPage() {
    const [rows, setRows] = useState<ExecutedTrade[]>([]);
    const [meta, setMeta] = useState<PageMeta>(EMPTY_META);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await executedTradesService.findAll({ page, limit: 20 });
            setRows(result.data ?? []);
            setMeta(result.meta ?? EMPTY_META);
        } catch (e: any) {
            const message = e?.message || "Không tải được lịch sử giao dịch";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Giao dịch"
                title="Lịch sử giao dịch"
                description="Chỉ hiển thị ExecutedTrade thật từ lệnh đã khớp và vị thế đã được xác nhận. Không trộn dữ liệu replay/DecisionOutcome."
            />

            {loading ? <LoadingState label="Đang tải lịch sử giao dịch..." /> : null}
            {error ? <ErrorState message={error} action={<button onClick={load} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white">Tải lại</button>} /> : null}

            {!loading && !error && rows.length === 0 ? (
                <EmptyState
                    title="Chưa có giao dịch thật"
                    description="Khi OKX Demo có fill thật và ledger được ghi, lịch sử sẽ hiển thị entry, exit, bảo vệ, phí và PnL nếu sàn trả dữ liệu đáng tin cậy."
                />
            ) : null}

            {!loading && !error && rows.length > 0 ? (
                <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <table className="w-full min-w-[1180px] text-left text-sm">
                        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                            <tr>
                                <th className="p-3">Entry</th>
                                <th className="p-3">Bot</th>
                                <th className="p-3">Sàn</th>
                                <th className="p-3">Symbol</th>
                                <th className="p-3">Hướng</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Entry px</th>
                                <th className="p-3">Exit</th>
                                <th className="p-3">Exit reason</th>
                                <th className="p-3">Fees</th>
                                <th className="p-3">Net PnL</th>
                                <th className="p-3">R</th>
                                <th className="p-3">Bảo vệ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rows.map((trade) => (
                                <tr key={trade.id}>
                                    <td className="p-3">{formatDateTime(trade.entryTime)}</td>
                                    <td className="p-3 font-mono text-xs">{trade.botProfileId.slice(-8)}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-gray-950 dark:text-white">{trade.exchange}</div>
                                        <div className="text-xs text-gray-500">{trade.connectionTarget}</div>
                                    </td>
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
                </section>
            ) : null}

            {!loading && !error && meta.totalPages > 1 ? (
                <div className="flex items-center justify-end gap-2">
                    <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-800">Trước</button>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trang {meta.page}/{meta.totalPages}</div>
                    <button disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-800">Sau</button>
                </div>
            ) : null}
        </div>
    );
}
