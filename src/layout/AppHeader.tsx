"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import Link from "next/link";
import React from "react";

const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-sm font-bold text-white dark:bg-white dark:text-gray-950">AT</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-gray-950 dark:text-white">Auto Trading</span>
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">Mobile Console</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
