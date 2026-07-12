"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotAllowedDirections, BotProfile, BotProfileMode } from "@/types/botProfile";

const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";

export default function BotProfileEditPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;
    const [profile, setProfile] = useState<BotProfile | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [mode, setMode] = useState<BotProfileMode>("DRY_RUN");
    const [contextTimeframes, setContextTimeframes] = useState("");
    const [triggerTimeframe, setTriggerTimeframe] = useState("M15");
    const [riskPerTradePercent, setRiskPerTradePercent] = useState(1);
    const [dailyLossLimitPercent, setDailyLossLimitPercent] = useState(3);
    const [maxConcurrentPositions, setMaxConcurrentPositions] = useState(1);
    const [maxLeverage, setMaxLeverage] = useState(1);
    const [allowedDirections, setAllowedDirections] = useState<BotAllowedDirections>("BOTH");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        botProfilesService.findOne(id)
            .then((loaded) => {
                setProfile(loaded);
                setName(loaded.name);
                setDescription(loaded.description || "");
                setMode(loaded.mode);
                setContextTimeframes(loaded.contextTimeframes.join(","));
                setTriggerTimeframe(loaded.triggerTimeframe);
                setRiskPerTradePercent(loaded.riskPerTradePercent);
                setDailyLossLimitPercent(loaded.dailyLossLimitPercent);
                setMaxConcurrentPositions(loaded.maxConcurrentPositions);
                setMaxLeverage(loaded.maxLeverage);
                setAllowedDirections(loaded.allowedDirections);
            })
            .catch((error) => toast.error(error?.message || "Load BotProfile failed"));
    }, [id]);

    const save = async (status?: "DRAFT" | "PAUSED") => {
        if (!name.trim()) {
            toast.error("Tên bot là bắt buộc");
            return;
        }
        setSaving(true);
        try {
            await botProfilesService.update(id, {
                name: name.trim(),
                description: description.trim() || null,
                mode,
                status: status || profile?.status || "DRAFT",
                contextTimeframes: contextTimeframes.split(",").map((item) => item.trim()).filter(Boolean),
                triggerTimeframe,
                riskPerTradePercent,
                dailyLossLimitPercent,
                maxConcurrentPositions,
                maxLeverage,
                allowedDirections,
            });
            toast.success(status === "PAUSED" ? "Đã tạm dừng cấu hình" : "Đã lưu");
            router.push(`/bot-profiles/${id}`);
        } catch (error: any) {
            toast.error(error?.message || "Save BotProfile failed");
        } finally {
            setSaving(false);
        }
    };

    if (!profile) return <div className="text-gray-900 dark:text-gray-100">Loading...</div>;

    return (
        <div className="max-w-2xl space-y-4 text-gray-900 dark:text-gray-100">
            <h1 className="text-xl font-semibold">Chỉnh sửa BotProfile</h1>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300">
                Tạm dừng ở Phase 2B chỉ đổi trạng thái cấu hình. Không có runtime scheduler.
            </div>

            <label className="block text-sm">Tên<input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="block text-sm">Mô tả<input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
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

            <div className="flex gap-2">
                <button disabled={saving} onClick={() => save()} className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-60">Lưu</button>
                <button disabled={saving || mode !== "DRY_RUN"} onClick={() => save("PAUSED")} className="rounded-lg border border-gray-200 px-4 py-2 text-sm disabled:opacity-50 dark:border-gray-800">Tạm dừng</button>
            </div>
        </div>
    );
}
