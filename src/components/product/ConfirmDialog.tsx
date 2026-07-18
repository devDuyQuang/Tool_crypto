"use client";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "warning" | "danger";
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    tone = "warning",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;
    const confirmClass = tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-brand-600 hover:bg-brand-700";

    return (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-950">
                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{title}</h2>
                {description ? <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{description}</p> : null}
                <div className="mt-5 flex justify-end gap-2">
                    <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.05]" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmClass}`} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
