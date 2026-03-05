"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("accessToken");

    // Không có token => về signin
    if (!token) {
      logout();
      router.replace("/signin");
      return false;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        // Nếu thiếu env thì coi như fail (tránh treo)
        logout();
        router.replace("/signin");
        return false;
      }

      // Verify token bằng backend (ổn định hơn decode JWT ở FE)
      const res = await fetch(`${apiUrl}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("unauthorized");

      return true;
    } catch {
      logout();
      router.replace("/signin");
      return false;
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;

    // check ngay lúc mount (async)
    (async () => {
      const ok = await checkAuth();
      if (mounted && ok) setChecked(true);
    })();

    // check khi user quay lại tab
    const onFocus = () => {
      checkAuth();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") checkAuth();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [checkAuth]);

  if (!checked) return null;

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}