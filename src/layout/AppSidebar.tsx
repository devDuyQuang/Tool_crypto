"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback } from "react";
import { useSidebar } from "../context/SidebarContext";
import { HorizontaLDots } from "../icons/index";

type NavItem = {
    name: string;
    icon: string;
    path: string;
};

const navItems: NavItem[] = [
    { name: "Tổng quan", icon: "TQ", path: "/dashboard" },
    { name: "Cấu hình & Bật Bot", icon: "BT", path: "/bot-profiles" },
    { name: "Lịch sử giao dịch", icon: "GD", path: "/trade-history" },
];

function NavIcon({ label }: { label: string }) {
    return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[11px] font-bold text-gray-600 dark:border-gray-800 dark:bg-white/[0.04] dark:text-gray-300">
            {label}
        </span>
    );
}

export default function AppSidebar() {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const pathname = usePathname();

    const isActive = useCallback((path: string) => pathname === path || pathname.startsWith(`${path}/`), [pathname]);
    const expanded = isExpanded || isHovered || isMobileOpen;

    const renderItem = (nav: NavItem) => {
        const active = isActive(nav.path);
        const baseClass = `menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${!expanded ? "lg:justify-center" : "lg:justify-start"}`;

        return (
            <li key={nav.name}>
                <Link href={nav.path} className={baseClass}>
                    <NavIcon label={nav.icon} />
                    {expanded ? <span className="menu-item-text">{nav.name}</span> : null}
                </Link>
            </li>
        );
    };

    return (
        <aside
            className={`fixed left-0 top-0 z-9999 mt-0 hidden h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0 lg:flex ${
                isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"
            } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex border-b border-gray-100 py-5 dark:border-gray-800 ${expanded ? "justify-start" : "justify-center"}`}>
                <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white dark:bg-white dark:text-gray-950">AT</span>
                    {expanded ? (
                        <span className="min-w-0">
                            <span className="block truncate text-base font-semibold text-gray-950 dark:text-white">Auto Trading Console</span>
                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">Vận hành tự động</span>
                        </span>
                    ) : null}
                </Link>
            </div>

            <div className="no-scrollbar flex flex-col overflow-y-auto pt-5">
                <nav>
                    <div className="mb-6">
                        <h2 className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${expanded ? "justify-start" : "justify-center"}`}>
                            {expanded ? "Menu" : <HorizontaLDots />}
                        </h2>
                        <ul className="flex flex-col gap-2">{navItems.map(renderItem)}</ul>
                    </div>
                </nav>
                {expanded ? (
                    <div className="mt-auto rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                        Kết nối sàn, tạo bot, bật bot rồi theo dõi kết quả.
                    </div>
                ) : null}
            </div>
        </aside>
    );
}
