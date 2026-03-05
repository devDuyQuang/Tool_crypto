"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";

export default function CreateProductPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await categoryService.findAll({ page: 1, limit: 100 }); // lấy nhiều để đổ dropdown
                const data = res.data || [];
                setCategories(data);
                if (data.length) setCategoryId(data[0]._id);
            } catch (e: any) {
                setError(e?.message || "Load categories failed");
            }
        })();
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await productService.create({
                name,
                price,
                description,
                content,
                categoryId,
            });

            router.replace("/product"); // hoặc "/products" tùy bạn
        } catch (e: any) {
            setError(e?.message || "Create product failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4">
            <h1 className="text-2xl font-semibold">Create Product</h1>

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
                />

                <input
                    className="w-full border rounded-lg p-2"
                    placeholder="Price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
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
                >
                    {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <button
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
