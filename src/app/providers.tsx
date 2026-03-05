"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { bindGlobalLoading } from "@/lib/uiFeedback";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { AuthProvider } from "@/context/AuthContext";

function LoadingModal({ open, text }: { open: boolean; text?: string }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-[320px] text-center shadow-lg">
                <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-gray-200 border-t-brand-500 animate-spin" />
                <div className="text-sm text-gray-700 dark:text-gray-200">
                    {text || "Đang xử lý..."}
                </div>
            </div>
        </div>
    );
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState<string>("");

    useEffect(() => {
        bindGlobalLoading((isOpen, t) => {
            setOpen(isOpen);
            setText(t || "");
        });
    }, []);

    return (
        <ThemeProvider>
            {/* AuthProvider bọc ngoài SidebarProvider để Sidebar/Header dùng me.role */}
            <AuthProvider>
                <SidebarProvider>
                    {children}

                    <LoadingModal open={open} text={text} />

                    <ToastContainer
                        position="top-right"
                        autoClose={2500}
                        newestOnTop
                        closeOnClick
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                        style={{ zIndex: 9999999 }}
                    />
                </SidebarProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}