"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
// import { toast } from "sonner";

import { accountsService } from "@/services/accounts.service";
import type { Account } from "@/types/account";
import type { Paginated } from "@/types/common";

function maskKey(key: string) {
    if (!key) return "-";
    if (key.length <= 8) return "****";
    return `${key.slice(0, 3)}****${key.slice(-4)}`;
}

type Meta = { page: number; limit: number; total: number; totalPages: number };
const EMPTY_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function AccountsPage() {
    const [rows, setRows] = useState<Account[]>([]);
    const [meta, setMeta] = useState<Meta>(EMPTY_META);

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reqIdRef = useRef(0);

    const query = useMemo(() => {
        const q = search.trim();
        return q.length ? q : undefined;
    }, [search]);

    const canPrev = page > 1;
    const canNext = page < (meta?.totalPages ?? 1);

    const fetchData = useCallback(
        async (opts?: Partial<{ page: number; limit: number; q?: string }>) => {
            const nextPage = opts?.page ?? page;
            const nextLimit = opts?.limit ?? limit;
            const nextSearch = opts?.q ?? query;

            const reqId = ++reqIdRef.current;

            setLoading(true);
            setError(null);

            try {
                const res: Paginated<Account> = await accountsService.findAll({
                    page: nextPage,
                    limit: nextLimit,
                    q: nextSearch,
                });

                if (reqId !== reqIdRef.current) return;

                setRows(Array.isArray(res?.data) ? res.data : []);
                setMeta({
                    page: res?.meta?.page ?? nextPage,
                    limit: res?.meta?.limit ?? nextLimit,
                    total: res?.meta?.total ?? 0,
                    totalPages: res?.meta?.totalPages ?? 1,
                });
            } catch (e: any) {
                if (reqId !== reqIdRef.current) return;

                setRows([]);
                setMeta({ page: 1, limit: nextLimit, total: 0, totalPages: 1 });

                // setError(e?.message || "Load accounts failed");
                setError(e?.message || "Tải danh sách tài khoản thất bại");
            } finally {
                if (reqId === reqIdRef.current) setLoading(false);
            }
        },
        [page, limit, query]
    );

    // debounce search -> reset page
    useEffect(() => {
        const t = setTimeout(() => setPage(1), 400);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        fetchData();
    }, [page, limit, fetchData]);

    const onDisable = async (id: string) => {
        if (!confirm("Vô hiệu hoá tài khoản này?")) return;
        try {
            setLoading(true);
            await accountsService.disable(id);
            toast.success("Đã vô hiệu hoá ✅");
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Vô hiệu hoá thất bại ❌");
        } finally {
            setLoading(false);
        }
    };

    const onEnable = async (id: string) => {
        if (!confirm("Kích hoạt lại tài khoản này?")) return;
        try {
            setLoading(true);
            await accountsService.enable(id);
            toast.success("Đã kích hoạt ✅");
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Kích hoạt thất bại ❌");
        } finally {
            setLoading(false);
        }
    };

    const onHardDelete = async (id: string) => {
        if (!confirm("Xoá VĨNH VIỄN tài khoản này? Không thể khôi phục!")) return;
        try {
            setLoading(true);
            await accountsService.hardDelete(id);
            toast.success("Đã xoá vĩnh viễn ✅");
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Xoá thất bại ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tài khoản Crypto</h1>

                <Link
                    href="/accounts/create"
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:opacity-95"
                >
                    {/* + Add Account */}
                    + Thêm tài khoản
                </Link>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    className="w-72 rounded-lg border border-gray-200 bg-white p-2
            text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    // placeholder="Search label / apiKey..."
                    placeholder="Tìm theo nhãn / API Key..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="rounded-lg border border-gray-200 bg-white p-2
            text-gray-900
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    value={limit}
                    onChange={(e) => {
                        const next = Number(e.target.value);
                        setPage(1);
                        setLimit(next);
                    }}
                >
                    {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            {n}/trang
                        </option>
                    ))}
                </select>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {/* Total: ... • Page ... */}
                    Tổng: {meta?.total ?? 0} • Trang {meta?.page ?? page}/{meta?.totalPages ?? 1}
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2
              text-gray-700 hover:bg-gray-50 disabled:opacity-50
              dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                        disabled={!canPrev || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        {/* Prev */}
                        Trước
                    </button>

                    <button
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2
              text-gray-700 hover:bg-gray-50 disabled:opacity-50
              dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                        disabled={!canNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        {/* Next */}
                        Sau
                    </button>
                </div>
            </div>

            {/* Loading... */}
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
                                {/* Platform / Label / API Key / Active / Actions */}
                                <th className="p-3 font-medium">Sàn</th>
                                <th className="p-3 font-medium">Nhãn</th>
                                <th className="p-3 font-medium">API Key</th>
                                <th className="p-3 font-medium">Trạng thái</th>
                                <th className="p-3 font-medium">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {rows.map((r) => {
                                const id = (r as any)._id ?? (r as any).id;
                                return (
                                    <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                        <td className="p-3 text-gray-900 dark:text-gray-100">{r.platform}</td>
                                        <td className="p-3 text-gray-900 dark:text-gray-100">{r.label}</td>
                                        <td className="p-3 font-mono text-gray-900 dark:text-gray-100">
                                            {maskKey(r.apiKey)}
                                        </td>

                                        <td className="p-3">
                                            {r.isActive ? (
                                                <button
                                                    onClick={() => onDisable(id)}
                                                    className="text-red-600 hover:underline dark:text-red-400"
                                                >
                                                    {/* Disable */}
                                                    Vô hiệu hoá
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onEnable(id)}
                                                    className="text-green-600 hover:underline dark:text-green-400"
                                                >
                                                    {/* Enable */}
                                                    Kích hoạt
                                                </button>
                                            )}
                                        </td>

                                        <td className="p-3 space-x-3">
                                            {/* <Link href={`/accounts/${id}/edit`} className="text-blue-600">Edit</Link> */}
                                            <button
                                                onClick={() => onHardDelete(id)}
                                                className="text-red-700 hover:underline dark:text-red-400"
                                            >
                                                {/* Delete */}
                                                Xoá
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-3 text-gray-600 dark:text-gray-400" colSpan={5}>
                                        {/* No accounts */}
                                        Không có tài khoản nào
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