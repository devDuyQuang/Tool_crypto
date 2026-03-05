"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MeResult } from "@/types/me";
import { login as apiLogin, me as apiMe } from "@/services/auth.service";

type AuthContextValue = {
    me: MeResult | null;
    loading: boolean;
    accessToken: string | null;
    login: (email: string, password: string) => Promise<MeResult>;
    logout: (opts?: { redirectTo?: string }) => void;
    isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "accessToken";
export const AUTH_LOGOUT_EVENT = "auth:logout";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [me, setMe] = useState<MeResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const didInit = useRef(false);

    const clearAuthState = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("refreshToken");
        setAccessToken(null);
        setMe(null);
        setLoading(false);
    };

    const logout = (opts?: { redirectTo?: string }) => {
        const redirectTo = opts?.redirectTo ?? "/signin";
        clearAuthState();
        router.replace(redirectTo);
        router.refresh();
    };

    // init: read token => call /auth/me
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;

        const token = localStorage.getItem(TOKEN_KEY);
        setAccessToken(token);

        if (!token) {
            setLoading(false);
            return;
        }

        apiMe(token)
            .then((u) => setMe(u))
            .catch(() => {
                clearAuthState();
            })
            .finally(() => setLoading(false));
    }, []);

    // listen logout event from apiFetch (401 token expired)
    useEffect(() => {
        const handler = () => logout({ redirectTo: "/signin" });
        window.addEventListener(AUTH_LOGOUT_EVENT, handler);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const data = await apiLogin({ email, password });
            const token = data.accessToken;

            localStorage.setItem(TOKEN_KEY, token);
            setAccessToken(token);

            const profile = await apiMe(token);
            setMe(profile);

            return profile;
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = (me?.role ?? "").toLowerCase() === "admin";

    const value = useMemo(
        () => ({ me, loading, accessToken, login, logout, isAdmin }),
        [me, loading, accessToken, isAdmin]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}