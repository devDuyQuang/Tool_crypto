"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import { ChevronDownIcon, HorizontaLDots } from "../icons/index";

type NavItem = {
    name: string;
    icon: string;
    path?: string;
    subItems?: { name: string; path: string; note?: string }[];
};

const navItems: NavItem[] = [
    { name: "Tổng quan", icon: "TQ", path: "/dashboard" },
    {
        name: "Bot tự động",
        icon: "BT",
        subItems: [
            { name: "Danh sách bot", path: "/bot-profiles" },
            { name: "Nhật ký quyết định", path: "/bot-decisions" },
            { name: "Lịch sử lần quét", path: "/runtime-runs" },
        ],
    },
    {
        name: "Giao dịch",
        icon: "GD",
        subItems: [
            { name: "Vị thế & lệnh", path: "/orders" },
            { name: "Lịch sử giao dịch", path: "/trade-history" },
            { name: "Sự cố bảo vệ", path: "/protection-incidents" },
        ],
    },
    {
        name: "Kết nối",
        icon: "KN",
        subItems: [{ name: "Tài khoản sàn", path: "/accounts" }],
    },
    {
        name: "Hệ thống",
        icon: "HT",
        subItems: [
            { name: "Thành viên", path: "/users" },
            { name: "Cài đặt an toàn", path: "/safety-settings" },
            { name: "Công cụ kỹ thuật", path: "/technical-tools", note: "debug" },
        ],
    },
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
    const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
    const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
    const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const isActive = useCallback((path: string) => pathname === path || pathname.startsWith(`${path}/`), [pathname]);
    const expanded = isExpanded || isHovered || isMobileOpen;

    const defaultOpen = useMemo(() => {
        return navItems.findIndex((nav) => nav.subItems?.some((item) => isActive(item.path)));
    }, [isActive]);

    useEffect(() => {
        if (defaultOpen >= 0) setOpenSubmenu(defaultOpen);
    }, [defaultOpen]);

    useEffect(() => {
        if (openSubmenu !== null && subMenuRefs.current[openSubmenu]) {
            setSubMenuHeight((prev) => ({
                ...prev,
                [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight ?? 0,
            }));
        }
    }, [openSubmenu]);

    const renderItem = (nav: NavItem, index: number) => {
        const active = nav.path ? isActive(nav.path) : nav.subItems?.some((item) => isActive(item.path));
        const baseClass = `menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${!expanded ? "lg:justify-center" : "lg:justify-start"}`;

        if (nav.subItems) {
            const isOpen = openSubmenu === index;
            return (
                <li key={nav.name}>
                    <button onClick={() => setOpenSubmenu(isOpen ? null : index)} className={`${baseClass} w-full cursor-pointer`}>
                        <NavIcon label={nav.icon} />
                        {expanded ? <span className="menu-item-text">{nav.name}</span> : null}
                        {expanded ? <ChevronDownIcon className={`ml-auto h-5 w-5 transition-transform ${isOpen ? "rotate-180 text-brand-500" : ""}`} /> : null}
                    </button>
                    {expanded ? (
                        <div
                            ref={(el) => {
                                subMenuRefs.current[index] = el;
                            }}
                            className="overflow-hidden transition-all duration-300"
                            style={{ height: isOpen ? `${subMenuHeight[index] ?? 0}px` : "0px" }}
                        >
                            <ul className="ml-10 mt-2 space-y-1">
                                {nav.subItems.map((item) => (
                                    <li key={item.path}>
                                        <Link href={item.path} className={`menu-dropdown-item ${isActive(item.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
                                            <span>{item.name}</span>
                                            {item.note ? <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{item.note}</span> : null}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </li>
            );
        }

        return (
            <li key={nav.name}>
                <Link href={nav.path ?? "#"} className={baseClass}>
                    <NavIcon label={nav.icon} />
                    {expanded ? <span className="menu-item-text">{nav.name}</span> : null}
                </Link>
            </li>
        );
    };

    return (
        <aside
            className={`fixed left-0 top-0 z-9999 mt-0 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0 ${
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
                            {expanded ? "Điều hướng" : <HorizontaLDots />}
                        </h2>
                        <ul className="flex flex-col gap-2">{navItems.map(renderItem)}</ul>
                    </div>
                </nav>
                {expanded ? (
                    <div className="mt-auto rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                        Runtime dùng tài khoản đã xác minh và chỉ giao dịch khi quyền giao dịch được bật rõ ràng.
                    </div>
                ) : null}
            </div>
        </aside>
    );
}
