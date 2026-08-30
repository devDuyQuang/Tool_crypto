"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import AppHeader from "@/layout/AppHeader";
import BottomNav from "@/layout/BottomNav";

function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-2xl dark:bg-gray-950">
        <AppHeader />
        <main className="p-4 pb-24">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
