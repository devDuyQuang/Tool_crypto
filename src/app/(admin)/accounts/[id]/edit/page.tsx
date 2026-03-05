// "use client";

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { toast } from "react-toastify";

// import LoadingModal from "@/components/loadingModal/LoadingModal";
// import { accountsService } from "@/services/accounts.service";
// import { cryptoExchangesService } from "@/services/cryptoExchanges.service";
// import type { CryptoExchange } from "@/types/cryptoExchange";

// type Platform = "BINANCE" | "OKX" | "BYBIT";

// function safeId(x: any) {
//     return x?._id ?? x?.id ?? "";
// }

// export default function AccountEditPage() {
//     const router = useRouter();
//     const params = useParams<{ id: string }>();
//     const id = params?.id;

//     const [exchanges, setExchanges] = useState<CryptoExchange[]>([]);
//     const [exchangeId, setExchangeId] = useState("");

//     const [platform, setPlatform] = useState<Platform>("BINANCE");
//     const [label, setLabel] = useState("");
//     const [apiKey, setApiKey] = useState("");
//     const [secretKey, setSecretKey] = useState("");
//     const [isActive, setIsActive] = useState(true);

//     const [loading, setLoading] = useState(true);
//     const [saving, setSaving] = useState(false);
//     const [openModal, setOpenModal] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const submittingRef = useRef(false);

//     useEffect(() => {
//         if (!id) return;

//         const load = async () => {
//             setError(null);
//             setLoading(true);

//             try {
//                 const [exRes, acc] = await Promise.all([
//                     cryptoExchangesService.findAll({ page: 1, limit: 50 }),
//                     accountsService.findOne(id),
//                 ]);

//                 const exItems = Array.isArray(exRes?.data) ? exRes.data : [];
//                 setExchanges(exItems);

//                 setPlatform((acc as any).platform || "BINANCE");
//                 setLabel((acc as any).label || "");
//                 setApiKey((acc as any).apiKey || "");
//                 setIsActive(Boolean((acc as any).isActive));

//                 const rawExId =
//                     (acc as any).crypto_exchange_id?._id ??
//                     (acc as any).crypto_exchange_id ??
//                     (acc as any).cryptoExchangeId;

//                 if (rawExId) setExchangeId(String(rawExId));

//                 if (!(acc as any).platform && rawExId) {
//                     const ex = exItems.find((x) => safeId(x) === String(rawExId));
//                     if (ex?.name) setPlatform(ex.name as Platform);
//                 }
//             } catch (e: any) {
//                 setError(e?.message || "Load failed");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         load();
//     }, [id]);

//     const payload = useMemo(() => {
//         const p: any = {
//             crypto_exchange_id: exchangeId,
//             platform,
//             label: label.trim(),
//             apiKey: apiKey.trim(),
//             isActive,
//         };
//         if (secretKey.trim()) p.secretKey = secretKey.trim();
//         return p;
//     }, [exchangeId, platform, label, apiKey, isActive, secretKey]);

//     const canSubmit = Boolean(payload.crypto_exchange_id && payload.label && payload.apiKey);

//     const onSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!canSubmit || !id) return;

//         if (submittingRef.current) return;
//         submittingRef.current = true;

//         setError(null);
//         setSaving(true);
//         setOpenModal(true);

//         try {
//             await accountsService.update(id, payload);
//             toast.success("Cập nhật account thành công ✅");

//             setOpenModal(false);
//             router.push("/accounts");
//             router.refresh();
//         } catch (e: any) {
//             toast.error(e?.message || "Update failed ❌");
//             setError(e?.message || "Update failed");
//             setOpenModal(false);
//         } finally {
//             submittingRef.current = false;
//             setSaving(false);
//         }
//     };

//     if (loading) return <div>Loading...</div>;

//     return (
//         <div className="max-w-xl space-y-4">
//             <LoadingModal open={openModal} text="Đang lưu..." />

//             <h1 className="text-xl font-semibold">Edit Account</h1>

//             {error && (
//                 <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
//                     {error}
//                 </div>
//             )}

//             <form onSubmit={onSubmit} className="space-y-4">
//                 <div>
//                     <label className="block mb-1 text-sm">Exchange</label>
//                     <select
//                         className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
//                         value={exchangeId}
//                         onChange={(e) => {
//                             const nextId = e.target.value;
//                             setExchangeId(nextId);

//                             const ex = exchanges.find((x) => safeId(x) === nextId);
//                             if (ex?.name) setPlatform(ex.name as Platform);
//                         }}
//                         disabled={saving}
//                     >
//                         {exchanges.map((ex) => {
//                             const exId = safeId(ex);
//                             return (
//                                 <option key={exId} value={exId}>
//                                     {ex.name}
//                                 </option>
//                             );
//                         })}
//                     </select>
//                 </div>

//                 <div>
//                     <label className="block mb-1 text-sm">Platform</label>
//                     <select
//                         className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
//                         value={platform}
//                         onChange={(e) => setPlatform(e.target.value as Platform)}
//                         disabled={saving}
//                     >
//                         {(["BINANCE", "OKX", "BYBIT"] as const).map((p) => (
//                             <option key={p} value={p}>
//                                 {p}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 <div>
//                     <label className="block mb-1 text-sm">Label</label>
//                     <input
//                         className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900"
//                         value={label}
//                         onChange={(e) => setLabel(e.target.value)}
//                         required
//                         disabled={saving}
//                     />
//                 </div>

//                 <div>
//                     <label className="block mb-1 text-sm">API Key</label>
//                     <input
//                         className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 font-mono"
//                         value={apiKey}
//                         onChange={(e) => setApiKey(e.target.value)}
//                         required
//                         disabled={saving}
//                     />
//                 </div>

//                 <div>
//                     <label className="block mb-1 text-sm">Secret Key (optional)</label>
//                     <input
//                         className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 font-mono"
//                         value={secretKey}
//                         onChange={(e) => setSecretKey(e.target.value)}
//                         placeholder="Để trống nếu không đổi"
//                         disabled={saving}
//                     />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     <input
//                         type="checkbox"
//                         checked={isActive}
//                         onChange={(e) => setIsActive(e.target.checked)}
//                         disabled={saving}
//                     />
//                     <span className="text-sm">Active</span>
//                 </div>

//                 <button
//                     disabled={saving || !canSubmit}
//                     className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
//                 >
//                     {saving ? "Saving..." : "Save"}
//                 </button>
//             </form>
//         </div>
//     );
// }
export default function AccountEditPage() {
    return <div>Coming soon</div>;
}
