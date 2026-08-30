"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

import { ErrorState } from "@/components/product/ErrorState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { accountsService } from "@/services/accounts.service";
import type { Account, Platform } from "@/types/account";

const PLATFORMS: Platform[] = ["BINANCE", "OKX"];

function accountId(account: Account) {
    return account._id ?? account.id ?? "";
}

export default function AccountEditPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const savingRef = useRef(false);

    const [account, setAccount] = useState<Account | null>(null);
    const [platform, setPlatform] = useState<Platform>("BINANCE");
    const [label, setLabel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const item = await accountsService.findOne(id);
                if (!mounted) return;
                setAccount(item);
                setPlatform(item.platform);
                setLabel(item.label ?? "");
                setApiKey("");
                setIsActive(Boolean(item.isActive));
                setSecretKey("");
                setPassphrase("");
            } catch (e: any) {
                if (mounted) setError(e?.message || "Tải tài khoản thất bại");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [id]);

    const credentialChanged = useMemo(() => {
        if (!account) return false;
        return platform !== account.platform || Boolean(apiKey.trim()) || Boolean(secretKey.trim()) || Boolean(passphrase.trim());
    }, [account, platform, apiKey, secretKey, passphrase]);

    const canSubmit = Boolean(id && label.trim()) && !saving;

    const onSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!id || !canSubmit || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        setError(null);
        try {
            const payload: any = {
                platform,
                label: label.trim(),
                isActive,
            };
            if (apiKey.trim()) payload.apiKey = apiKey.trim();
            if (secretKey.trim()) payload.secretKey = secretKey.trim();
            if (platform === "OKX" && passphrase.trim()) payload.passphrase = passphrase.trim();

            await accountsService.update(id, payload);
            toast.success(credentialChanged ? "Đã lưu. Vui lòng kiểm tra kết nối lại." : "Đã lưu tài khoản");
            router.push("/accounts");
            router.refresh();
        } catch (e: any) {
            const message = e?.message || "Cập nhật tài khoản thất bại";
            setError(message);
            toast.error(message);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Kết nối"
                title="Chỉnh sửa tài khoản sàn"
                description="Credential đã lưu không được hiển thị lại. Để trống secret/passphrase nếu muốn giữ credential cũ."
                actions={<Link href="/accounts" className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-800">Quay lại</Link>}
            />

            {error ? <ErrorState message={error} /> : null}

            <form onSubmit={onSubmit} className="max-w-2xl space-y-5 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                {account ? (
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4 dark:border-gray-800">
                        <StatusBadge value={account.verificationStatus === "VERIFIED" ? "Đã xác minh" : account.verificationStatus === "VERIFIED_BUT_INCOMPATIBLE" ? "Đã xác minh, cần chỉnh account" : account.verificationStatus === "FAILED" ? "Xác minh lỗi" : "Chưa xác minh"} tone={account.verificationStatus === "VERIFIED" ? "success" : account.verificationStatus === "VERIFIED_BUT_INCOMPATIBLE" ? "warning" : account.verificationStatus === "FAILED" ? "error" : "neutral"} />
                        <StatusBadge value={account.tradingEnabled ? "Giao dịch bật" : "Giao dịch tắt"} tone={account.tradingEnabled ? "success" : "stopped"} />
                        <span className="text-xs text-gray-500">ID: {accountId(account)}</span>
                    </div>
                ) : null}

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Sàn giao dịch</label>
                    <select
                        value={platform}
                        onChange={(event) => setPlatform(event.target.value as Platform)}
                        disabled={saving}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm dark:border-gray-800 dark:bg-gray-900"
                    >
                        {PLATFORMS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Nhãn tài khoản</label>
                    <input
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        disabled={saving}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm dark:border-gray-800 dark:bg-gray-900"
                        placeholder="Ví dụ: Binance chính"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">API key</label>
                    <input
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        disabled={saving}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 font-mono text-sm dark:border-gray-800 dark:bg-gray-900"
                        placeholder="Để trống nếu không đổi"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Secret key</label>
                    <input
                        type="password"
                        value={secretKey}
                        onChange={(event) => setSecretKey(event.target.value)}
                        disabled={saving}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 font-mono text-sm dark:border-gray-800 dark:bg-gray-900"
                        placeholder="Để trống nếu không đổi"
                    />
                </div>

                {platform === "OKX" ? (
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Passphrase</label>
                        <input
                            type="password"
                            value={passphrase}
                            onChange={(event) => setPassphrase(event.target.value)}
                            disabled={saving}
                            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 font-mono text-sm dark:border-gray-800 dark:bg-gray-900"
                            placeholder="Để trống nếu không đổi"
                        />
                    </div>
                ) : null}

                <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
                    <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={saving} />
                    <span>Tài khoản đang hoạt động</span>
                </label>

                {credentialChanged ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        Credential hoặc sàn đã thay đổi. Sau khi lưu, trạng thái xác minh sẽ về “Chưa xác minh”, quyền giao dịch bị tắt và cần kiểm tra kết nối lại.
                    </div>
                ) : null}

                <div className="flex justify-end gap-3">
                    <Link href="/accounts" className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-800">Hủy</Link>
                    <button disabled={!canSubmit} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </div>
    );
}
