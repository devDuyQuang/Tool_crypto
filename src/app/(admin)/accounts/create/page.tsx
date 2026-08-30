"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import LoadingModal from "@/components/loadingModal/LoadingModal";
import { accountsService } from "@/services/accounts.service";
import type { AccountConnectionTarget, Platform } from "@/types/account";

type AccountRunMode = "SANDBOX" | "LIVE";

type FormState = {
    platform: Platform;
    mode: AccountRunMode;
    apiKey: string;
    secretKey: string;
    passphrase: string;
};

function connectionTargetFor(platform: Platform, mode: AccountRunMode): AccountConnectionTarget {
    if (platform === "OKX") return mode === "LIVE" ? "OKX_PRODUCTION" : "OKX_DEMO";
    if (platform === "BINANCE") return mode === "LIVE" ? "BINANCE_PRODUCTION" : "BINANCE_DEMO";
    return "BINGX_PRODUCTION";
}

function modeLabel(mode: AccountRunMode) {
    return mode === "LIVE" ? "Tài khoản thực tế" : "Tài khoản thử nghiệm";
}

function genLabel(platform: string, apiKey: string) {
    const p = (platform || "EX").toLowerCase();
    const k = (apiKey || "").replace(/\s/g, "");
    if (k.length <= 8) return `${p}_${k || "no_key"}`;
    return `${p}_${k.slice(0, 4)}...${k.slice(-4)}`;
}

export default function AccountCreatePage() {
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        platform: "OKX",
        mode: "SANDBOX",
        apiKey: "",
        secretKey: "",
        passphrase: "",
    });

    const [openModal, setOpenModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submittingRef = useRef(false);

    const previewLabel = useMemo(
        () => genLabel(form.platform, form.apiKey.trim()),
        [form.platform, form.apiKey]
    );

    const payload = useMemo(
        () => ({
            platform: form.platform,
            label: previewLabel,
            apiKey: form.apiKey.trim(),
            secretKey: form.secretKey.trim(),
            passphrase: form.passphrase.trim() || undefined,
            connectionTarget: connectionTargetFor(form.platform, form.mode),
        }),
        [form, previewLabel]
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
            const created = await accountsService.create(payload);
            const id = created._id ?? created.id;
            if (!id) throw new Error("Backend chưa trả account id để kiểm tra kết nối.");
            const verified = await accountsService.verify(id);
            if (!verified.ok) {
                throw new Error(verified.message || "Không thể xác minh credential.");
            }
            try {
                await accountsService.update(id, { tradingEnabled: true });
            } catch {
                // Backend safety guards may keep trading disabled until account/strategy readiness is complete.
            }
            toast.success(`Đã kết nối ${modeLabel(form.mode).toLowerCase()} và xác minh thành công`);
            router.push("/accounts");
            router.refresh();
        } catch (err: any) {
            const msg = err?.message || "Tạo hoặc kiểm tra tài khoản thất bại";
            toast.error(msg);
            setError(msg);
        } finally {
            submittingRef.current = false;
            setOpenModal(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4 text-gray-900 dark:text-gray-100">
            <LoadingModal open={openModal} text="Đang lưu tài khoản..." />

            <h1 className="text-xl font-semibold">Kết nối tài khoản sàn</h1>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                Nhập API Key, Secret và Passphrase. Hệ thống sẽ tự kiểm tra và chuẩn bị tài khoản này cho bot. Không cần quyền Withdraw.
            </p>

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
                        {(["OKX", "BINANCE"] as const).map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-2 text-sm">Chế độ tài khoản</label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {([
                            {
                                value: "SANDBOX",
                                title: "Chạy thử nghiệm (Sandbox)",
                                description: "Dùng API môi trường thử nghiệm để kiểm tra bot an toàn.",
                            },
                            {
                                value: "LIVE",
                                title: "Chạy thực tế (Live)",
                                description: "Dùng API tài khoản thật theo quyền giao dịch đã cấp.",
                            },
                        ] as const).map((option) => {
                            const active = form.mode === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={openModal}
                                    onClick={() => setForm((p) => ({ ...p, mode: option.value }))}
                                    className={`rounded-lg border p-3 text-left transition ${
                                        active
                                            ? "border-brand-500 bg-brand-50 text-gray-950 dark:border-brand-400 dark:bg-brand-500/10 dark:text-white"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
                                    }`}
                                >
                                    <div className="text-sm font-semibold">{option.title}</div>
                                    <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{option.description}</div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Đang lưu dưới dạng {modeLabel(form.mode).toLowerCase()} cho {form.platform}; bot sẽ dùng đúng luồng API theo tài khoản này.
                    </p>
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
                    {openModal ? "Đang lưu..." : "Lưu tài khoản"}
                </button>

                {validationError && <p className="text-xs text-red-600">{validationError}</p>}
            </form>
        </div>
    );
}
