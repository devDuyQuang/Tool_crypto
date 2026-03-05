"use client";

export default function LoadingModal({
    open,
    text,
}: {
    open: boolean;
    text: string;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
            aria-modal="true"
            role="dialog"
        >
            <div className="w-[320px] rounded-xl bg-white p-6 shadow-lg">
                <div className="flex flex-col items-center gap-3">
                    {/* Bootstrap-like spinner */}
                    <div
                        className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500"
                        aria-label="Loading"
                    />
                    <div className="text-sm text-gray-700">{text}</div>
                </div>
            </div>
        </div>
    );
}
