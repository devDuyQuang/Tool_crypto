"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { accountsService } from "@/services/accounts.service";
import { productRiskPreset } from "@/services/productBot.service";
import type { Account } from "@/types/account";
import type { BotProfile, DecisionJournal, ProductBotDefaults, ProductRiskLevel, RuntimeStatus } from "@/types/botProfile";

type BotCardProps = {
    bot: BotProfile;
    runtime?: RuntimeStatus | null;
    latestDecision?: DecisionJournal | null;
    environmentSource?: string | null;
    accounts?: Account[];
    productDefaults?: ProductBotDefaults | null;
    onAccountChange?: (accountId: string) => void;
    onRiskLevelChange?: (riskLevel: ProductRiskLevel) => void;
    onPositionSizeChange?: (amountUsdt: number) => void;
    onStart?: () => void;
    onPause?: () => void;
    onStop?: () => void;
};

function accountId(account: Account) {
    return account._id ?? account.id ?? "";
}

function riskLevelForBot(bot: BotProfile, defaults?: ProductBotDefaults | null): ProductRiskLevel {
    const levels: ProductRiskLevel[] = ["LOW", "MEDIUM", "HIGH"];
    const matched = levels.find((level) => {
        const preset = productRiskPreset(defaults, level);
        return Math.abs(Number(bot.riskPerTradePercent) - preset.riskPerTradePercent) < 0.0001;
    });
    return matched ?? "MEDIUM";
}

function formatPnl(value?: number | null) {
    const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
    const sign = amount > 0 ? "+" : amount < 0 ? "-" : "+";
    return `${sign}$${Math.abs(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function BotCard({
    bot,
    runtime,
    accounts = [],
    productDefaults,
    onAccountChange,
    onRiskLevelChange,
    onPositionSizeChange,
    onStart,
    onPause,
    onStop,
}: BotCardProps) {
    const [isOpenApiModal, setIsOpenApiModal] = useState(false);
    const [apiForm, setApiForm] = useState({ apiKey: "", secretKey: "", passphrase: "" });
    const [savingApi, setSavingApi] = useState(false);

    const riskLevel = riskLevelForBot(bot, productDefaults);
    const isRunning = bot.status === "RUNNING";
    const isArchived = bot.status === "ARCHIVED";
    const pnlToday = 0;
    const pnlTone = pnlToday < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
    const selectedAccount = accounts.find((account) => accountId(account) === bot.accountId);

    const saveApiAccount = async () => {
        const apiKey = apiForm.apiKey.trim();
        const secretKey = apiForm.secretKey.trim();
        const passphrase = apiForm.passphrase.trim();

        if (!apiKey || !secretKey || !passphrase) {
            toast.error("Nhập đủ API Key, Secret Key và Passphrase.");
            return;
        }

        setSavingApi(true);
        try {
            const created = await accountsService.create({
                platform: "OKX",
                label: `OKX ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
                apiKey,
                secretKey,
                passphrase,
                connectionTarget: "OKX_DEMO",
            });
            const id = created._id ?? created.id;
            if (!id) throw new Error("Backend chưa trả account id.");

            const verified = await accountsService.verify(id);
            if (!verified.ok) throw new Error(verified.message || "Không xác minh được tài khoản.");

            await accountsService.update(id, { tradingEnabled: true }).catch(() => undefined);
            onAccountChange?.(id);
            setApiForm({ apiKey: "", secretKey: "", passphrase: "" });
            setIsOpenApiModal(false);
            toast.success("Đã lưu tài khoản OKX Sandbox cho bot.");
        } catch (error: any) {
            toast.error(error?.message || "Không lưu được tài khoản API.");
        } finally {
            setSavingApi(false);
        }
    };

    const toggleBot = () => {
        if (isRunning) {
            (onStop ?? onPause)?.();
            return;
        }
        onStart?.();
    };

    return (
        <article className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex w-full flex-col space-y-3">
                <div className="flex w-full flex-col space-y-2">
                    <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <Link href={`/bot-profiles/${bot._id}`} className="block truncate text-base font-semibold text-gray-950 hover:text-brand-600 dark:text-white">
                                {bot.name}
                            </Link>
                            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                {selectedAccount?.label || selectedAccount?.username || "Chưa kết nối tài khoản OKX"}
                            </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isRunning ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"}`}>
                            {isRunning ? "Đang hoạt động" : "Đã dừng"}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOpenApiModal((current) => !current)}
                        className="h-10 w-full rounded-xl border border-brand-100 bg-brand-50 px-3 text-left text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-950/30 dark:text-brand-200 dark:hover:bg-brand-950/50"
                    >
                        ➕ Kết nối API Sàn (OKX)
                    </button>
                </div>

                {isOpenApiModal ? (
                    <div className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.04]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-950 dark:text-white">Cài đặt API OKX</h3>
                                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Dán API Sandbox để lưu và gắn trực tiếp vào bot này.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpenApiModal(false)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/[0.08]"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mt-3 flex w-full flex-col space-y-3">
                            <label className="block w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                API Key
                                <input
                                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm normal-case text-gray-900 outline-none focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                                    value={apiForm.apiKey}
                                    onChange={(event) => setApiForm((current) => ({ ...current, apiKey: event.target.value }))}
                                    autoComplete="off"
                                />
                            </label>

                            <label className="block w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                Secret Key
                                <input
                                    type="password"
                                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm normal-case text-gray-900 outline-none focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                                    value={apiForm.secretKey}
                                    onChange={(event) => setApiForm((current) => ({ ...current, secretKey: event.target.value }))}
                                    autoComplete="new-password"
                                />
                            </label>

                            <label className="block w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                Passphrase
                                <input
                                    type="password"
                                    className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm normal-case text-gray-900 outline-none focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                                    value={apiForm.passphrase}
                                    onChange={(event) => setApiForm((current) => ({ ...current, passphrase: event.target.value }))}
                                    autoComplete="new-password"
                                />
                            </label>

                            <button
                                type="button"
                                disabled={savingApi}
                                onClick={saveApiAccount}
                                className="h-11 w-full rounded-xl bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
                            >
                                {savingApi ? "Đang lưu..." : "Lưu API"}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="flex w-full flex-col space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/[0.03]">
                    <label className="block w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Tài khoản sàn
                        <select
                            className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm normal-case text-gray-900 outline-none focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                            value={bot.accountId}
                            onChange={(event) => onAccountChange?.(event.target.value)}
                        >
                            {accounts.length ? accounts.map((account) => (
                                <option key={accountId(account)} value={accountId(account)}>
                                    {account.label || account.username || account.platform}
                                </option>
                            )) : (
                                <option value={bot.accountId}>Chưa có tài khoản</option>
                            )}
                        </select>
                    </label>

                    <label className="block w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Mức rủi ro
                        <select
                            className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm normal-case text-gray-900 outline-none focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                            value={riskLevel}
                            onChange={(event) => onRiskLevelChange?.(event.target.value as ProductRiskLevel)}
                        >
                            <option value="LOW">Thận trọng</option>
                            <option value="MEDIUM">Cân bằng</option>
                            <option value="HIGH">Tăng trưởng</option>
                        </select>
                    </label>

                    <label className="block w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Số tiền mỗi lệnh (USDT)
                        <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="decimal"
                            className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm normal-case text-gray-900 outline-none focus:border-brand-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                            defaultValue={Number(bot.maxNotionalPerTradeUsdt ?? 0) || ""}
                            onBlur={(event) => {
                                const amount = Number(event.target.value);
                                if (Number.isFinite(amount) && amount > 0 && amount !== Number(bot.maxNotionalPerTradeUsdt ?? 0)) {
                                    onPositionSizeChange?.(amount);
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="flex w-full flex-col space-y-3 rounded-2xl border border-gray-100 p-3 dark:border-gray-800">
                    <div className="w-full">
                        <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Lời/Lỗ hôm nay</p>
                        <p className={`mt-1 text-3xl font-bold tracking-normal ${pnlTone}`}>{formatPnl(pnlToday)}</p>
                    </div>

                    <button
                        type="button"
                        disabled={isArchived}
                        onClick={toggleBot}
                        className={`h-12 w-full rounded-2xl text-sm font-bold uppercase tracking-normal text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700 ${isRunning ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700"}`}
                    >
                        {isRunning ? "DỪNG BOT" : "BẬT BOT"}
                    </button>
                </div>
            </div>
        </article>
    );
}
