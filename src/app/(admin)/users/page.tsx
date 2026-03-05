"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userService, User } from "@/services/user.service";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/apiFetch";

type Meta = { page: number; limit: number; total: number; totalPages: number };

export default function UsersPage() {
    const router = useRouter();
    const { isAdmin, loading: authLoading } = useAuth();

    const [items, setItems] = useState<User[]>([]);
    const [meta, setMeta] = useState<Meta>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const canPrev = page > 1;
    const canNext = page < meta.totalPages;

    // ✅ chặn ngay từ UI (không gọi API nếu không phải admin)
    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) router.replace("/403"); // hoặc "/dashboard"
    }, [authLoading, isAdmin, router]);

    const load = async (
        opts?: Partial<{ page: number; limit: number; search: string }>
    ) => {
        // tránh gọi API khi chưa biết auth hoặc không phải admin
        if (authLoading || !isAdmin) return;

        try {
            setError(null);
            setLoading(true);

            const nextPage = opts?.page ?? page;
            const nextLimit = opts?.limit ?? limit;
            const nextSearch = opts?.search ?? (search.trim() || "");

            const res = await userService.findAll({
                page: nextPage,
                limit: nextLimit,
                search: nextSearch || undefined,
            });

            setItems(res.data);
            setMeta(res.meta);
        } catch (e: any) {
            // ✅ ưu tiên xử lý status
            const status = e instanceof ApiError ? e.status : e?.status;

            if (status === 403) {
                setError("Bạn không có quyền truy cập chức năng này.");
                router.replace("/403");
                return;
            }

            setError(e?.message || "Tải danh sách thành viên thất bại");
        } finally {
            setLoading(false);
        }
    };

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            load({ page: 1, search });
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, authLoading, isAdmin]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, authLoading, isAdmin]);

    const onDelete = async (id: string) => {
        if (!confirm("Xoá thành viên này?")) return;

        try {
            await userService.remove(id);

            if (items.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                await load();
            }
        } catch (e: any) {
            const status = e instanceof ApiError ? e.status : e?.status;
            if (status === 403) {
                setError("Bạn không có quyền thực hiện thao tác này.");
                router.replace("/403");
                return;
            }
            setError(e?.message || "Xoá thành viên thất bại");
        }
    };

    // optional: trong lúc auth đang load thì show loading nhẹ
    if (authLoading) {
        return (
            <p className="text-sm text-gray-600 dark:text-gray-400">Đang kiểm tra quyền...</p>
        );
    }

    return (
        <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Quản lý thành viên</h1>

                <Link
                    href="/users/create"
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:opacity-95"
                >
                    + Thêm thành viên
                </Link>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <input
                    className="w-72 rounded-lg border border-gray-200 bg-white p-2
            text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Tìm theo email / họ tên / vai trò..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="rounded-lg border border-gray-200 bg-white p-2
            text-gray-900
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
                    value={limit}
                    onChange={(e) => {
                        setPage(1);
                        setLimit(Number(e.target.value));
                    }}
                >
                    {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            {n}/trang
                        </option>
                    ))}
                </select>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tổng: {meta.total} • Trang {meta.page}/{meta.totalPages}
                </div>

                <div className="ml-auto flex gap-2">
                    <button
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2
              text-gray-700 hover:bg-gray-50 disabled:opacity-50
              dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                        disabled={!canPrev || loading}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        Trước
                    </button>

                    <button
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2
              text-gray-700 hover:bg-gray-50 disabled:opacity-50
              dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800/50"
                        disabled={!canNext || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sau
                    </button>
                </div>
            </div>

            {loading && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải...</p>
            )}

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-200">
                            <tr className="text-left">
                                <th className="p-3 font-medium">Email</th>
                                <th className="p-3 font-medium">Họ và tên</th>
                                <th className="p-3 font-medium">Vai trò</th>
                                <th className="p-3 font-medium">Trạng thái</th>
                                <th className="p-3 font-medium">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {items.map((u) => (
                                <tr
                                    key={u._id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                                >
                                    <td className="p-3">{u.email}</td>
                                    <td className="p-3">{u.fullName || "-"}</td>
                                    <td className="p-3">{u.role || "-"}</td>
                                    <td className="p-3">
                                        {u.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                                    </td>
                                    <td className="p-3 space-x-3">
                                        <Link
                                            className="text-blue-600 hover:underline dark:text-blue-400"
                                            href={`/users/${u._id}/edit`}
                                        >
                                            Sửa
                                        </Link>
                                        <button
                                            className="text-red-600 hover:underline dark:text-red-400"
                                            onClick={() => onDelete(u._id)}
                                        >
                                            Xoá
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td
                                        className="p-3 text-gray-600 dark:text-gray-400"
                                        colSpan={5}
                                    >
                                        Không có thành viên nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}