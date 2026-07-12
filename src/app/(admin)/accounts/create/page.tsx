"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import LoadingModal from "@/components/loadingModal/LoadingModal";
import { accountsService } from "@/services/accounts.service";
import type { AccountEnvironment, Platform } from "@/types/account";

type FormState = {
    platform: Platform;
    environment: AccountEnvironment;
    apiKey: string;
    secretKey: string;
    passphrase: string;
};

function genLabel(platform: string, apiKey: string) {
    const p = (platform || "EX").toLowerCase();
    const k = (apiKey || "").replace(/\s/g, "");
    if (k.length <= 8) return `${p}_${k || "no_key"}`;
    return `${p}_${k.slice(0, 4)}...${k.slice(-4)}`;
}

export default function AccountCreatePage() {
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        platform: "BINANCE",
        environment: "DEMO",
        apiKey: "",
        secretKey: "",
        passphrase: "",
    });

    const [openModal, setOpenModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submittingRef = useRef(false);

    const payload = useMemo(
        () => ({
            platform: form.platform,
            environment: form.environment,
            apiKey: form.apiKey.trim(),
            secretKey: form.secretKey.trim(),
            passphrase: form.passphrase.trim() || undefined,
            // ✅ KHÔNG gửi label nữa
        }),
        [form]
    );

    const previewLabel = useMemo(
        () => genLabel(payload.platform, payload.apiKey),
        [payload.platform, payload.apiKey]
    );

    const validationError = useMemo(() => {
        if (!payload.apiKey) return "API Key là bắt buộc.";
        if (!payload.secretKey) return "Secret Key là bắt buộc.";
        if (payload.platform === "OKX" && !payload.passphrase) return "OKX passphrase là bắt buộc.";
        if (payload.apiKey.length < 8) return "API Key quá ngắn (>= 8 ký tự).";
        if (payload.secretKey.length < 8) return "Secret Key quá ngắn (>= 8 ký tự).";
        return null;
    }, [payload]);

    const canSubmit = !validationError && !openModal;

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (validationError) {
            toast.error(validationError);
            setError(validationError);
            return;
        }

        if (submittingRef.current) return;
        submittingRef.current = true;

        setOpenModal(true);
        setError(null);

        try {
            await accountsService.create(payload); // ✅ gửi đúng DTO BE
            toast.success("Tạo tài khoản thành công ✅");
            router.push("/accounts");
            router.refresh();
        } catch (err: any) {
            const msg = err?.message || "Tạo tài khoản thất bại ❌";
            toast.error(msg);
            setError(msg);
        } finally {
            submittingRef.current = false;
            setOpenModal(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4 text-gray-900 dark:text-gray-100">
            <LoadingModal open={openModal} text="Đang tạo..." />

            <h1 className="text-xl font-semibold">Thêm tài khoản</h1>

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm">Sàn</label>
                    <select
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={form.platform}
                        onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value as Platform }))}
                        disabled={openModal}
                    >
                        {(["BINANCE", "OKX", "BINGX"] as const).map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 text-sm">Môi trường</label>
                    <select
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={form.environment}
                        onChange={(e) => setForm((p) => ({ ...p, environment: e.target.value as AccountEnvironment }))}
                        disabled={openModal}
                    >
                        {(["DEMO", "LIVE"] as const).map((env) => (
                            <option key={env} value={env}>
                                {env}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ✅ Hiển thị nhãn tự sinh (readonly) */}
                <div>
                    <label className="block mb-1 text-sm">Nhãn (tự sinh)</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 bg-gray-50 dark:bg-gray-900/40"
                        value={previewLabel}
                        readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Nhãn được tạo tự động từ API Key để dễ nhận diện.
                    </p>
                </div>

                <div>
                    <label className="block mb-1 text-sm">API Key</label>
                    <input
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 font-mono"
                        value={form.apiKey}
                        onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                        disabled={openModal}
                        autoComplete="off"
                        spellCheck={false}
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm">Secret Key</label>
                    <input
                        type="password"
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 font-mono"
                        value={form.secretKey}
                        onChange={(e) => setForm((p) => ({ ...p, secretKey: e.target.value }))}
                        disabled={openModal}
                        autoComplete="new-password"
                        spellCheck={false}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Secret sẽ không hiển thị rõ để tránh lộ khi chia sẻ màn hình.
                    </p>
                </div>

                {form.platform === "OKX" && (
                    <div>
                        <label className="block mb-1 text-sm">Passphrase</label>
                        <input
                            type="password"
                            className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 font-mono"
                            value={form.passphrase}
                            onChange={(e) => setForm((p) => ({ ...p, passphrase: e.target.value }))}
                            disabled={openModal}
                            autoComplete="new-password"
                            spellCheck={false}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {openModal ? "Đang lưu..." : "Lưu"}
                </button>

                {validationError && <p className="text-xs text-red-600">{validationError}</p>}
            </form>
        </div>
    );
}
