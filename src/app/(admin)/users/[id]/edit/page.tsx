"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { userService } from "@/services/user.service";

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [email, setEmail] = useState("");
    const [name, setName] = useState(""); // UI field
    const [role, setRole] = useState("user");
    const [status, setStatus] = useState(true); // UI field

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setError(null);
            setLoading(true);
            try {
                const u = await userService.findOne(id);

                setEmail(u.email ?? "");
                setName(u.fullName ?? ""); // ✅ map fullName -> name
                setRole(u.role ?? "user");
                setStatus(u.isActive ?? true); // ✅ map isActive -> status
            } catch (e: any) {
                setError(e?.message || "Load failed");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            await userService.update(id, {
                email,
                fullName: name, // ✅ map name -> fullName
                role,
                isActive: status, // ✅ map status -> isActive
            });

            router.replace("/users");
        } catch (e: any) {
            setError(e?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-sm text-gray-600 dark:text-gray-400">Loading...</div>;

    return (
        <div className="max-w-xl space-y-4 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-semibold">Edit User</h1>

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
                    disabled={saving}
                />

                <input
                    className="w-full rounded-lg border border-gray-200 bg-white p-2
          text-gray-900 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-500/40
          dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                />

                <input
                    className="w-full rounded-lg border border-gray-200 bg-white p-2
          text-gray-900 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand-500/40
          dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Role (user/admin)"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={saving}
                />

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        disabled={saving}
                    />
                    Active
                </label>

                <button
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </form>
        </div>
    );
}