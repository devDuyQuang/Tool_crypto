"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productService, Product, ProductUpdateBody } from "@/services/product.service";
import { categoryService, Category } from "@/services/category.service";

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                setError(null);
                setLoading(true);

                // load categories + product
                const [cats, p] = await Promise.all([
                    categoryService.findAll({ page: 1, limit: 100 }), // nếu service bạn đang trả PageResponse
                    productService.findOne(id),
                ]);

                // nếu categoryService.findAll trả PageResponse => cats.data
                const catList = Array.isArray((cats as any).data) ? (cats as any).data : (cats as any);
                setCategories(catList || []);

                setName(p.name ?? "");
                setPrice(Number(p.price ?? 0));
                setDescription(p.description ?? "");
                setContent(p.content ?? "");

                // categoryId có thể là string hoặc object populated
                const cid = typeof p.categoryId === "string" ? p.categoryId : p.categoryId?._id;
                setCategoryId(cid || (catList?.[0]?._id ?? ""));
            } catch (e: any) {
                setError(e?.message || "Load failed");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            setError(null);
            setSaving(true);

            const body: ProductUpdateBody = {
                name,
                price,
                description: description || undefined,
                content: content || undefined,
                categoryId,
            };

            await productService.update(id, body);
            router.replace("/product");
        } catch (e: any) {
            setError(e?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-xl space-y-4">
            <h1 className="text-2xl font-semibold">Edit Product</h1>

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    className="w-full border rounded-lg p-2"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <input
                    className="w-full border rounded-lg p-2"
                    placeholder="Price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                />

                <input
                    className="w-full border rounded-lg p-2"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <textarea
                    className="w-full border rounded-lg p-2"
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                />

                <select
                    className="w-full border rounded-lg p-2"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                >
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <button
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
