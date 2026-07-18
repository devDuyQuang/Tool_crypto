"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EmptyState } from "@/components/product/EmptyState";
import { LoadingState } from "@/components/product/LoadingState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";
import { botProfilesService } from "@/services/botProfiles.service";
import type { BotProfile } from "@/types/botProfile";

type RuntimeRunRow = Record<string, any> & { botName?: string; profileId: string };

export default function RuntimeRunsPage() {
    const [rows, setRows] = useState<RuntimeRunRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const profileRes = await botProfilesService.findAll({ page: 1, limit: 100, includeArchived: true });
                const profiles = Array.isArray((profileRes as any).data) ? (profileRes as any).data as BotProfile[] : [];
                const lists: RuntimeRunRow[][] = await Promise.all(profiles.map(async (profile) => {
                    try {
                        const runs = await botProfilesService.runtimeRuns(profile._id);
                        return runs.map((run) => ({ ...(run as RuntimeRunRow), profileId: profile._id, botName: profile.name }));
                    } catch {
                        return [];
                    }
                }));
                setRows(lists.flat().sort((a, b) => new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime()).slice(0, 200));
            } catch (e: any) {
                toast.error(e?.message || "Không tải được lịch sử lần quét");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingState label="Đang tải lịch sử lần quét..." />;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Bot tự động"
                title="Lịch sử lần quét"
                description="Mỗi runtime run là một vòng quét: refresh dữ liệu, đánh giá context, scenario, risk, ghi Decision Journal và chỉ tạo execution artifact khi signal còn hợp lệ."
            />
            {rows.length === 0 ? <EmptyState title="Chưa có runtime run" /> : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                            <tr><th className="p-3">Bot</th><th className="p-3">Run</th><th className="p-3">Bắt đầu</th><th className="p-3">Kết thúc</th><th className="p-3">Duration</th><th className="p-3">Status</th><th className="p-3">Symbols</th><th className="p-3">Decisions</th><th className="p-3">Errors</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {rows.map((run, index) => (
                                <tr key={run._id ?? run.runId ?? index}>
                                    <td className="p-3"><Link href={`/bot-profiles/${run.profileId}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">{run.botName}</Link></td>
                                    <td className="p-3 font-mono text-xs">{run.runId ?? run._id ?? "-"}</td>
                                    <td className="p-3">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}</td>
                                    <td className="p-3">{run.completedAt ? new Date(run.completedAt).toLocaleString() : "-"}</td>
                                    <td className="p-3">{run.totalDurationMs != null ? `${Math.round(run.totalDurationMs / 1000)}s` : "-"}</td>
                                    <td className="p-3"><StatusBadge value={run.status} /></td>
                                    <td className="p-3">{run.symbolsSucceeded ?? 0}/{run.symbolsRequested?.length ?? run.symbolsRequested ?? 0}</td>
                                    <td className="p-3">L {run.decisionsLong ?? 0} · S {run.decisionsShort ?? 0} · N {run.decisionsNoTrade ?? 0}</td>
                                    <td className="p-3">{run.errorSummaries?.length ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
