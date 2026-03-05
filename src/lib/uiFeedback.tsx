"use client";

import { toast } from "react-toastify";

let setGlobalLoading: ((open: boolean, text?: string) => void) | null = null;

export function bindGlobalLoading(fn: (open: boolean, text?: string) => void) {
    setGlobalLoading = fn;
}

export async function withFeedback<T>(
    job: () => Promise<T>,
    opts: {
        loadingText: string;
        successText?: string;
        errorText?: string; // fallback nếu err.message rỗng
        successDelayMs?: number; // ví dụ 1000
    }
) {
    const start = Date.now();
    setGlobalLoading?.(true, opts.loadingText);

    try {
        const res = await job();

        // đảm bảo modal tối thiểu 1s cho "chuyên nghiệp"
        const elapsed = Date.now() - start;
        if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed));

        if (opts.successText) toast.success(opts.successText);

        if (opts.successDelayMs) {
            await new Promise(r => setTimeout(r, opts.successDelayMs));
        }

        return res;
    } catch (e: any) {
        const elapsed = Date.now() - start;
        if (elapsed < 1000) await new Promise(r => setTimeout(r, 1000 - elapsed));

        toast.error(e?.message || opts.errorText || "Thao tác thất bại");
        throw e;
    } finally {
        setGlobalLoading?.(false);
    }
}
