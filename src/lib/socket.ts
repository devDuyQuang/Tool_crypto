"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

const WS_URL =
    // process.env.NEXT_PUBLIC_WS_URL ||
    // process.env.NEXT_PUBLIC_API_URL ||
    // "http://localhost:3007";
    process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";
export function getSocket(token?: string) {
    if (typeof window === "undefined") {
        throw new Error("getSocket() must be called in the browser");
    }

    if (!socket) {
        socket = io(WS_URL, {
            autoConnect: false,
            transports: ["websocket"],
            auth: token ? { token } : undefined,
        });
    } else {
        // cập nhật token mới nếu có
        if (token) socket.auth = { token };
    }

    if (token && !socket.connected) {
        socket.connect();
    }

    return socket;
}

export function disconnectSocket() {
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
}