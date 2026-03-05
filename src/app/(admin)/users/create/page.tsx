"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user.service";

export default function CreateUserPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("user");
    const [status, setStatus] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await userService.create({
                email,
                password,
                fullName: name,
                role,
                isActive: status,
            });

            router.replace("/users");
        } catch (e: any) {
            // setError(e?.message || "Create failed");
            setError(e?.message || "Tạo thành viên thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl space-y-4 text-gray-900 dark:text-gray-100">
            {/* <h1>Create User</h1> */}
            <h1 className="text-2xl font-semibold">Thêm thành viên</h1>

            {error && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    className="w-full rounded-lg border border-gray-200 bg-white p-2
            text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />

                <input
                    className="w-full rounded-lg border border-gray-200 bg-white p-2
            text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Mật khẩu"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />

                <input
                    className="w-full rounded-lg border border-gray-200 bg-white p-2
            text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    // placeholder="Full name"
                    placeholder="Họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />

                <input
                    className="w-full rounded-lg border border-gray-200 bg-white p-2
            text-gray-900 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/40
            dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    // placeholder="Role (user/admin)"
                    placeholder="Vai trò (user/admin)"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                />

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        disabled={loading}
                    />
                    {/* Active */}
                    Đang hoạt động
                </label>

                <button
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {/* {loading ? "Saving..." : "Save"} */}
                    {loading ? "Đang lưu..." : "Lưu"}
                </button>
            </form>
        </div>
    );
}