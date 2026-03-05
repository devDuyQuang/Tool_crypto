"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { productService, Product } from "@/services/product.service";

type Meta = { page: number; limit: number; total: number; totalPages: number };

export default function ProductPage() {
    const [items, setItems] = useState<Product[]>([]);
    const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async (opts?: Partial<{ page: number; limit: number; search: string }>) => {
        try {
            setError(null);
            setLoading(true);

            const res = await productService.findAll({
                page: opts?.page ?? page,
                limit: opts?.limit ?? limit,
                search: (opts?.search ?? search).trim() || undefined,
            });

            setItems(res.data);
            setMeta(res.meta);
        } catch (e: any) {
            setError(e?.message || "Load product failed");
        } finally {
            setLoading(false);
        }
    };

    // ✅ debounce search: gõ là search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            load({ page: 1, search });
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // ✅ page/limit đổi là load
    useEffect(() => {
        load({ page, limit });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);

    const onDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        try {
            await productService.remove(id);
            await load();
        } catch (e: any) {
            alert(e?.message || "Delete failed");
        }
    };

    const renderCategory = (categoryId: Product["categoryId"]) => {
        if (!categoryId) return "-";
        if (typeof categoryId === "string") return categoryId;
        return categoryId.name;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Product</h1>
                <Link href="/product/create" className="px-4 py-2 rounded-lg bg-brand-500 text-white">
                    + Add Product
                </Link>
            </div>

            {/* Search + limit + pagination */}
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    className="border rounded-lg p-2 w-72"
                    placeholder="Search name / slug / description..."
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
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Prev
                    </button>
                    <button
                        className="border rounded-lg px-3 py-2 disabled:opacity-50"
                        disabled={page >= meta.totalPages || loading}
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
                                <th className="p-3">Price</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Slug</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((p) => (
                                <tr key={p._id} className="border-t">
                                    <td className="p-3">{p.name}</td>
                                    <td className="p-3">{p.price}</td>
                                    <td className="p-3">{renderCategory(p.categoryId)}</td>
                                    <td className="p-3">{p.slug}</td>
                                    <td className="p-3 space-x-3">
                                        <Link className="text-blue-600" href={`/product/${p._id}/edit`}>
                                            Edit
                                        </Link>
                                        <button className="text-red-600" onClick={() => onDelete(p._id)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td className="p-3" colSpan={5}>
                                        No products
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
