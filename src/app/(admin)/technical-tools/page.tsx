"use client";

import Link from "next/link";
import { PageHeader } from "@/components/product/PageHeader";
import { StatusBadge } from "@/components/product/StatusBadge";

const tools = [
    { label: "Campaign legacy", href: "/campaigns", note: "Chỉ dành cho debug legacy, không nằm trong flow bot mới." },
    { label: "Crypto exchanges", href: "/crypto-exchanges", note: "Kiểm tra seed/exchange metadata." },
    { label: "Codes", href: "/codes", note: "Công cụ kỹ thuật nếu route còn tồn tại." },
];

export default function TechnicalToolsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Hệ thống"
                title="Công cụ kỹ thuật"
                description="Các màn hình cũ hoặc công cụ debug được đưa ra khỏi navigation chính để người dùng vận hành bot không nhầm với Auto Runtime V2."
            />
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Legacy Strategy/Campaign chỉ để đọc/debug trong giai đoạn chuyển đổi. Không dùng cho runtime tự động mới.
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {tools.map((tool) => (
                    <Link key={tool.href} href={tool.href} className="rounded-lg border border-gray-200 bg-white p-5 hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-800">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-semibold text-gray-950 dark:text-white">{tool.label}</h2>
                            <StatusBadge value="DEBUG" tone="warning" />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{tool.note}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
