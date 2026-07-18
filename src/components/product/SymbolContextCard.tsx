"use client";

import type { MarketContextEvaluation } from "@/types/botProfile";
import { HealthIndicator } from "./HealthIndicator";
import { StatusBadge } from "./StatusBadge";

export function SymbolContextCard({ context }: { context: MarketContextEvaluation }) {
    const health = context.contextStatus === "READY" ? "healthy" : context.contextStatus === "REJECTED" ? "warning" : "error";

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-base font-semibold text-gray-950 dark:text-white">{context.symbol}</div>
                    <div className="mt-1">
                        <HealthIndicator health={health} label={context.contextStatus} />
                    </div>
                </div>
                <StatusBadge value={context.marketRegime ?? "UNCERTAIN"} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-gray-500 dark:text-gray-400">Xu hướng H4</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{context.higherTimeframeBias ?? "UNKNOWN"}</dd>
                </div>
                <div>
                    <dt className="text-gray-500 dark:text-gray-400">Cấu trúc</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{context.structure ?? "UNKNOWN"}</dd>
                </div>
                <div>
                    <dt className="text-gray-500 dark:text-gray-400">Biến động</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{context.volatility ?? "UNKNOWN"}</dd>
                </div>
                <div>
                    <dt className="text-gray-500 dark:text-gray-400">Vị trí giá</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{context.priceLocation ?? "UNKNOWN"}</dd>
                </div>
            </dl>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Độ chắc chắn bối cảnh: {Math.round((context.contextConfidence ?? 0) * 100)}%. Đây không phải xác suất thắng.
            </div>
        </div>
    );
}
