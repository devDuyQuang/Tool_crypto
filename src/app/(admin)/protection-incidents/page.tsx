"use client";

import Link from "next/link";
import { EmptyState } from "@/components/product/EmptyState";
import { PageHeader } from "@/components/product/PageHeader";

export default function ProtectionIncidentsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Giao dịch"
                title="Sự cố bảo vệ"
                description="Theo dõi các tình huống position thiếu SL/TP hoặc cần reconciliation. Không có hành động execute trong màn hình này."
            />
            <EmptyState
                title="Chưa có màn hình incident chuyên dụng"
                description="Phase này chỉ đổi frontend product surface. Dữ liệu protection chi tiết vẫn xem trong khu Vị thế & lệnh."
                action={<Link href="/orders" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Mở Vị thế & lệnh</Link>}
            />
        </div>
    );
}
