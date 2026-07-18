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
        <div className={`rounded-lg border bg-white p-4 dark:bg-white/[0.03] ${accent[tone]}`}>
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-950 dark:text-white">{value}</div>
            {helper ? <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{helper}</div> : null}
        </div>
    );
}
