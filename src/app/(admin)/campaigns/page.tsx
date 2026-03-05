"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { campaignsService } from "@/services/campaigns.service";
import type { Campaign } from "@/types/campaign";
import type { Paginated } from "@/types/common"; // nếu Paginated đang nằm ở đây

function safeId(x: any) {
    return x?._id ?? x?.id ?? "";
}

type Meta = { page: number; limit: number; total: number; totalPages: number };
const EMPTY_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };

export default function CampaignsPage() {
    const [rows, setRows] = useState<Campaign[]>([]);
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
        async (opts?: Partial<{ page: number; limit: number; search?: string }>) => {
            const nextPage = opts?.page ?? page;
            const nextLimit = opts?.limit ?? limit;
            const nextSearch = opts?.search ?? query;

            const reqId = ++reqIdRef.current;
            setLoading(true);
            setError(null);

            try {
                const res: Paginated<Campaign> = await campaignsService.findAll({
                    page: nextPage,
                    limit: nextLimit,
                    search: nextSearch,
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

                // ✅ Việt hoá message lỗi (GIỮ bản cũ bằng comment)
                // setError(e?.message || "Load campaigns failed");
                setError(e?.message || "Tải danh sách cấu hình thất bại");
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

    const onDelete = async (id: string) => {
        // ✅ Việt hoá confirm (GIỮ bản cũ bằng comment)
        // if (!confirm("Xoá campaign này?")) return;
        if (!confirm("Bạn có chắc muốn xoá cấu hình này không?")) return;

        try {
            setLoading(true);
            await campaignsService.remove(id);
            toast.success("Đã xoá ✅");
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
                {/* ✅ Việt hoá tiêu đề (GIỮ bản cũ bằng comment) */}
                {/* <h1 className="text-2xl font-semibold">Cấu hình giao dịch</h1> */}
                <h1 className="text-2xl font-semibold">Cài đặt lệnh</h1>

                <Link
                    href="/campaigns/create"
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:opacity-95"
                >
                    {/* ✅ Việt hoá nút (GIỮ bản cũ bằng comment) */}
                    {/* + Add Campaign */}
                    + Thêm cấu hình
                </Link>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    className="w-72 rounded-lg border border-gray-200 bg-white p-2
          text-gray-900 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-500/40
          dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    // ✅ Việt hoá placeholder (GIỮ bản cũ bằng comment)
                    // placeholder="Search campaign name..."
                    placeholder="Tìm theo tên cấu hình..."
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
                    disabled={loading}
                >
                    {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            {/* ✅ Việt hoá "/page" (GIỮ bản cũ bằng comment) */}
                            {/* {n}/page */}
                            {n} / trang
                        </option>
                    ))}
                </select>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {/* ✅ Việt hoá Total/Page (GIỮ bản cũ bằng comment) */}
                    {/* Total: {meta?.total ?? 0} • Page {meta?.page ?? page}/{meta?.totalPages ?? 1} */}
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
                        {/* ✅ Việt hoá Prev (GIỮ bản cũ bằng comment) */}
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
                        {/* ✅ Việt hoá Next (GIỮ bản cũ bằng comment) */}
                        {/* Next */}
                        Sau
                    </button>
                </div>
            </div>

            {/* ✅ Việt hoá Loading (GIỮ bản cũ bằng comment) */}
            {/* {loading && <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>} */}
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
                                {/* ✅ Việt hoá header (GIỮ bản cũ bằng comment) */}
                                {/* <th className="p-3">Name</th> */}
                                {/* <th className="p-3">Margin</th> */}
                                {/* <th className="p-3">Lev</th> */}
                                {/* <th className="p-3">USDT</th> */}
                                {/* <th className="p-3">TP/SL</th> */}
                                {/* <th className="p-3">Actions</th> */}

                                <th className="p-3">Tên</th>
                                <th className="p-3">Ký quỹ</th>
                                <th className="p-3">Đòn bẩy</th>
                                <th className="p-3">USDT</th>
                                <th className="p-3">Chốt lời / Cắt lỗ</th>
                                <th className="p-3">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {rows.map((r) => {
                                const id = safeId(r);
                                return (
                                    <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                        <td className="p-3">{(r as any).name}</td>
                                        <td className="p-3">{(r as any).margin}</td>
                                        <td className="p-3">{(r as any).leverage}</td>
                                        <td className="p-3">{(r as any).money}</td>
                                        <td className="p-3">
                                            {typeof (r as any).tp === "number" ? (r as any).tp : "-"} /{" "}
                                            {typeof (r as any).sl === "number" ? (r as any).sl : "-"}
                                        </td>
                                        <td className="p-3 space-x-3">
                                            {/* ✅ Việt hoá Edit/Delete (GIỮ bản cũ bằng comment) */}
                                            {/* 
                      <Link href={`/campaigns/${id}/edit`} className="text-blue-600 hover:underline">
                        Edit
                      </Link>
                      */}

                                            <Link
                                                href={`/campaigns/${id}/edit`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Sửa
                                            </Link>

                                            {/* 
                      <button
                        onClick={() => onDelete(id)}
                        className="text-red-700 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                      */}

                                            <button
                                                onClick={() => onDelete(id)}
                                                className="text-red-700 hover:underline dark:text-red-400"
                                            >
                                                Xoá
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-3 text-gray-600 dark:text-gray-400" colSpan={6}>
                                        {/* ✅ Việt hoá empty text (GIỮ bản cũ bằng comment) */}
                                        {/* No campaigns */}
                                        Chưa có cấu hình nào
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