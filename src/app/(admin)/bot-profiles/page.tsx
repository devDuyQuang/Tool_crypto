"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotProfile } from "@/types/botProfile";

export default function BotProfilesPage() {
    const [rows, setRows] = useState<BotProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const res = await botProfilesService.findAll({ page: 1, limit: 100 });
            setRows(Array.isArray((res as any).data) ? (res as any).data : []);
        } catch (error: any) {
            toast.error(error?.message || "Load bot profiles failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const archive = async (id: string) => {
        if (!confirm("Lưu trữ bot profile này?")) return;
        try {
            await botProfilesService.archive(id);
            toast.success("Đã lưu trữ bot profile");
            await load();
        } catch (error: any) {
            toast.error(error?.message || "Archive failed");
        }
    };

    return (
        <div className="space-y-4 text-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Bot Tự Động</h1>
                <Link href="/bot-profiles/create" className="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600">
                    Tạo profile
                </Link>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 text-left dark:border-gray-800">
                        <tr>
                            <th className="p-3">Tên</th>
                            <th className="p-3">Mode</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Account</th>
                            <th className="p-3">Symbols</th>
                            <th className="p-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="p-3" colSpan={6}>Loading...</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td className="p-3" colSpan={6}>Chưa có BotProfile.</td></tr>
                        ) : rows.map((row) => (
                            <tr key={row._id} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="p-3 font-medium">{row.name}</td>
                                <td className="p-3">{row.mode}</td>
                                <td className="p-3">{row.status}</td>
                                <td className="p-3">{row.platform}/{row.environment}</td>
                                <td className="p-3">{row.symbols?.length ?? 0}</td>
                                <td className="p-3">
                                    <div className="flex justify-end gap-3">
                                        <Link className="text-brand-600 hover:underline" href={`/bot-profiles/${row._id}`}>Chi tiết</Link>
                                        <Link className="text-brand-600 hover:underline" href={`/bot-profiles/${row._id}/edit`}>Chỉnh sửa</Link>
                                        <button className="text-red-600 hover:underline" onClick={() => archive(row._id)}>Lưu trữ</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
