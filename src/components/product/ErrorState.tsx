"use client";

import type { ReactNode } from "react";

export function ErrorState({ title = "Không tải được dữ liệu", message, action }: { title?: string; message?: string; action?: ReactNode }) {
    return (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <div className="font-semibold">{title}</div>
            {message ? <div className="mt-1 text-sm">{message}</div> : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}
