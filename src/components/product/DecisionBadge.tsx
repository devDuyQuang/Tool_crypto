"use client";

import type { AutoDecisionSide } from "@/types/botProfile";
import { humanLabel } from "./humanLabels";

export function DecisionBadge({ decision }: { decision?: AutoDecisionSide | string | null }) {
    const value = decision || "NO_TRADE";
    const normalized = String(value).toUpperCase();
    const cls =
        normalized === "LONG"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
            : normalized === "SHORT"
              ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
              : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-300";

    const label = humanLabel(normalized);

    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}
