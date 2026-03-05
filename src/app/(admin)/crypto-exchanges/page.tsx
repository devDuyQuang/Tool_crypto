"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { cryptoExchangesService } from "@/services/cryptoExchanges.service";
import type { CryptoExchange, Paginated } from "@/types/cryptoExchange";

type Meta = { page: number; limit: number; total: number; totalPages: number };
const EMPTY_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function CryptoExchangesPage() {
    const [rows, setRows] = useState<CryptoExchange[]>([]);
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

    const fetchData = useCallback(async () => {
        const reqId = ++reqIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const res: Paginated<CryptoExchange> = await cryptoExchangesService.findAll({
                page,
                limit,
                search: query,
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
            setError(e?.message || "Load crypto exchanges failed");
        } finally {
            if (reqId === reqIdRef.current) setLoading(false);
        }
    }, [page, limit, query]);

    useEffect(() => {
        const t = setTimeout(() => setPage(1), 400);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onDelete = async (id: string) => {
        if (!confirm("Xoá exchange này?")) return;
        try {
            setLoading(true);
            await cryptoExchangesService.remove(id);
            toast.success("Đã xoá ✅");
            await fetchData();
        } catch (e: any) {
            toast.error(e?.message || "Xoá thất bại ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Crypto Exchanges</h1>
                <Link href="/crypto-exchanges/create" className="px-4 py-2 rounded-lg bg-brand-500 text-white">
                    + Add Exchange
                </Link>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    className="border rounded-lg p-2 w-72"
                    placeholder="Search exchange name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border rounded-lg p-2"
                    value={limit}
                    onChange={(e) => {
                        const next = Number(e.target.value);
                        setPage(1);
                        setLimit(next);
                    }}
                >
                    {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            {n}/page
                        </option>
                    ))}
                </select>

                <div className="text-sm text-gray-600">
                    Total: {meta.total} • Page {meta.page}/{meta.totalPages}
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        className="border rounded-lg px-3 py-2 disabled:opacity-50"
                        disabled={!canPrev || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Prev
                    </button>
                    <button
                        className="border rounded-lg px-3 py-2 disabled:opacity-50"
                        disabled={!canNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600">{error}</div>}

            {!loading && !error && (
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left">
                                <th className="p-3">Name</th>
                                <th className="p-3">Created</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((r) => (
                                <tr key={r._id} className="border-t">
                                    <td className="p-3 font-medium">{r.name}</td>
                                    <td className="p-3">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                                    <td className="p-3 space-x-3">
                                        <Link href={`/crypto-exchanges/${r._id}/edit`} className="text-blue-600">
                                            Edit
                                        </Link>
                                        <button onClick={() => onDelete(r._id)} className="text-red-700">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-3" colSpan={3}>
                                        No exchanges
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
