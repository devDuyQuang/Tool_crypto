"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotProfile } from "@/types/botProfile";

const inputClass = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

export default function BotProfileDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const [profile, setProfile] = useState<BotProfile | null>(null);
    const [symbol, setSymbol] = useState("");
    const [priority, setPriority] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setProfile(await botProfilesService.findOne(id));
        } catch (error: any) {
            toast.error(error?.message || "Load BotProfile failed");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const addSymbol = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!symbol.trim()) return;
        try {
            await botProfilesService.addSymbol(id, { symbol, priority });
            setSymbol("");
            setPriority((value) => value + 1);
            toast.success("Đã thêm symbol");
            await load();
        } catch (error: any) {
            toast.error(error?.message || "Add symbol failed");
        }
    };

    const setEnabled = async (symbolId: string, enabled: boolean) => {
        try {
            await botProfilesService.updateSymbol(id, symbolId, { enabled });
            await load();
        } catch (error: any) {
            toast.error(error?.message || "Update symbol failed");
        }
    };

    const removeSymbol = async (symbolId: string) => {
        if (!confirm("Xóa symbol khỏi universe?")) return;
        try {
            await botProfilesService.removeSymbol(id, symbolId);
            await load();
        } catch (error: any) {
            toast.error(error?.message || "Remove symbol failed");
        }
    };

    const archive = async () => {
        if (!confirm("Lưu trữ BotProfile này?")) return;
        try {
            await botProfilesService.archive(id);
            await load();
            toast.success("Đã lưu trữ");
        } catch (error: any) {
            toast.error(error?.message || "Archive failed");
        }
    };

    if (loading) return <div className="text-gray-900 dark:text-gray-100">Loading...</div>;
    if (!profile) return <div className="text-gray-900 dark:text-gray-100">BotProfile not found.</div>;

    const archived = profile.status === "ARCHIVED";

    return (
        <div className="space-y-5 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{profile.name}</h1>
                    <p className="text-sm opacity-70">{profile.mode} / {profile.status} / {profile.platform} {profile.environment}</p>
                </div>
                <div className="flex gap-2">
                    <Link className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-800" href={`/bot-profiles/${id}/edit`}>Chỉnh sửa</Link>
                    <button disabled={archived} onClick={archive} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50">Lưu trữ</button>
                </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
                <div><b>Context:</b> {profile.contextTimeframes.join(", ")}</div>
                <div><b>Trigger:</b> {profile.triggerTimeframe}</div>
                <div><b>Directions:</b> {profile.allowedDirections}</div>
                <div><b>Risk/trade:</b> {profile.riskPerTradePercent}%</div>
                <div><b>Daily loss:</b> {profile.dailyLossLimitPercent}%</div>
                <div><b>Max leverage:</b> {profile.maxLeverage}</div>
            </div>

            <section className="space-y-3">
                <h2 className="font-semibold">Symbol Universe</h2>
                {!archived && (
                    <form onSubmit={addSymbol} className="flex gap-2">
                        <input className={inputClass} placeholder="BTCUSDT" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
                        <input className={inputClass + " max-w-28"} type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
                        <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">Lưu</button>
                    </form>
                )}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-200 text-left dark:border-gray-800">
                            <tr><th className="p-3">Symbol</th><th className="p-3">Enabled</th><th className="p-3">Priority</th><th className="p-3 text-right">Thao tác</th></tr>
                        </thead>
                        <tbody>
                            {profile.symbols.length === 0 ? (
                                <tr><td className="p-3" colSpan={4}>Chưa có symbol.</td></tr>
                            ) : profile.symbols.map((row) => (
                                <tr key={row._id} className="border-b border-gray-100 dark:border-gray-800">
                                    <td className="p-3 font-medium">{row.symbol}</td>
                                    <td className="p-3">{row.enabled ? "ON" : "OFF"}</td>
                                    <td className="p-3">{row.priority}</td>
                                    <td className="p-3">
                                        <div className="flex justify-end gap-3">
                                            <button disabled={archived} className="text-brand-600 disabled:opacity-50" onClick={() => setEnabled(row._id, !row.enabled)}>
                                                {row.enabled ? "Tạm dừng" : "Bật lại"}
                                            </button>
                                            <button disabled={archived} className="text-red-600 disabled:opacity-50" onClick={() => removeSymbol(row._id)}>Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="font-semibold">Audit</h2>
                <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                    {(profile.audits || []).length === 0 ? "Chưa có audit." : profile.audits?.map((audit) => (
                        <div key={audit._id} className="border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
                            {audit.action} <span className="opacity-60">{audit.createdAt}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
