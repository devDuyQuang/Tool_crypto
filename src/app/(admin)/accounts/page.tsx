"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ConfirmDialog } from "@/components/product/ConfirmDialog";
import { EmptyState } from "@/components/product/EmptyState";
import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotProfile } from "@/types/botProfile";
import type { Paginated } from "@/types/common";

function maskKey(key: string) {
    if (!key) return "-";
    if (key.length <= 8) return "****";
    return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

function accountId(account: Account) {
    return account._id ?? account.id ?? "";
}

type Meta = { page: number; limit: number; total: number; totalPages: number };
const EMPTY_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function AccountsPage() {
    const [rows, setRows] = useState<Account[]>([]);
    const [bots, setBots] = useState<BotProfile[]>([]);
    const [meta, setMeta] = useState<Meta>(EMPTY_META);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [disableTarget, setDisableTarget] = useState<Account | null>(null);
    const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
    const reqIdRef = useRef(0);
    const verifyingRef = useRef<Set<string>>(new Set());

    const query = useMemo(() => search.trim() || undefined, [search]);
    const canPrev = page > 1;
    const canNext = page < (meta?.totalPages ?? 1);
    const botCountByAccount = useMemo(() => {
        const map: Record<string, number> = {};
        for (const bot of bots) {
            map[bot.accountId] = (map[bot.accountId] ?? 0) + 1;
        }
        return map;
    }, [bots]);

    const fetchData = useCallback(
        async (opts?: Partial<{ page: number; limit: number; q?: string }>) => {
            const nextPage = opts?.page ?? page;
            const nextLimit = opts?.limit ?? limit;
            const nextSearch = opts?.q ?? query;
            const reqId = ++reqIdRef.current;
            setLoading(true);
            setError(null);
            try {
                const [accountRes, botRes]: [Paginated<Account>, Paginated<BotProfile>] = await Promise.all([
                    accountsService.findAll({ page: nextPage, limit: nextLimit, q: nextSearch }),
                    botProfilesService.findAll({ page: 1, limit: 500, includeArchived: true }),
                ]);
                if (reqId !== reqIdRef.current) return;
                setRows(Array.isArray(accountRes?.data) ? accountRes.data : []);
                setBots(Array.isArray(botRes?.data) ? botRes.data : []);
                setMeta({
                    page: accountRes?.meta?.page ?? nextPage,
                    limit: accountRes?.meta?.limit ?? nextLimit,
                    total: accountRes?.meta?.total ?? 0,
                    totalPages: accountRes?.meta?.totalPages ?? 1,
                });
            } catch (e: any) {
                if (reqId !== reqIdRef.current) return;
                setRows([]);
                setMeta({ page: 1, limit: nextLimit, total: 0, totalPages: 1 });
                setError(e?.message || "Tải danh sách tài khoản thất bại");
            } finally {
                if (reqId === reqIdRef.current) setLoading(false);
            }
        },
        [page, limit, query]
    );

    useEffect(() => {
        const timer = setTimeout(() => setPage(1), 350);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        fetchData();
    }, [page, limit, fetchData]);

    const onDisable = async () => {
        if (!disableTarget) return;
        try {
            setLoading(true);
            await accountsService.disable(accountId(disableTarget));
            toast.success("Đã vô hiệu hóa tài khoản");
            setDisableTarget(null);
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Vô hiệu hóa thất bại");
        } finally {
            setLoading(false);
        }
    };

    const onEnable = async (id: string) => {
        try {
            setLoading(true);
            await accountsService.enable(id);
            toast.success("Đã kích hoạt tài khoản");
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Kích hoạt thất bại");
        } finally {
            setLoading(false);
        }
    };

    const verifyConnection = async (id: string) => {
        if (verifyingRef.current.has(id)) return;
        verifyingRef.current.add(id);
        setVerifyingIds((current) => new Set(current).add(id));
        try {
            const result = await accountsService.verify(id);
            setRows((current) => current.map((account) => accountId(account) === id ? result.account : account));
            if (result.ok) {
                toast.success("Đã xác minh kết nối tài khoản");
            } else {
                toast.error(`Xác minh thất bại: ${result.message || result.errorCode || "Không rõ lý do"}`);
            }
            await fetchData();
        } catch (e: any) {
            toast.error(`Xác minh thất bại: ${e?.message || "Không rõ lý do"}`);
        } finally {
            verifyingRef.current.delete(id);
            setVerifyingIds((current) => {
                const next = new Set(current);
                next.delete(id);
                return next;
            });
        }
    };

    const setTradingEnabled = async (account: Account, tradingEnabled: boolean) => {
        const id = accountId(account);
        try {
            setLoading(true);
            await accountsService.update(id, { tradingEnabled });
            toast.success(tradingEnabled ? "Đã bật quyền giao dịch" : "Đã tắt quyền giao dịch");
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Cập nhật quyền giao dịch thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Kết nối"
                title="Tài khoản sàn"
                description="Quản lý kết nối exchange theo platform. Credential được che; tài khoản có lịch sử nên được vô hiệu hóa thay vì hard-delete."
                actions={<Link href="/accounts/create" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Thêm tài khoản</Link>}
            />

            <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:flex-row md:items-center">
                <input
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 md:max-w-sm"
                    placeholder="Tìm nhãn hoặc API key đã che..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    value={limit}
                    onChange={(e) => {
                        setPage(1);
                        setLimit(Number(e.target.value));
                    }}
                >
                    {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}/trang</option>)}
                </select>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tổng: {meta.total} · Trang {meta.page}/{meta.totalPages}</div>
                <div className="ml-auto flex gap-2">
                    <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-800" disabled={!canPrev || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Trước</button>
                    <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-800" disabled={!canNext || loading} onClick={() => setPage((value) => value + 1)}>Sau</button>
                </div>
            </div>

            {loading ? <LoadingState /> : null}
            {error ? <ErrorState message={error} /> : null}

            {!loading && !error ? (
                rows.length === 0 ? (
                    <EmptyState title="Chưa có tài khoản sàn" description="Thêm tài khoản sàn để bot có nguồn dữ liệu và cấu hình account rõ ràng." />
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                                <tr>
                                    <th className="p-3">Sàn</th>
                                    <th className="p-3">Nhãn</th>
                                    <th className="p-3">API key</th>
                                    <th className="p-3">Verified</th>
                                    <th className="p-3">Quyền giao dịch</th>
                                    <th className="p-3">Active</th>
                                    <th className="p-3">Bot dùng account</th>
                                    <th className="p-3">Xác minh cuối</th>
                                    <th className="p-3 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {rows.map((account) => {
                                    const id = accountId(account);
                                    const status = account.verificationStatus ?? ((account as any).verified || (account as any).isVerified ? "VERIFIED" : "NOT_VERIFIED");
                                    const verified = status === "VERIFIED";
                                    const failed = status === "FAILED";
                                    const lastVerifiedAt = account.lastVerifiedAt ?? (account as any).verifiedAt;
                                    const isVerifying = verifyingIds.has(id);
                                    return (
                                        <tr key={id}>
                                            <td className="p-3 font-medium text-gray-950 dark:text-white">{account.platform}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-200">{account.label || "-"}</td>
                                            <td className="p-3 font-mono text-gray-700 dark:text-gray-200">{maskKey(account.apiKey)}</td>
                                            <td className="p-3">
                                                <div className="space-y-1">
                                                    <StatusBadge value={verified ? "Đã xác minh" : failed ? "Xác minh lỗi" : "Chưa xác minh"} tone={verified ? "success" : failed ? "error" : "neutral"} />
                                                    {failed && account.lastVerificationMessage ? (
                                                        <div className="max-w-48 truncate text-xs text-rose-600 dark:text-rose-300" title={account.lastVerificationMessage}>
                                                            {account.lastVerificationMessage}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge value={account.tradingEnabled ? "Bật" : "Tắt"} tone={account.tradingEnabled ? "success" : "stopped"} />
                                                    <button
                                                        disabled={!verified || !account.isActive || loading}
                                                        onClick={() => setTradingEnabled(account, !account.tradingEnabled)}
                                                        className="text-xs text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400"
                                                    >
                                                        {account.tradingEnabled ? "Tắt" : "Bật"}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-3"><StatusBadge value={account.isActive ? "ACTIVE" : "DISABLED"} tone={account.isActive ? "success" : "stopped"} /></td>
                                            <td className="p-3">{botCountByAccount[id] ?? 0}</td>
                                            <td className="p-3">{lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleString() : "-"}</td>
                                            <td className="p-3">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        disabled={isVerifying || !account.isActive}
                                                        onClick={() => verifyConnection(id)}
                                                        className="text-brand-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400"
                                                    >
                                                        {isVerifying ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                                                    </button>
                                                    <Link href={`/accounts/${id}/edit`} className="text-brand-600 hover:underline dark:text-brand-400">Chỉnh sửa</Link>
                                                    {account.isActive ? (
                                                        <button onClick={() => setDisableTarget(account)} className="text-rose-600 hover:underline dark:text-rose-400">Vô hiệu hóa</button>
                                                    ) : (
                                                        <button onClick={() => onEnable(id)} className="text-emerald-600 hover:underline dark:text-emerald-400">Kích hoạt</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            ) : null}

            <ConfirmDialog
                open={Boolean(disableTarget)}
                title="Vô hiệu hóa tài khoản?"
                description="Tài khoản bị disable sẽ không dùng cho bot mới hoặc runtime. Lịch sử order/audit vẫn được giữ."
                confirmLabel="Vô hiệu hóa"
                tone="danger"
                onConfirm={onDisable}
                onCancel={() => setDisableTarget(null)}
            />
        </div>
    );
}
