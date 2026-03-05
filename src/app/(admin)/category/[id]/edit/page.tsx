// sửa
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { categoryService } from "@/services/category.service";

export default function CategoryEditPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [name, setName] = useState("");
    const [file, setFile] = useState("");
    const [status, setStatus] = useState(true);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setError(null);
            setLoading(true);
            try {
                const data = await categoryService.findOne(id);
                setName(data.name || "");
                setFile(data.file || "");
                setStatus(Boolean(data.status));
            } catch (e: any) {
                setError(e?.message || "Load failed");
            } finally {
                setLoading(false);
            }
        };

        if (id) load();
    }, [id]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            await categoryService.update(id, {
                name,
                file: file || undefined,
                status,
            });
            router.replace("/category");
        } catch (e: any) {
            setError(e?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-xl space-y-4">
            <h1 className="text-xl font-semibold">Edit Category</h1>

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
                        required
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm">File (url)</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={file}
                        onChange={(e) => setFile(e.target.value)}
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
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
