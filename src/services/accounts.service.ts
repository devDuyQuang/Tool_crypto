// import { apiFetch } from "@/lib/apiFetch";
// import type { Account, Paginated } from "@/types/account";

// export const accountsService = {
//     findAll(params: { page: number; limit: number; search?: string }) {
//         const q = new URLSearchParams({
//             page: String(params.page),
//             limit: String(params.limit),
//             ...(params.search ? { search: params.search } : {}),
//         });

//         // apiFetch đã unwrap json.data => trả về Paginated<Account>
//         return apiFetch<Paginated<Account>>(`/accounts?${q.toString()}`);
//     },

//     findOne(id: string) {
//         return apiFetch<Account>(`/accounts/${id}`);
//     },

//     create(payload: {
//         platform: string;
//         label: string;
//         apiKey: string;
//         secretKey: string;
//     }) {
//         return apiFetch<Account>(`/accounts`, {
//             method: "POST",
//             body: JSON.stringify(payload),
//         });
//     },

//     update(
//         id: string,
//         payload: Partial<{
//             platform: string;
//             label: string;
//             apiKey: string;
//             secretKey: string;
//             isActive: boolean;
//         }>
//     ) {
//         return apiFetch<Account>(`/accounts/${id}`, {
//             method: "PATCH",
//             body: JSON.stringify(payload),
//         });
//     },

//     remove(id: string) {
//         return apiFetch<{ id: string; isActive: boolean }>(`/accounts/${id}`, {
//             method: "DELETE",
//         });
//     },
// };


// import { apiFetch } from "@/lib/apiFetch";
// import { withFeedback } from "@/lib/uiFeedback";
// import type { Account, Paginated } from "@/types/account";

// export const accountsService = {
//     findAll(params: { page: number; limit: number; search?: string }) {
//         const q = new URLSearchParams({
//             page: String(params.page),
//             limit: String(params.limit),
//             ...(params.search ? { search: params.search } : {}),
//         });

//         // ✅ apiFetch đã unwrap -> trả thẳng Paginated<Account>
//         return apiFetch<Paginated<Account>>(`/accounts?${q.toString()}`);
//     },

//     findOne(id: string) {
//         return apiFetch<Account>(`/accounts/${id}`);
//     },

//     create(payload: { platform: string; label: string; apiKey: string; secretKey: string }) {
//         return withFeedback(
//             () =>
//                 apiFetch<Account>(`/accounts`, {
//                     method: "POST",
//                     body: JSON.stringify(payload),
//                 }),
//             { loadingText: "Đang tạo...", successText: "Tạo account thành công ✅" }
//         );
//     },

//     update(
//         id: string,
//         payload: Partial<{ platform: string; label: string; apiKey: string; secretKey: string; isActive: boolean }>
//     ) {
//         return withFeedback(
//             () =>
//                 apiFetch<Account>(`/accounts/${id}`, {
//                     method: "PATCH",
//                     body: JSON.stringify(payload),
//                 }),
//             { loadingText: "Đang cập nhật...", successText: "Cập nhật thành công ✅" }
//         );
//     },

//     disable(id: string) {
//         return withFeedback(
//             () =>
//                 apiFetch<{ id: string; isActive: boolean }>(`/accounts/${id}`, {
//                     method: "DELETE",
//                 }),
//             { loadingText: "Đang vô hiệu hoá...", successText: "Đã vô hiệu hoá ✅" }
//         );
//     },

//     enable(id: string) {
//         return withFeedback(
//             () =>
//                 apiFetch<Account>(`/accounts/${id}`, {
//                     method: "PATCH",
//                     body: JSON.stringify({ isActive: true }),
//                 }),
//             { loadingText: "Đang kích hoạt...", successText: "Đã kích hoạt ✅" }
//         );
//     },
//     hardDelete(id: string) {
//         return withFeedback(
//             () =>
//                 apiFetch<{ message: string }>(`/accounts/${id}/hard`, {
//                     method: "DELETE",
//                 }),
//             {
//                 loadingText: "Đang xoá vĩnh viễn...",
//                 successText: "Đã xoá vĩnh viễn ✅",
//             }
//         );
//     },



// };
// src/services/accounts.service.ts
import { apiFetch } from "@/lib/apiFetch";
import type { Account, AccountVerifyResult, Platform } from "@/types/account";
import type { Paginated } from "@/types/common"

export const accountsService = {
    findAll(params: { page: number; limit: number; q?: string }) {
        const qs = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
            ...(params.q ? { q: params.q } : {}),
        });
        return apiFetch<Paginated<Account>>(`/accounts?${qs.toString()}`);
    },

    findOne(id: string) {
        return apiFetch<Account>(`/accounts/${id}`);
    },

    create(payload: { platform: Platform; label?: string; apiKey: string; secretKey: string; passphrase?: string }) {
        return apiFetch<Account>(`/accounts`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    update(id: string, payload: Partial<{ platform: Platform; label: string; apiKey: string; secretKey: string; passphrase: string; isActive: boolean; tradingEnabled: boolean }>) {
        return apiFetch<Account>(`/accounts/${id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    disable(id: string) {
        return apiFetch<{ message: string }>(`/accounts/${id}`, { method: "DELETE" });
    },

    enable(id: string) {
        return apiFetch<Account>(`/accounts/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
        });
    },

    verify(id: string) {
        return apiFetch<AccountVerifyResult>(`/accounts/${id}/verify`, { method: "POST" });
    },

    hardDelete(id: string) {
        return apiFetch<{ message: string }>(`/accounts/${id}/hard`, { method: "DELETE" });
    },

    getSymbols(accountId: string, params?: { q?: string; limit?: number }) {
        const qs = new URLSearchParams({
            ...(params?.q ? { q: params.q } : {}),
            ...(typeof params?.limit === "number" ? { limit: String(params.limit) } : {}),
        });
        const url = qs.toString()
            ? `/accounts/${accountId}/symbols?${qs.toString()}`
            : `/accounts/${accountId}/symbols`;

        return apiFetch<{ accountId: string; platform: string; symbols: string[] }>(url);
    },
};
