"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { accountsService } from "@/services/accounts.service";
import { botProfilesService } from "@/services/botProfiles.service";
import { productRiskPreset } from "@/services/productBot.service";
import type { Account } from "@/types/account";
import type { BotAllowedDirections, ProductBotDefaults, ProductRiskLevel } from "@/types/botProfile";

const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

const officialPolicy = {
    contextTimeframes: "H1,M30,M15",
    triggerTimeframe: "M5",
    allowedDirections: "BOTH" as BotAllowedDirections,
    maxAutoSymbols: 20,
    maxNewEntriesPerScan: 1,
    dailyLossLimitPercent: 2,
    maxConcurrentPositions: 1,
    maxPositionsPerSymbol: 1,
    maxTradesPerHour: 1,
    marginType: "ISOLATED" as const,
    maxNotionalPerTradeUsdt: 1000,
    maxLossPerTradeUsdt: 10,
    martingaleEnabled: false,
    averagingDownEnabled: false,
};

export default function BotProfileCreatePage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountId, setAccountId] = useState("");
    const [name, setName] = useState("");
    const [maxMarginPerTradeUsdt, setMaxMarginPerTradeUsdt] = useState(100);
    const [maxLeverage, setMaxLeverage] = useState(10);
    const [productDefaults, setProductDefaults] = useState<ProductBotDefaults | null>(null);
    const [riskLevel, setRiskLevel] = useState<ProductRiskLevel>("MEDIUM");
    const [riskPerTradePercent, setRiskPerTradePercent] = useState(0.5);
    const [dailyLossLimitPercent, setDailyLossLimitPercent] = useState(officialPolicy.dailyLossLimitPercent);
    const [maxConcurrentPositions, setMaxConcurrentPositions] = useState(officialPolicy.maxConcurrentPositions);
    const [maxPositionsPerSymbol, setMaxPositionsPerSymbol] = useState(officialPolicy.maxPositionsPerSymbol);
    const [maxTradesPerHour, setMaxTradesPerHour] = useState(officialPolicy.maxTradesPerHour);
    const [maxNotionalPerTradeUsdt, setMaxNotionalPerTradeUsdt] = useState(officialPolicy.maxNotionalPerTradeUsdt);
    const [maxLossPerTradeUsdt, setMaxLossPerTradeUsdt] = useState(officialPolicy.maxLossPerTradeUsdt);
    const [contextTimeframes, setContextTimeframes] = useState(officialPolicy.contextTimeframes);
    const [triggerTimeframe, setTriggerTimeframe] = useState(officialPolicy.triggerTimeframe);
    const [allowedDirections, setAllowedDirections] = useState<BotAllowedDirections>(officialPolicy.allowedDirections);
    const [submitting, setSubmitting] = useState<"start" | "save" | null>(null);
    const [showValidation, setShowValidation] = useState(false);

    useEffect(() => {
        accountsService.findAll({ page: 1, limit: 500 })
            .then((res: any) => {
                const list = Array.isArray(res?.data) ? res.data as Account[] : [];
                setAccounts(list);
                setAccountId(list.find((account) => account.platform === "OKX" && account.connectionTarget === "OKX_DEMO")?._id ?? list.find((account) => account.isActive)?._id ?? list[0]?._id ?? "");
            })
            .catch((error) => toast.error(error?.message || "Không tải được tài khoản sàn"));
        botProfilesService.okxDemoAutoProductDefaults()
            .then((defaults) => {
                setProductDefaults(defaults);
                setRiskLevel(defaults.defaultRiskLevel ?? "MEDIUM");
                const preset = productRiskPreset(defaults, defaults.defaultRiskLevel ?? "MEDIUM");
                setRiskPerTradePercent(preset.riskPerTradePercent);
                setDailyLossLimitPercent(preset.dailyLossLimitPercent);
                setMaxMarginPerTradeUsdt(defaults.maxMarginPerTradeUsdt);
                setMaxLeverage(defaults.maxLeverage);
                setMaxConcurrentPositions(defaults.maxConcurrentPositions);
                setMaxPositionsPerSymbol(defaults.maxPositionsPerSymbol);
                setMaxTradesPerHour(defaults.maxTradesPerHour);
                setMaxNotionalPerTradeUsdt(defaults.maxNotionalPerTradeUsdt);
                setMaxLossPerTradeUsdt(defaults.maxLossPerTradeUsdt);
                setContextTimeframes(defaults.contextTimeframes.join(","));
                setTriggerTimeframe(defaults.triggerTimeframe);
                setAllowedDirections(defaults.allowedDirections);
            })
            .catch(() => null);
    }, []);

    const selectedAccount = useMemo(() => accounts.find((account) => account._id === accountId), [accounts, accountId]);
    const executionNotice = selectedAccount?.platform === "OKX"
        ? "Bot có thể chạy và quét OKX Demo. Giao dịch tự động đang tạm khóa cho tới khi có chiến lược được duyệt."
        : null;
    const validationError = useMemo(() => {
        if (!name.trim()) return "Tên bot là bắt buộc.";
        if (!accountId) return "Chọn tài khoản sàn.";
        if (!selectedAccount || selectedAccount.isActive === false) return "Tài khoản sàn chưa hoạt động.";
        if (selectedAccount.platform !== "OKX" || selectedAccount.connectionTarget !== "OKX_DEMO") return "Flow một nút hiện chỉ hỗ trợ OKX Demo.";
        if (riskPerTradePercent <= 0 || riskPerTradePercent > 2) return "Mức rủi ro mỗi lệnh tối đa 2%.";
        if (dailyLossLimitPercent <= 0 || dailyLossLimitPercent > 5) return "Giới hạn lỗ ngày tối đa 5%.";
        if (maxMarginPerTradeUsdt <= 0 || maxMarginPerTradeUsdt > 100) return "Số tiền tối đa mỗi lệnh không vượt 100 USDT.";
        if (maxLeverage < 1 || maxLeverage > 10) return "Đòn bẩy không vượt 10x.";
        if (maxNotionalPerTradeUsdt <= 0 || maxNotionalPerTradeUsdt > 1000) return "Notional mỗi lệnh không vượt 1000 USDT.";
        if (maxLossPerTradeUsdt <= 0 || maxLossPerTradeUsdt > 10) return "Loss mỗi lệnh không vượt 10 USDT.";
        return null;
    }, [name, accountId, selectedAccount, riskPerTradePercent, dailyLossLimitPercent, maxMarginPerTradeUsdt, maxLeverage, maxNotionalPerTradeUsdt, maxLossPerTradeUsdt]);

    const applyRiskLevel = (level: ProductRiskLevel) => {
        setRiskLevel(level);
        const preset = productRiskPreset(productDefaults, level);
        setRiskPerTradePercent(preset.riskPerTradePercent);
        setDailyLossLimitPercent(preset.dailyLossLimitPercent);
    };

    const createBot = async (startAfterCreate: boolean) => {
        setShowValidation(true);
        if (validationError) {
            toast.error(validationError);
            return;
        }
        setSubmitting(startAfterCreate ? "start" : "save");
        try {
            const created = await botProfilesService.create({
                name: name.trim(),
                description: null,
                accountId,
                status: "STOPPED",
                symbolMode: "AUTO",
                maxAutoSymbols: productDefaults?.maxAutoSymbols ?? officialPolicy.maxAutoSymbols,
                maxNewEntriesPerScan: 1,
                contextTimeframes: contextTimeframes.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
                triggerTimeframe: triggerTimeframe.trim().toUpperCase(),
                riskPerTradePercent,
                dailyLossLimitPercent,
                maxConcurrentPositions,
                maxPositionsPerSymbol,
                maxTradesPerHour,
                maxLeverage,
                marginType: officialPolicy.marginType,
                maxMarginPerTradeUsdt,
                maxNotionalPerTradeUsdt,
                maxLossPerTradeUsdt,
                martingaleEnabled: officialPolicy.martingaleEnabled,
                averagingDownEnabled: officialPolicy.averagingDownEnabled,
                allowedDirections,
            });
            if (startAfterCreate) {
                await botProfilesService.start(created._id);
            }
            toast.success(startAfterCreate ? "Đã tạo và bật bot" : "Đã lưu bot");
            router.push(`/bot-profiles/${created._id}`);
        } catch (error: any) {
            toast.error(error?.message || "Tạo bot thất bại");
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                backHref="/bot-profiles"
                eyebrow="Bot của tôi"
                title="Tạo bot mới"
                description="Chọn OKX Demo và mức rủi ro đơn giản. Bot sẽ dùng universe AUTO, không cần nhập coin thủ công."
            />

            <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="grid gap-5 lg:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tên bot
                        <input className={`${inputClass} mt-2`} value={name} onChange={(e) => setName(e.target.value)} placeholder="OKX Demo Auto Bot" />
                    </label>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tài khoản sàn
                        <select className={`${inputClass} mt-2`} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            {accounts.map((account) => (
                                <option key={account._id} value={account._id}>
                                    {account.label || account._id} - {account.platform}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mức rủi ro
                        <select className={`${inputClass} mt-2`} value={riskLevel} onChange={(e) => applyRiskLevel(e.target.value as ProductRiskLevel)}>
                            <option value="LOW">LOW - thận trọng</option>
                            <option value="MEDIUM">MEDIUM - mặc định</option>
                            <option value="HIGH">HIGH - demo rủi ro cao hơn</option>
                        </select>
                    </label>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Universe
                        <input className={`${inputClass} mt-2`} value={`AUTO · tối đa ${productDefaults?.maxAutoSymbols ?? officialPolicy.maxAutoSymbols} thị trường`} readOnly />
                    </label>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mức rủi ro mỗi lệnh
                        <div className="relative mt-2">
                            <input type="number" step="0.01" className={`${inputClass} pr-12`} value={riskPerTradePercent} onChange={(e) => setRiskPerTradePercent(Number(e.target.value))} />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                        </div>
                    </label>
                </div>

                {selectedAccount ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                        <StatusBadge value={selectedAccount.platform} />
                        <StatusBadge value={selectedAccount.connectionTarget === "OKX_DEMO" ? "OKX Demo" : "Không phải OKX Demo"} tone={selectedAccount.connectionTarget === "OKX_DEMO" ? "dry" : "warning"} />
                        <StatusBadge value={selectedAccount.verificationStatus === "VERIFIED" ? "Đã kết nối" : "Chưa kiểm tra"} tone={selectedAccount.verificationStatus === "VERIFIED" ? "success" : "warning"} />
                        <StatusBadge value={selectedAccount.tradingEnabled ? "Quyền giao dịch bật" : "Quyền giao dịch tắt"} tone={selectedAccount.tradingEnabled ? "success" : "warning"} />
                        <StatusBadge value="AUTO universe" tone="dry" />
                    </div>
                ) : null}

                {executionNotice ? (
                    <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">{executionNotice}</div>
                ) : null}

                <details className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <summary className="cursor-pointer font-semibold text-gray-950 dark:text-white">Cài đặt nâng cao</summary>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Giới hạn lỗ ngày (%)
                            <input type="number" step="0.1" className={`${inputClass} mt-2`} value={dailyLossLimitPercent} onChange={(e) => setDailyLossLimitPercent(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Vị thế đồng thời
                            <input type="number" className={`${inputClass} mt-2`} value={maxConcurrentPositions} onChange={(e) => setMaxConcurrentPositions(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Vị thế mỗi coin
                            <input type="number" className={`${inputClass} mt-2`} value={maxPositionsPerSymbol} onChange={(e) => setMaxPositionsPerSymbol(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Số tiền tối đa mỗi lệnh
                            <input type="number" className={`${inputClass} mt-2`} value={maxMarginPerTradeUsdt} onChange={(e) => setMaxMarginPerTradeUsdt(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Đòn bẩy
                            <input type="number" className={`${inputClass} mt-2`} value={maxLeverage} onChange={(e) => setMaxLeverage(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Trade mỗi giờ
                            <input type="number" className={`${inputClass} mt-2`} value={maxTradesPerHour} onChange={(e) => setMaxTradesPerHour(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Notional tối đa (USDT)
                            <input type="number" className={`${inputClass} mt-2`} value={maxNotionalPerTradeUsdt} onChange={(e) => setMaxNotionalPerTradeUsdt(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Loss tối đa (USDT)
                            <input type="number" className={`${inputClass} mt-2`} value={maxLossPerTradeUsdt} onChange={(e) => setMaxLossPerTradeUsdt(Number(e.target.value))} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Khung bối cảnh
                            <input className={`${inputClass} mt-2`} value={contextTimeframes} onChange={(e) => setContextTimeframes(e.target.value.toUpperCase())} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Khung vào lệnh
                            <input className={`${inputClass} mt-2`} value={triggerTimeframe} onChange={(e) => setTriggerTimeframe(e.target.value.toUpperCase())} />
                        </label>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Hướng giao dịch
                            <select className={`${inputClass} mt-2`} value={allowedDirections} onChange={(e) => setAllowedDirections(e.target.value as BotAllowedDirections)}>
                                <option value="BOTH">Mua và bán</option>
                                <option value="LONG">Chỉ mua</option>
                                <option value="SHORT">Chỉ bán</option>
                            </select>
                        </label>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3">
                        <div>Margin: <b>{officialPolicy.marginType}</b></div>
                        <div>Martingale: <b>Tắt</b></div>
                        <div>Averaging down: <b>Tắt</b></div>
                    </div>
                </details>

                {showValidation && validationError ? (
                    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{validationError}</div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button disabled={!!submitting} onClick={() => createBot(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:text-gray-200">
                        Chỉ lưu, chưa bật
                    </button>
                    <button disabled={!!submitting} onClick={() => createBot(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                        {submitting === "start" ? "Đang tạo..." : "Tạo và BẬT BOT"}
                    </button>
                </div>
            </section>
        </div>
    );
}
