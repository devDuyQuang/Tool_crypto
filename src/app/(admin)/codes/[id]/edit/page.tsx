"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { codesService } from "@/services/codes.service";

export default function CodeEditPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [name, setName] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setError(null);
            setLoading(true);
            try {
                const data = await codesService.findOne(id);
                setName(data.name || "");
            } catch (e: any) {
                setError(e?.message || "Load failed");
            } finally {
                setLoading(false);
            }
        };

        if (id) load();
    }, [id]);

    const payload = useMemo(() => ({ name: name.trim() }), [name]);
    const canSubmit = Boolean(payload.name);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setError(null);
        setSaving(true);

        try {
            await codesService.update(id, payload);
            toast.success("Cập nhật thành công ✅");
            setTimeout(() => router.replace("/codes"), 700);
        } catch (e: any) {
            setError(e?.message || "Update failed");
            toast.error(e?.message || "Cập nhật thất bại ❌");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-xl space-y-4">
            <h1 className="text-xl font-semibold">Edit Code</h1>

            {error && <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600">{error}</div>}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm">Name</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={saving}
                    />
                </div>

                <button
                    disabled={saving || !canSubmit}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
