"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Select from "react-select";

import LoadingModal from "@/components/loadingModal/LoadingModal";
import { campaignsService } from "@/services/campaigns.service";
import { accountsService } from "@/services/accounts.service";
import { accountsSymbolsService } from "@/services/accountsSymbols.service";
import { cryptoExchangeCodesService } from "@/services/cryptoExchangeCodes.service";

import type { Account } from "@/types/account";
import type { Campaign } from "@/types/campaign";

type Opt = { value: string; label: string };

function safeId(x: any) {
    return x?._id ?? x?.id ?? "";
}

function maskAccountLabel(a: any) {
    return a?.label || a?.apiKey || safeId(a) || "UNKNOWN";
}

function buildAutoName(params: {
    accountLabel: string;
    symbol: string;
    margin: "cross" | "isolated";
    leverage: number;
}) {
    const { accountLabel, symbol, margin, leverage } = params;
    return `${accountLabel}-${symbol}-${margin}-x${leverage}`;
}

export default function CampaignEditPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [bootLoading, setBootLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const submittingRef = useRef(false);

    const [error, setError] = useState<string | null>(null);

    // data
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountId, setAccountId] = useState("");

    // mapping codeId (auto)
    const [codeId, setCodeId] = useState("");
    const [codesLoading, setCodesLoading] = useState(false);

    // symbols
    const [symbolsLoading, setSymbolsLoading] = useState(false);
    const [symbols, setSymbols] = useState<string[]>([]);
    const [symbolOpt, setSymbolOpt] = useState<Opt | null>(null);

    // form
    const [margin, setMargin] = useState<"cross" | "isolated">("cross");
    const [leverage, setLeverage] = useState(20);
    const [money, setMoney] = useState(100);
    const [tp, setTp] = useState<number | "">("");
    const [sl, setSl] = useState<number | "">("");

    // load campaign + accounts
    useEffect(() => {
        if (!id) return;

        const boot = async () => {
            setBootLoading(true);
            setError(null);

            try {
                const [accRes, campRes] = await Promise.all([
                    accountsService.findAll({ page: 1, limit: 500 }),
                    campaignsService.findOne(id),
                ]);

                const accList = Array.isArray(accRes?.data) ? accRes.data : [];
                setAccounts(accList);

                const c = campRes as Campaign;

                // lấy account_id từ campaign
                const rawAccountId =
                    (c as any).account_id?._id ?? (c as any).account_id ?? (c as any).accountId ?? "";
                setAccountId(String(rawAccountId));

                // set form fields
                setMargin((c as any).margin ?? "cross");
                setLeverage(Number((c as any).leverage ?? 20));
                setMoney(Number((c as any).money ?? 100));
                setTp(typeof (c as any).tp === "number" ? (c as any).tp : "");
                setSl(typeof (c as any).sl === "number" ? (c as any).sl : "");

                // symbol (tạm set string trước, chờ symbols load xong sẽ match option)
                const sym = String((c as any).symbol ?? "").toUpperCase().trim();
                if (sym) setSymbolOpt({ value: sym, label: sym });
            } catch (e: any) {
                setError(e?.message || "Load campaign failed");
            } finally {
                setBootLoading(false);
            }
        };

        boot();
    }, [id]);

    const selectedAccount = useMemo(() => {
        return accounts.find((a: any) => safeId(a) === accountId);
    }, [accounts, accountId]);

    const exchangeId = useMemo(() => {
        return selectedAccount?.crypto_exchange_id ?? "";
    }, [selectedAccount]);

    // load codeId theo exchangeId (mapping)
    useEffect(() => {
        const loadCodeId = async () => {
            if (!exchangeId) {
                setCodeId("");
                return;
            }

            setCodesLoading(true);
            setCodeId("");

            try {
                const firstCodeId =
                    await cryptoExchangeCodesService.findFirstCodeIdByExchange(exchangeId);

                if (!firstCodeId) {
                    const msg =
                        "Exchange này chưa được map Code. Hãy tạo mapping trong crypto-exchange-codes.";
                    setError(msg);
                    toast.error(msg);
                    return;
                }

                setCodeId(firstCodeId);
            } catch (e: any) {
                const msg = e?.message || "Load codes failed";
                setError(msg);
                toast.error(msg);
            } finally {
                setCodesLoading(false);
            }
        };

        loadCodeId();
    }, [exchangeId]);

    // load symbols theo account
    useEffect(() => {
        const loadSymbols = async () => {
            if (!accountId) {
                setSymbols([]);
                setSymbolOpt(null);
                return;
            }

            setSymbolsLoading(true);

            try {
                const res = await accountsSymbolsService.getSymbols({ accountId, limit: 200 });
                const list = Array.isArray(res?.symbols) ? res.symbols : [];
                setSymbols(list);

                // nếu symbolOpt đang có value nhưng không nằm trong list thì clear
                if (symbolOpt?.value && !list.includes(symbolOpt.value)) {
                    setSymbolOpt(null);
                }
            } catch (e: any) {
                setSymbols([]);
                toast.error(e?.message || "Load symbols failed");
            } finally {
                setSymbolsLoading(false);
            }
        };

        loadSymbols();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    const symbolOptions: Opt[] = useMemo(() => {
        return symbols.map((s) => ({ value: s, label: s }));
    }, [symbols]);

    const autoName = useMemo(() => {
        const accountLabel = selectedAccount ? maskAccountLabel(selectedAccount) : "account";
        const symbol = symbolOpt?.value ?? "";
        if (!symbol) return "";
        return buildAutoName({ accountLabel, symbol, margin, leverage: Number(leverage) });
    }, [selectedAccount, symbolOpt, margin, leverage]);

    const validationError = useMemo(() => {
        if (!id) return "Missing campaign id";
        if (!accountId) return "Bạn chưa chọn Account.";
        if (!exchangeId) return "Account chưa có crypto_exchange_id.";
        if (!codeId) return "Chưa lấy được CodeId (exchange chưa map code hoặc API lỗi).";
        if (!symbolOpt?.value) return "Bạn chưa chọn Symbol.";
        if (Number(leverage) < 1) return "Leverage phải >= 1.";
        if (Number(money) < 0) return "Money phải >= 0.";
        if (tp !== "" && Number(tp) < 0) return "TP phải >= 0.";
        if (sl !== "" && Number(sl) < 0) return "SL phải >= 0.";
        return null;
    }, [id, accountId, exchangeId, codeId, symbolOpt, leverage, money, tp, sl]);

    const payload = useMemo(() => {
        const p: any = {
            // chỉ set name nếu có
            ...(autoName ? { name: autoName } : {}),
            symbol: symbolOpt?.value ?? "",
            margin,
            leverage: Number(leverage),
            money: Number(money),
        };
        if (tp !== "") p.tp = Number(tp);
        if (sl !== "") p.sl = Number(sl);
        return p;
    }, [autoName, symbolOpt, margin, leverage, money, tp, sl]);


    const canSubmit = !validationError && !openModal && !codesLoading && !symbolsLoading;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validationError) {
            setError(validationError);
            toast.error(validationError);
            return;
        }
        if (!id) return;

        if (submittingRef.current) return;
        submittingRef.current = true;

        setOpenModal(true);
        setError(null);

        try {
            await campaignsService.update(id, payload);
            toast.success("Cập nhật campaign thành công ✅");
            router.push("/campaigns");
            router.refresh();
        } catch (err: any) {
            const msg = err?.message || "Update thất bại ❌";
            toast.error(msg);
            setError(msg);
        } finally {
            submittingRef.current = false;
            setOpenModal(false);
        }
    };

    if (bootLoading) return <div>Loading...</div>;

    return (
        <div className="max-w-xl space-y-4">
            <LoadingModal open={openModal} text="Đang lưu..." />

            <h1 className="text-xl font-semibold">Edit Campaign</h1>

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                {/* Account */}
                <div>
                    <label className="block mb-1 text-sm">Account</label>
                    <select
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        disabled={openModal}
                    >
                        {accounts.map((a: any) => (
                            <option key={safeId(a)} value={safeId(a)}>
                                {maskAccountLabel(a)}
                            </option>
                        ))}
                    </select>

                    {selectedAccount?.platform && (
                        <p className="text-xs text-gray-500 mt-1">
                            Platform: <b>{selectedAccount.platform}</b>
                        </p>
                    )}
                </div>

                {/* Symbol */}
                <div>
                    <label className="block mb-1 text-sm">Symbol</label>
                    <Select
                        isDisabled={openModal || !accountId}
                        isLoading={symbolsLoading}
                        options={symbolOptions}
                        value={symbolOpt}
                        onChange={(v) => setSymbolOpt(v as Opt)}
                        placeholder={accountId ? "Gõ để tìm (vd: ETH)" : "Chọn account trước"}
                        isClearable
                    />
                    <p className="text-xs text-gray-500 mt-1">Symbol load theo sàn của account.</p>
                </div>

                {/* Margin */}
                <div>
                    <label className="block mb-1 text-sm">Margin</label>
                    <select
                        className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                        value={margin}
                        onChange={(e) => setMargin(e.target.value as any)}
                        disabled={openModal}
                    >
                        <option value="cross">cross</option>
                        <option value="isolated">isolated</option>
                    </select>
                </div>

                {/* Leverage / Money */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block mb-1 text-sm">Leverage</label>
                        <input
                            type="number"
                            min={1}
                            className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                            value={leverage}
                            onChange={(e) => setLeverage(Number(e.target.value))}
                            disabled={openModal}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm">Money</label>
                        <input
                            type="number"
                            min={0}
                            className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                            value={money}
                            onChange={(e) => setMoney(Number(e.target.value))}
                            disabled={openModal}
                        />
                    </div>
                </div>

                {/* TP / SL */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block mb-1 text-sm">TP (optional)</label>
                        <input
                            type="number"
                            min={0}
                            className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                            value={tp}
                            onChange={(e) => setTp(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={openModal}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm">SL (optional)</label>
                        <input
                            type="number"
                            min={0}
                            className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
                            value={sl}
                            onChange={(e) => setSl(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={openModal}
                        />
                    </div>
                </div>

                <button
                    disabled={!canSubmit}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    Save
                </button>
            </form>
        </div>
    );
}
