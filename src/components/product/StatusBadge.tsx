"use client";

import { humanLabel } from "./humanLabels";

type StatusBadgeProps = {
    value?: string | null;
    tone?: "success" | "warning" | "error" | "neutral" | "dry" | "stopped" | "gold";
};

const toneClass: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
    error: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300",
    neutral: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-300",
    dry: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300",
    stopped: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300",
    gold: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
};

function inferTone(value?: string | null): NonNullable<StatusBadgeProps["tone"]> {
    const normalized = String(value ?? "").toUpperCase();
    if (["RUNNING", "READY", "PROTECTED", "APPROVED_FOR_EXECUTION", "ACTIVE", "ONLINE", "ĐANG QUÉT", "ĐANG CÓ VỊ THẾ", "ĐÃ BẢO VỆ"].includes(normalized)) return "success";
    if (["PAUSED", "WAITING", "PARTIAL", "STALE", "TẠM DỪNG", "TẠM DỪNG DO RỦI RO"].includes(normalized)) return "warning";
    if (["ERROR", "REJECTED", "FAILED", "UNPROTECTED", "KHÔNG ĐƯỢC BẢO VỆ", "ARCHIVED", "CẦN KIỂM TRA"].includes(normalized)) return "error";
    if (["STOPPED", "DRAFT", "NO_TRADE", "OFFLINE", "LƯU TRỮ"].includes(normalized)) return "stopped";
    return "neutral";
}

export function StatusBadge({ value, tone }: StatusBadgeProps) {
    const finalTone: NonNullable<StatusBadgeProps["tone"]> = tone ?? inferTone(value);

    return (
        <span className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass[finalTone]}`}>
            <span className="truncate">{humanLabel(value)}</span>
        </span>
    );
}
