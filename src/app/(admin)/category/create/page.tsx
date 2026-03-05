// thêm 
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { categoryService } from "@/services/category.service";

export default function CategoryCreatePage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [file, setFile] = useState("");
    const [status, setStatus] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await categoryService.create({
                name,
                file: file || undefined,
                status,
            });
            router.replace("/category");
        } catch (e: any) {
            setError(e?.message || "Create failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4">
            <h1 className="text-xl font-semibold">Create Category</h1>

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm">Name</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Áo thun nữ..."
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm">File (url)</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={file}
                        onChange={(e) => setFile(e.target.value)}
                        placeholder="https://..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                    />
                    <span className="text-sm">Status</span>
                </div>

                <button
                    disabled={loading}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
