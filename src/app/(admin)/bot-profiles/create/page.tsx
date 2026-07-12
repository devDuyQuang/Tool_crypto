"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotAllowedDirections, BotProfileMode } from "@/types/botProfile";

const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

export default function BotProfileCreatePage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountId, setAccountId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState<BotProfileMode>("DRY_RUN");
    const [contextTimeframes, setContextTimeframes] = useState("H4,H1");
    const [triggerTimeframe, setTriggerTimeframe] = useState("M15");
    const [riskPerTradePercent, setRiskPerTradePercent] = useState(1);
    const [dailyLossLimitPercent, setDailyLossLimitPercent] = useState(3);
    const [maxConcurrentPositions, setMaxConcurrentPositions] = useState(1);
    const [maxLeverage, setMaxLeverage] = useState(1);
    const [allowedDirections, setAllowedDirections] = useState<BotAllowedDirections>("BOTH");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        accountsService.findAll({ page: 1, limit: 500 })
            .then((res: any) => {
                const list = Array.isArray(res?.data) ? res.data : [];
                setAccounts(list);
                setAccountId(list[0]?._id ?? "");
            })
            .catch((error) => toast.error(error?.message || "Load accounts failed"));
    }, []);

    const selectedAccount = useMemo(() => accounts.find((account) => account._id === accountId), [accounts, accountId]);
    const validationError = useMemo(() => {
        if (!name.trim()) return "Tên bot là bắt buộc.";
        if (!accountId) return "Chọn account.";
        if (!selectedAccount || selectedAccount.isActive === false) return "Account không hoạt động.";
        if (riskPerTradePercent < 0 || riskPerTradePercent > 100) return "Risk/trade phải trong 0-100%.";
        if (dailyLossLimitPercent < 0 || dailyLossLimitPercent > 100) return "Daily loss limit phải trong 0-100%.";
        if (maxConcurrentPositions < 1) return "Max concurrent positions phải >= 1.";
        if (maxLeverage < 1) return "Max leverage phải >= 1.";
        return null;
    }, [name, accountId, selectedAccount, riskPerTradePercent, dailyLossLimitPercent, maxConcurrentPositions, maxLeverage]);

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (validationError) {
            toast.error(validationError);
            return;
        }
        setSubmitting(true);
        try {
            const created = await botProfilesService.create({
                name: name.trim(),
                description: description.trim() || null,
                accountId,
                mode,
                status: "DRAFT",
                contextTimeframes: contextTimeframes.split(",").map((item) => item.trim()).filter(Boolean),
                triggerTimeframe,
                riskPerTradePercent,
                dailyLossLimitPercent,
                maxConcurrentPositions,
                maxLeverage,
                allowedDirections,
            });
            toast.success("Đã lưu BotProfile");
            router.push(`/bot-profiles/${created._id}`);
        } catch (error: any) {
            toast.error(error?.message || "Create BotProfile failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={save} className="max-w-2xl space-y-4 text-gray-900 dark:text-gray-100">
            <h1 className="text-xl font-semibold">Tạo BotProfile</h1>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">
                Phase 2B chỉ lưu cấu hình. Không có START runtime và không tự đặt lệnh.
            </div>

            <label className="block text-sm">Tên<input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="block text-sm">Mô tả<input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
            <label className="block text-sm">Account
                <select className={inputClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    {accounts.map((account) => (
                        <option key={account._id} value={account._id}>
                            {account.label || account._id} - {account.platform}/{account.environment}
                        </option>
                    ))}
                </select>
            </label>
            <label className="block text-sm">Mode
                <select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as BotProfileMode)}>
                    <option value="DRY_RUN">DRY_RUN</option>
                    <option value="DEMO_AUTO">DEMO_AUTO (Draft only)</option>
                    <option value="LIVE">LIVE (Draft only)</option>
                </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">Context TF<input className={inputClass} value={contextTimeframes} onChange={(e) => setContextTimeframes(e.target.value)} /></label>
                <label className="block text-sm">Trigger TF<input className={inputClass} value={triggerTimeframe} onChange={(e) => setTriggerTimeframe(e.target.value)} /></label>
                <label className="block text-sm">Risk/trade %<input type="number" className={inputClass} value={riskPerTradePercent} onChange={(e) => setRiskPerTradePercent(Number(e.target.value))} /></label>
                <label className="block text-sm">Daily loss %<input type="number" className={inputClass} value={dailyLossLimitPercent} onChange={(e) => setDailyLossLimitPercent(Number(e.target.value))} /></label>
                <label className="block text-sm">Max positions<input type="number" className={inputClass} value={maxConcurrentPositions} onChange={(e) => setMaxConcurrentPositions(Number(e.target.value))} /></label>
                <label className="block text-sm">Max leverage<input type="number" className={inputClass} value={maxLeverage} onChange={(e) => setMaxLeverage(Number(e.target.value))} /></label>
            </div>
            <label className="block text-sm">Allowed directions
                <select className={inputClass} value={allowedDirections} onChange={(e) => setAllowedDirections(e.target.value as BotAllowedDirections)}>
                    <option value="BOTH">BOTH</option>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                </select>
            </label>

            {validationError && <p className="text-sm text-red-600">{validationError}</p>}
            <button disabled={submitting || !!validationError} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600 disabled:opacity-60">
                Lưu
            </button>
        </form>
    );
}
