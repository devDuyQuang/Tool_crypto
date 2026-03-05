"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { cryptoExchangesService } from "@/services/cryptoExchanges.service";

export default function CryptoExchangeCreatePage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submittingRef = useRef(false);

    const payload = useMemo(() => ({ name: name.trim() }), [name]);
    const canSubmit = Boolean(payload.name);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        if (submittingRef.current) return;
        submittingRef.current = true;

        setSaving(true);
        setError(null);

        try {
            await cryptoExchangesService.create(payload);
            toast.success("Tạo exchange thành công ✅");
            setTimeout(() => router.replace("/crypto-exchanges"), 700);
        } catch (e: any) {
            setError(e?.message || "Create failed");
            toast.error(e?.message || "Tạo thất bại ❌");
        } finally {
            submittingRef.current = false;
            setSaving(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4">
            <h1 className="text-xl font-semibold">Create Crypto Exchange</h1>

            {error && <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600">{error}</div>}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm">Name</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="BINANCE"
                        required
                        disabled={saving}
                    />
                </div>

                <button
                    disabled={!canSubmit || saving}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}
