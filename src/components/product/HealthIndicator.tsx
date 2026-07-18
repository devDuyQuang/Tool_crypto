"use client";

type Health = "healthy" | "warning" | "error" | "unknown";

const map: Record<Health, { dot: string; text: string }> = {
    healthy: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
    warning: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
    error: { dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
    unknown: { dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-300" },
};

export function HealthIndicator({ health, label }: { health: Health; label: string }) {
    const style = map[health];
    return (
        <span className={`inline-flex items-center gap-2 text-sm font-medium ${style.text}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
            {label}
        </span>
    );
}
