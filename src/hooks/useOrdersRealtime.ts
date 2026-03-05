"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

type UseOrdersRealtimeParams = {
    token: string | null;
    accountId?: string;
    onPlanUpdated?: (plan: any) => void;
    onOrderEvent?: (evt: any) => void;
};

export function useOrdersRealtime(params: UseOrdersRealtimeParams) {
    const { token, accountId, onPlanUpdated, onOrderEvent } = params;

    const joinedRef = useRef<string>("");

    useEffect(() => {
        if (!token) return;

        const s = getSocket(token);

        const onConnect = () => {
            // join lại khi connect
            if (accountId) {
                const key = `${accountId}`;
                if (joinedRef.current !== key) {
                    s.emit("join", { accountId });
                    joinedRef.current = key;
                }
            }
        };

        const onPlan = (plan: any) => onPlanUpdated?.(plan);
        const onOrder = (evt: any) => onOrderEvent?.(evt);

        s.on("connect", onConnect);
        s.on("plan.updated", onPlan);
        s.on("binance.order", onOrder);

        // nếu socket đã connect sẵn
        if (s.connected) onConnect();

        return () => {
            s.off("connect", onConnect);
            s.off("plan.updated", onPlan);
            s.off("binance.order", onOrder);
        };
    }, [token, accountId, onPlanUpdated, onOrderEvent]);
}