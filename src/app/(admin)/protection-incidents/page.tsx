"use client";

import Link from "next/link";
import { EmptyState } from "@/components/product/EmptyState";
import { PageHeader } from "@/components/product/PageHeader";

export default function ProtectionIncidentsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Nâng cao"
                title="Sự cố bảo vệ"
                description="Theo dõi các vị thế có thể thiếu Stop Loss/Take Profit hoặc cần kiểm tra đồng bộ. Không có hành động đặt lệnh trong màn hình này."
            />
            <EmptyState
                title="Chưa có sự cố bảo vệ chuyên dụng"
                description="Nếu vị thế thiếu bảo vệ, hãy xem trang Đang mở. Raw reconciliation/protection metadata nằm trong Chi tiết kỹ thuật của từng lệnh."
                action={<Link href="/orders" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Mở Vị thế & lệnh</Link>}
            />
        </div>
    );
}
