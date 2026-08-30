"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
    { label: "Tổng quan", icon: "TQ", path: "/dashboard" },
    { label: "Bật Bot", icon: "BT", path: "/bot-profiles" },
    { label: "Lịch sử", icon: "GD", path: "/trade-history" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-gray-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
            <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
                {items.map((item) => {
                    const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex min-w-0 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                                active
                                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]"
                            }`}
                        >
                            <span className={`mb-1 flex h-7 w-7 items-center justify-center rounded-md border text-[10px] ${
                                active
                                    ? "border-brand-200 bg-white text-brand-700 dark:border-brand-800 dark:bg-gray-950 dark:text-brand-300"
                                    : "border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-white/[0.04]"
                            }`}>
                                {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
