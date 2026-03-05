"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categoryService, Category } from "@/services/category.service";

type Meta = { page: number; limit: number; total: number; totalPages: number };

export default function CategoryPage() {
    const [rows, setRows] = useState<Category[]>([]);
    const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const canPrev = page > 1;
    const canNext = page < meta.totalPages;

    const load = async (opts?: Partial<{ page: number; limit: number; search: string }>) => {
        try {
            setError(null);
            setLoading(true);

            const nextPage = opts?.page ?? page;
            const nextLimit = opts?.limit ?? limit;
            const nextSearch = opts?.search ?? (search.trim() || "");

            const res = await categoryService.findAll({
                page: nextPage,
                limit: nextLimit,
                search: nextSearch || undefined,
            });

            setRows(res.data);
            setMeta(res.meta);
        } catch (e: any) {
            setError(e?.message || "Load category failed");
        } finally {
            setLoading(false);
        }
    };

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            load({ page: 1, search });
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);

    const onDelete = async (id: string) => {
        if (!confirm("Xóa category này?")) return;

        try {
            await categoryService.remove(id);

            // nếu trang hiện tại chỉ còn 1 item và page > 1 -> lùi trang
            if (rows.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                await load();
            }
        } catch (e: any) {
            alert(e?.message || "Delete failed");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Category</h1>
                <Link href="/category/create" className="px-4 py-2 rounded-lg bg-brand-500 text-white">
                    + Add Category
                </Link>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    className="border rounded-lg p-2 w-72"
                    placeholder="Search name / slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border rounded-lg p-2"
                    value={limit}
                    onChange={(e) => {
                        setPage(1);
                        setLimit(Number(e.target.value));
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
                        onClick={() => setPage((p) => p - 1)}
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
                                <th className="p-3">Slug</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r._id} className="border-t">
                                    <td className="p-3">{r.name}</td>
                                    <td className="p-3">{r.slug || "-"}</td>
                                    <td className="p-3">{r.status ? "true" : "false"}</td>
                                    <td className="p-3 space-x-3">
                                        <Link href={`/category/${r._id}/edit`} className="text-blue-600">
                                            Edit
                                        </Link>
                                        <button onClick={() => onDelete(r._id)} className="text-red-600">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {rows.length === 0 && (
                                <tr>
                                    <td className="p-3" colSpan={4}>
                                        No category
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
