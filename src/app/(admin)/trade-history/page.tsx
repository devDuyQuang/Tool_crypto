"use client";

import Link from "next/link";
import { EmptyState } from "@/components/product/EmptyState";
import { PageHeader } from "@/components/product/PageHeader";

export default function TradeHistoryPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Giao dịch"
                title="Lịch sử giao dịch"
                description="Khu vực đọc lịch sử execution thật. Decision Journal nằm riêng trong Bot tự động."
            />
            <EmptyState
                title="Dùng màn hình Vị thế & lệnh để xem dữ liệu hiện tại"
                description="Frontend Product Redesign V1 chưa thêm backend contract mới cho lịch sử giao dịch tách riêng."
                action={<Link href="/orders" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Mở Vị thế & lệnh</Link>}
            />
        </div>
    );
}
