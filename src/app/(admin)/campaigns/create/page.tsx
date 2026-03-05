"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Select from "react-select";

import LoadingModal from "@/components/loadingModal/LoadingModal";
import { accountsService } from "@/services/accounts.service";
import { accountsSymbolsService } from "@/services/accountsSymbols.service";
import { cryptoExchangeCodesService } from "@/services/cryptoExchangeCodes.service";
import { ordersService, type PreviewOrderResponse } from "@/services/orders.service";
import type { Account } from "@/types/account";

type Opt = { value: string; label: string };
type UiMargin = "cross" | "isolated";
type UiOrderType = "MARKET" | "LIMIT";

// ✅ QUAN TRỌNG: chỉ lấy _id (Mongo)
function safeId(x: any) {
    return x?._id ?? "";
}

function maskAccountLabel(a: any) {
    return a?.label || a?.username || a?.uid || safeId(a) || "UNKNOWN";
}

function toBeMarginType(m: UiMargin): "CROSSED" | "ISOLATED" {
    return m === "cross" ? "CROSSED" : "ISOLATED";
}

// ✅ react-select dark styles
// const selectStyles = {
//     control: (base: any, state: any) => ({
//         ...base,
//         backgroundColor: "transparent",
//         borderColor: state.isFocused ? "rgba(99, 102, 241, 0.6)" : "rgba(31, 41, 55, 1)",
//         boxShadow: state.isFocused ? "0 0 0 2px rgba(99, 102, 241, 0.25)" : "none",
//         minHeight: "44px",
//     }),
//     menu: (base: any) => ({
//         ...base,
//         backgroundColor: "rgba(17, 24, 39, 1)",
//         color: "rgba(243, 244, 246, 1)",
//     }),
//     option: (base: any, state: any) => ({
//         ...base,
//         backgroundColor: state.isFocused ? "rgba(31, 41, 55, 1)" : "transparent",
//         color: "rgba(243, 244, 246, 1)",
//         cursor: "pointer",
//     }),
//     singleValue: (base: any) => ({
//         ...base,
//         color: "rgba(243, 244, 246, 1)",
//     }),
//     input: (base: any) => ({
//         ...base,
//         color: "rgba(243, 244, 246, 1)",
//     }),
//     placeholder: (base: any) => ({
//         ...base,
//         color: "rgba(156, 163, 175, 1)",
//     }),
// };

const inputClass =
    "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 " +
    "focus:outline-none focus:ring-2 focus:ring-brand-500/40 " +
    "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

export default function CampaignCreatePage() {
    const router = useRouter();

    const [bootLoading, setBootLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [modalText, setModalText] = useState("Đang xử lý...");
    const submittingRef = useRef(false);
    const [error, setError] = useState<string | null>(null);

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountId, setAccountId] = useState(""); // ✅ luôn là _id

    const [codeId, setCodeId] = useState("");
    const [codesLoading, setCodesLoading] = useState(false);

    const [margin, setMargin] = useState<UiMargin>("cross");
    const [orderType, setOrderType] = useState<UiOrderType>("LIMIT");

    const [leverage, setLeverage] = useState(20);
    const [money, setMoney] = useState(100);

    const [symbolsLoading, setSymbolsLoading] = useState(false);
    const [symbols, setSymbols] = useState<string[]>([]);
    const [symbolOpt, setSymbolOpt] = useState<Opt | null>(null);

    const [preview, setPreview] = useState<PreviewOrderResponse | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // ✅ Boot: load accounts
    useEffect(() => {
        const boot = async () => {
            setBootLoading(true);
            setError(null);

            try {
                const accRes = await accountsService.findAll({ page: 1, limit: 500 });

                // tuỳ service bạn trả về: có thể là accRes.data.data hoặc accRes.data
                const accList =
                    Array.isArray((accRes as any)?.data?.data) ? (accRes as any).data.data :
                        Array.isArray((accRes as any)?.data) ? (accRes as any).data :
                            [];

                setAccounts(accList);

                // ✅ set mặc định đúng _id
                setAccountId(accList?.[0]?._id ?? "");

                // DEBUG (xem đúng object chưa)
                // console.log("first account:", accList?.[0]);
            } catch (e: any) {
                setError(e?.message || "Boot failed");
            } finally {
                setBootLoading(false);
            }
        };

        boot();
    }, []);

    const selectedAccount = useMemo(
        () => accounts.find((a: any) => (a as any)?._id === accountId),
        [accounts, accountId]
    );

    const exchangeId = useMemo(
        () => (selectedAccount as any)?.crypto_exchange_id ?? "",
        [selectedAccount]
    );

    // ✅ load code mapping
    useEffect(() => {
        const loadCodeId = async () => {
            if (!exchangeId) {
                setCodeId("");
                return;
            }
            setCodesLoading(true);
            setCodeId("");

            try {
                const firstCodeId = await cryptoExchangeCodesService.findFirstCodeIdByExchange(exchangeId);
                if (!firstCodeId) {
                    const msg = "Exchange này chưa được map Code. Hãy tạo mapping trong crypto-exchange-codes.";
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

    // ✅ load symbols theo accountId (_id)
    useEffect(() => {
        const loadSymbols = async () => {
            if (!accountId) {
                setSymbols([]);
                setSymbolOpt(null);
                return;
            }

            setSymbolsLoading(true);
            setSymbolOpt(null);

            try {
                const res = await accountsSymbolsService.getSymbols({ accountId, limit: 500 });
                setSymbols(Array.isArray((res as any)?.symbols) ? (res as any).symbols : []);
            } catch (e: any) {
                setSymbols([]);
                toast.error(e?.message || "Load symbols failed");
            } finally {
                setSymbolsLoading(false);
            }
        };

        loadSymbols();
    }, [accountId]);

    const symbolOptions: Opt[] = useMemo(
        () => symbols.filter((s) => s.endsWith("USDT")).map((s) => ({ value: s, label: s })),
        [symbols]
    );

    const validationError = useMemo(() => {
        if (!accountId) return "Bạn chưa chọn Tài khoản.";
        if (!selectedAccount) return "Tài khoản không tồn tại.";
        if ((selectedAccount as any)?.isActive === false) return "Tài khoản đang bị vô hiệu hoá (isActive=false).";
        if (!symbolOpt?.value) return "Bạn chưa chọn Cặp giao dịch (Symbol).";
        if (Number(leverage) < 1) return "Đòn bẩy phải >= 1.";
        if (Number(leverage) > 30) return "Đòn bẩy tối đa là 30.";
        if (Number(money) <= 0) return "Số tiền phải > 0.";
        return null;
    }, [accountId, selectedAccount, symbolOpt, leverage, money]);

    const canAnalyze = !validationError && !openModal && !codesLoading && !symbolsLoading;

    const onAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validationError) {
            setError(validationError);
            toast.error(validationError);
            return;
        }

        if (submittingRef.current) return;
        submittingRef.current = true;

        setOpenModal(true);
        setModalText("Đang phân tích (preview)...");
        setError(null);
        setPreview(null);

        try {
            const res = await ordersService.preview(accountId, {
                symbol: symbolOpt!.value,
                orderType,
                usdAmount: Number(money),
                leverage: Number(leverage),
                marginType: toBeMarginType(margin),
                timeframes: ["15m", "1h", "4h"],
            });

            if (!res.ok) {
                toast.info(res.message);
                setPreview(res);
                setConfirmOpen(false);
                return;
            }

            setPreview(res);
            setConfirmOpen(true);
            toast.success("Phân tích xong ✅");
        } catch (err: any) {
            const msg = err?.message || "Preview thất bại ❌";
            toast.error(msg);
            setError(msg);
        } finally {
            submittingRef.current = false;
            setOpenModal(false);
        }
    };

    const onExecute = async () => {
        if (!preview || !preview.ok) return;
        if (!preview.planId) return;

        if (submittingRef.current) return;
        submittingRef.current = true;

        setOpenModal(true);
        setModalText("Đang đặt lệnh (execute)...");
        setError(null);

        try {
            await ordersService.execute(accountId, { planId: preview.planId });
            toast.success("Đã đặt lệnh thành công ✅");
            router.push("/orders");
        } catch (err: any) {
            const msg = err?.message || "Execute thất bại ❌";
            toast.error(msg);
            setError(msg);
        } finally {
            submittingRef.current = false;
            setOpenModal(false);
        }
    };

    if (bootLoading) return <div className="text-gray-900 dark:text-gray-100">Loading...</div>;

    return (
        <div className="max-w-xl space-y-4 text-gray-900 dark:text-gray-100">
            <LoadingModal open={openModal} text={modalText} />

            <h1 className="text-xl font-semibold">Tạo lệnh (Phân tích → Xác nhận → Đặt lệnh)</h1>

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {error}
                </div>
            )}

            <form onSubmit={onAnalyze} className="space-y-4">
                <div>
                    <label className="block mb-1 text-sm">Tài khoản</label>

                    {/* ✅ value luôn là _id */}
                    <select
                        className={inputClass}
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        disabled={openModal}
                    >
                        {accounts.map((a: any) => (
                            <option key={a._id} value={a._id}>
                                {maskAccountLabel(a)}
                                {(a?.isActive === false ? " (inactive)" : "")}
                            </option>
                        ))}
                    </select>

                    {selectedAccount?.isActive === false && (
                        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                            Tài khoản này đang isActive=false, hãy bật lại ở trang Accounts để chọn và lấy symbols.
                        </p>
                    )}
                </div>

                <div>
                    <label className="block mb-1 text-sm">Cặp giao dịch (Symbol)</label>
                    <Select
                        isDisabled={openModal || !accountId || (selectedAccount as any)?.isActive === false}
                        isLoading={symbolsLoading}
                        options={symbolOptions}
                        value={symbolOpt}
                        onChange={(v) => setSymbolOpt(v as Opt)}
                        placeholder={accountId ? "Gõ để tìm (vd: ETH)" : "Chọn tài khoản trước"}
                        isClearable
                        className="react-select-container"
                        classNamePrefix="rs"
                    />
                </div>

                <div>
                    <label className="block mb-1 text-sm">Loại lệnh</label>
                    <select
                        className={inputClass}
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as UiOrderType)}
                        disabled={openModal}
                    >
                        <option value="LIMIT">LIMIT</option>
                        <option value="MARKET">MARKET</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-1 text-sm">Chế độ ký quỹ</label>
                    <select
                        className={inputClass}
                        value={margin}
                        onChange={(e) => setMargin(e.target.value as UiMargin)}
                        disabled={openModal}
                    >
                        <option value="cross">Cross (Chung)</option>
                        <option value="isolated">Isolated (Tách biệt)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block mb-1 text-sm">Đòn bẩy (tối đa 30)</label>
                        <input
                            type="number"
                            min={1}
                            max={30}
                            className={inputClass}
                            value={leverage}
                            onChange={(e) => setLeverage(Number(e.target.value))}
                            disabled={openModal}
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm">Số tiền (USDT)</label>
                        <input
                            type="number"
                            min={1}
                            className={inputClass}
                            value={money}
                            onChange={(e) => setMoney(Number(e.target.value))}
                            disabled={openModal}
                        />
                    </div>
                </div>

                <button
                    disabled={!canAnalyze}
                    className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    Phân tích (Xem trước)
                </button>

                {validationError && <p className="text-xs text-red-600">{validationError}</p>}
            </form>

            {confirmOpen && preview && preview.ok && (
                <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Xác nhận vào lệnh</h2>
                        <button className="text-sm opacity-70 hover:opacity-100" onClick={() => setConfirmOpen(false)}>
                            Đóng
                        </button>
                    </div>

                    <div className="text-sm space-y-1">
                        <div><b>Side:</b> {(preview as any).side}</div>
                        <div><b>Entry:</b> {(preview as any).entry}</div>
                        <div><b>SL:</b> {(preview as any).sl}</div>
                        <div><b>TP:</b> {(preview as any).tp?.join(", ")}</div>
                        <div><b>Preview Price:</b> {(preview as any).previewPrice}</div>
                        <div><b>Allowed Deviation:</b> {(preview as any).allowedDeviation}</div>
                    </div>

                    {!!(preview as any).reasons?.length && (
                        <div className="text-sm">
                            <div className="font-semibold mb-1">Lý do</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {(preview as any).reasons.map((r: any, idx: number) => (
                                    <li key={idx}>
                                        <b>[{r.tag}]</b> {r.text} <span className="opacity-70">(w={r.weight})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={onExecute}
                        className="w-full px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                        Xác nhận vào lệnh (Execute)
                    </button>
                </div>
            )}

            {preview && !(preview as any).ok && (
                <div className="rounded-xl border border-gray-200 p-4 text-sm bg-white dark:border-gray-800 dark:bg-gray-900">
                    <b>Không vào lệnh:</b> {(preview as any).message}
                </div>
            )}
        </div>
    );
}