"use client";

export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
            {label}
        </div>
    );
}
