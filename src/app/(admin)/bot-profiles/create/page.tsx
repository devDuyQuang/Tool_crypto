"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import type { Account } from "@/types/account";
import type { BotAllowedDirections } from "@/types/botProfile";

const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";
const steps = ["Tài khoản", "Thị trường", "Rủi ro", "Xác nhận"];

export default function BotProfileCreatePage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountId, setAccountId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [symbolText, setSymbolText] = useState("BTCUSDT,ETHUSDT,SOLUSDT");
    const [contextTimeframes, setContextTimeframes] = useState("H4,H1");
    const [triggerTimeframe, setTriggerTimeframe] = useState("M15");
    const [riskPerTradePercent, setRiskPerTradePercent] = useState(0.25);
    const [dailyLossLimitPercent, setDailyLossLimitPercent] = useState(1);
    const [maxConcurrentPositions, setMaxConcurrentPositions] = useState(1);
    const [maxLeverage, setMaxLeverage] = useState(1);
    const [allowedDirections, setAllowedDirections] = useState<BotAllowedDirections>("BOTH");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        accountsService.findAll({ page: 1, limit: 500 })
            .then((res: any) => {
                const list = Array.isArray(res?.data) ? res.data as Account[] : [];
                setAccounts(list);
                setAccountId(list.find((account) => account.isActive)?._id ?? list[0]?._id ?? "");
            })
            .catch((error) => toast.error(error?.message || "Không tải được tài khoản sàn"));
    }, []);

    const selectedAccount = useMemo(() => accounts.find((account) => account._id === accountId), [accounts, accountId]);
    const symbols = useMemo(() => Array.from(new Set(symbolText.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean))), [symbolText]);
    const validationError = useMemo(() => {
        if (!name.trim()) return "Tên bot là bắt buộc.";
        if (!accountId) return "Chọn tài khoản sàn.";
        if (!selectedAccount || selectedAccount.isActive === false) return "Tài khoản sàn không hoạt động.";
        if (symbols.length === 0) return "Thêm ít nhất một symbol.";
        if (symbols.length > 20) return "Tối đa 20 symbol cho mỗi bot.";
        if (riskPerTradePercent <= 0 || riskPerTradePercent > 2) return "Rủi ro mỗi lệnh tối đa 2%.";
        if (dailyLossLimitPercent <= 0 || dailyLossLimitPercent > 5) return "Giới hạn lỗ ngày tối đa 5%.";
        if (maxConcurrentPositions < 1) return "Số vị thế đồng thời phải >= 1.";
        if (maxLeverage < 1) return "Đòn bẩy tối đa phải >= 1.";
        return null;
    }, [name, accountId, selectedAccount, symbols, riskPerTradePercent, dailyLossLimitPercent, maxConcurrentPositions, maxLeverage]);

    const save = async () => {
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
                status: "STOPPED",
                contextTimeframes: contextTimeframes.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
                triggerTimeframe: triggerTimeframe.trim().toUpperCase(),
                riskPerTradePercent,
                dailyLossLimitPercent,
                maxConcurrentPositions,
                maxLeverage,
                allowedDirections,
            });

            await Promise.allSettled(symbols.map((symbol, index) => botProfilesService.addSymbol(created._id, { symbol, enabled: true, priority: index })));
            toast.success("Đã tạo bot");
            router.push(`/bot-profiles/${created._id}`);
        } catch (error: any) {
            toast.error(error?.message || "Tạo bot thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                backHref="/bot-profiles"
                eyebrow="Bot tự động"
                title="Tạo bot mới"
                description="Wizard này tạo cấu hình bot tự động. Môi trường giao dịch được quyết định bởi tài khoản sàn được chọn."
            />

            <div className="grid gap-2 sm:grid-cols-4">
                {steps.map((label, index) => (
                    <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-lg border px-3 py-3 text-left text-sm font-medium ${step === index ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-300" : "border-gray-200 bg-white text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"}`}>
                        <span className="block text-xs">Bước {index + 1}</span>
                        {label}
                    </button>
                ))}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                {step === 0 ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tên bot
                            <input className={`${inputClass} mt-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bot BTC/ETH/SOL" />
                            <span className="mt-1 block text-xs text-gray-500">Tên dễ hiểu để phân biệt bot vận hành.</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mô tả
                            <textarea className="mt-2 min-h-24 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tài khoản sàn
                            <select className={`${inputClass} mt-2`} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                {accounts.map((account) => (
                                    <option key={account._id} value={account._id}>
                                        {account.label || account._id} - {account.platform} {account.isActive ? "" : "(disabled)"}
                                    </option>
                                ))}
                            </select>
                            <span className="mt-1 block text-xs text-gray-500">Bot dùng đúng sàn và credential của tài khoản đã chọn.</span>
                        </label>
                        {selectedAccount ? <div className="flex flex-wrap gap-2"><StatusBadge value={selectedAccount.platform} /><StatusBadge value={selectedAccount.isActive ? "ACTIVE" : "DISABLED"} /></div> : null}
                    </div>
                ) : null}

                {step === 1 ? (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Symbol theo dõi
                            <input className={`${inputClass} mt-2`} value={symbolText} onChange={(e) => setSymbolText(e.target.value.toUpperCase())} />
                            <span className="mt-1 block text-xs text-gray-500">Cách nhau bằng dấu phẩy, ví dụ BTCUSDT,ETHUSDT,SOLUSDT. Backend sẽ validate instrument catalog.</span>
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Khung bối cảnh
                                <input className={`${inputClass} mt-2`} value={contextTimeframes} onChange={(e) => setContextTimeframes(e.target.value.toUpperCase())} />
                            </label>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Khung kích hoạt
                                <input className={`${inputClass} mt-2`} value={triggerTimeframe} onChange={(e) => setTriggerTimeframe(e.target.value.toUpperCase())} />
                            </label>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Hướng được phép
                            <select className={`${inputClass} mt-2`} value={allowedDirections} onChange={(e) => setAllowedDirections(e.target.value as BotAllowedDirections)}>
                                <option value="BOTH">Cả LONG và SHORT</option>
                                <option value="LONG">Chỉ LONG</option>
                                <option value="SHORT">Chỉ SHORT</option>
                            </select>
                        </label>
                    </div>
                ) : null}

                {step === 2 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Rủi ro mỗi lệnh (%)
                            <input type="number" className={`${inputClass} mt-2`} value={riskPerTradePercent} onChange={(e) => setRiskPerTradePercent(Number(e.target.value))} />
                            <span className="mt-1 block text-xs text-gray-500">Risk engine dùng mức này để tính quantity trước khi gửi qua OMS.</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Giới hạn lỗ ngày (%)
                            <input type="number" className={`${inputClass} mt-2`} value={dailyLossLimitPercent} onChange={(e) => setDailyLossLimitPercent(Number(e.target.value))} />
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Số vị thế đồng thời tối đa
                            <input type="number" className={`${inputClass} mt-2`} value={maxConcurrentPositions} onChange={(e) => setMaxConcurrentPositions(Number(e.target.value))} />
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Đòn bẩy tối đa
                            <input type="number" className={`${inputClass} mt-2`} value={maxLeverage} onChange={(e) => setMaxLeverage(Number(e.target.value))} />
                        </label>
                    </div>
                ) : null}

                {step === 3 ? (
                    <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div><b>Tên:</b> {name || "-"}</div>
                            <div><b>Tài khoản:</b> {selectedAccount ? `${selectedAccount.label || selectedAccount._id} (${selectedAccount.platform})` : "-"}</div>
                            <div><b>Symbol:</b> {symbols.join(", ") || "-"}</div>
                            <div><b>Khung:</b> {contextTimeframes} / {triggerTimeframe}</div>
                            <div><b>Hướng:</b> {allowedDirections}</div>
                            <div><b>Risk:</b> {riskPerTradePercent}% mỗi lệnh, {dailyLossLimitPercent}% mỗi ngày</div>
                            <div><b>Giới hạn:</b> {maxConcurrentPositions} vị thế, leverage {maxLeverage}x</div>
                        </div>
                        <div className="rounded-lg bg-sky-50 p-3 text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
                            Sau khi lưu, bot ở trạng thái STOPPED. START chỉ hoạt động khi tài khoản đã xác minh và được bật giao dịch.
                        </div>
                    </div>
                ) : null}
            </div>

            {validationError ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{validationError}</div> : null}

            <div className="flex justify-between">
                <button disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-800 dark:text-gray-200">
                    Quay lại
                </button>
                {step < steps.length - 1 ? (
                    <button onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">
                        Tiếp tục
                    </button>
                ) : (
                    <button disabled={submitting || !!validationError} onClick={save} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                        Lưu bot
                    </button>
                )}
            </div>
        </div>
    );
}
