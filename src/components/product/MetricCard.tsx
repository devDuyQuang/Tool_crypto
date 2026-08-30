"use client";

import type { ReactNode } from "react";

type MetricCardProps = {
    label: string;
    value: ReactNode;
    helper?: ReactNode;
    tone?: "neutral" | "success" | "warning" | "error" | "dry";
};

const accent: Record<NonNullable<MetricCardProps["tone"]>, string> = {
    neutral: "border-gray-200 dark:border-gray-800",
    success: "border-emerald-200 dark:border-emerald-900",
    warning: "border-amber-200 dark:border-amber-900",
    error: "border-rose-200 dark:border-rose-900",
    dry: "border-sky-200 dark:border-sky-900",
};

export function MetricCard({ label, value, helper, tone = "neutral" }: MetricCardProps) {
    return (
        <div className={`min-w-0 rounded-lg border bg-white p-3 dark:bg-white/[0.03] ${accent[tone]}`}>
            <div className="min-w-0 break-words text-[11px] font-medium uppercase tracking-normal text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-2 min-w-0 break-words text-xl font-semibold tracking-normal text-gray-950 dark:text-white">{value}</div>
            {helper ? <div className="mt-2 min-w-0 break-words text-xs text-gray-600 dark:text-gray-300">{helper}</div> : null}
        </div>
    );
}
