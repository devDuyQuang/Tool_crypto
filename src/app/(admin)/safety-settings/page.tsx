"use client";

import { EmptyState } from "@/components/product/EmptyState";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";

export default function SafetySettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Hệ thống"
                title="Cài đặt an toàn"
                description="Các công tắc an toàn cấp hệ thống được hiển thị như thông tin vận hành. Frontend không tự bật tài khoản tiền thật trong bản redesign này."
            />
            <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-wrap gap-2">
                    <StatusBadge value="SAFETY FIRST" tone="dry" />
                    <StatusBadge value="Tài khoản tiền thật DISABLED" tone="error" />
                    <StatusBadge value="EXECUTION QUA RUNTIME" tone="success" />
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    START chỉ dành cho BotProfile khi backend bật AUTO_RUNTIME_V2_ENABLED exact true. Giao diện này không có nút đặt lệnh thủ công; execution chỉ đi qua runtime/OMS.
                </p>
            </div>
            <EmptyState title="Chưa có form chỉnh setting trực tiếp" description="Khi backend có system setting admin contract, màn hình này sẽ nối vào contract đó thay vì tự suy đoán." />
        </div>
    );
}
