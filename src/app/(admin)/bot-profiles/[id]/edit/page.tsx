"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotAllowedDirections, BotProfile } from "@/types/botProfile";

const inputClass = "h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100";
const steps = ["Tài khoản", "Thị trường", "Rủi ro", "Xác nhận"];

export default function BotProfileEditPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<BotProfile | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
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
                setContextTimeframes(loaded.contextTimeframes.join(","));
                setTriggerTimeframe(loaded.triggerTimeframe);
                setRiskPerTradePercent(loaded.riskPerTradePercent);
                setDailyLossLimitPercent(loaded.dailyLossLimitPercent);
                setMaxConcurrentPositions(loaded.maxConcurrentPositions);
                setMaxLeverage(loaded.maxLeverage);
                setAllowedDirections(loaded.allowedDirections);
            })
            .catch((error) => toast.error(error?.message || "Không tải được bot"));
    }, [id]);

    const validationError = useMemo(() => {
        if (!name.trim()) return "Tên bot là bắt buộc.";
        if (!contextTimeframes.trim()) return "Khung bối cảnh là bắt buộc.";
        if (!triggerTimeframe.trim()) return "Khung kích hoạt là bắt buộc.";
        if (riskPerTradePercent <= 0 || riskPerTradePercent > 2) return "Rủi ro mỗi lệnh tối đa 2%.";
        if (dailyLossLimitPercent <= 0 || dailyLossLimitPercent > 5) return "Giới hạn lỗ ngày tối đa 5%.";
        if (maxConcurrentPositions < 1) return "Số vị thế đồng thời phải >= 1.";
        if (maxLeverage < 1) return "Đòn bẩy tối đa phải >= 1.";
        return null;
    }, [name, contextTimeframes, triggerTimeframe, riskPerTradePercent, dailyLossLimitPercent, maxConcurrentPositions, maxLeverage]);

    const save = async () => {
        if (validationError) {
            toast.error(validationError);
            return;
        }
        setSaving(true);
        try {
            await botProfilesService.update(id, {
                name: name.trim(),
                description: description.trim() || null,
                status: profile?.status || "STOPPED",
                contextTimeframes: contextTimeframes.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
                triggerTimeframe: triggerTimeframe.trim().toUpperCase(),
                riskPerTradePercent,
                dailyLossLimitPercent,
                maxConcurrentPositions,
                maxLeverage,
                allowedDirections,
            });
            toast.success("Đã lưu cấu hình bot");
            router.push(`/bot-profiles/${id}`);
        } catch (error: any) {
            toast.error(error?.message || "Lưu bot thất bại");
        } finally {
            setSaving(false);
        }
    };

    if (!profile) return <div className="text-gray-900 dark:text-gray-100">Đang tải...</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                backHref={`/bot-profiles/${id}`}
                eyebrow="Bot tự động"
                title="Chỉnh sửa bot"
                description="Cập nhật cấu hình vận hành. Environment vẫn được kế thừa từ account và không thể override trong profile."
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
                            <input className={`${inputClass} mt-2`} value={name} onChange={(e) => setName(e.target.value)} />
                        </label>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Mô tả
                            <textarea className="mt-2 min-h-24 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>
                        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
                            <div className="font-medium">Tài khoản đang dùng</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <StatusBadge value={profile.platform} />
                                <StatusBadge value={profile.status} />
                            </div>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Muốn đổi account, hãy tạo bot mới để audit rõ ràng.</p>
                        </div>
                    </div>
                ) : null}

                {step === 1 ? (
                    <div className="space-y-4">
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
                    <div className="grid gap-3 text-sm text-gray-700 dark:text-gray-200 md:grid-cols-2">
                        <div><b>Tên:</b> {name}</div>
                        <div><b>Tài khoản:</b> {profile.platform}</div>
                        <div><b>Symbol enabled:</b> {(profile.symbols ?? []).filter((s) => s.enabled).map((s) => s.symbol).join(", ") || "-"}</div>
                        <div><b>Khung:</b> {contextTimeframes} / {triggerTimeframe}</div>
                        <div><b>Hướng:</b> {allowedDirections}</div>
                        <div><b>Risk:</b> {riskPerTradePercent}% mỗi lệnh, {dailyLossLimitPercent}% mỗi ngày</div>
                        <div><b>Giới hạn:</b> {maxConcurrentPositions} vị thế, leverage {maxLeverage}x</div>
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
                    <button disabled={saving || !!validationError} onClick={save} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                        Lưu thay đổi
                    </button>
                )}
            </div>
        </div>
    );
}
