import { apiFetch } from "@/lib/apiFetch";
import type { Paginated } from "@/types/common";

export type OrderType = "MARKET" | "LIMIT";
export type MarginType = "CROSSED" | "ISOLATED";
export type Side = "LONG" | "SHORT";
export type PlanStatus = "PREVIEW" | "EXECUTED" | "EXPIRED";
export type ExchangeStatus = "PENDING" | "OPEN" | "CLOSED";

export type PreviewOrderPayload = {
    symbol: string;
    orderType: OrderType;
    usdAmount: number;
    leverage: number;
    marginType: MarginType;
    timeframes: string[];
};
export type PreviewOrderResponse =
    | { ok: false; message: string }
    | {
        ok: true;
        planId: string;
        side: "LONG" | "SHORT";
        entry: number;
        sl: number;
        tp: number[];
        previewPrice: number;
        allowedDeviation: number;
        reasons?: { tag: string; text: string; weight: number }[];
        score?: number;
        grade?: string;
    };

export type ExecuteOrderPayload = { planId: string };

export type ExecuteOrderResponse = {
    ok: boolean;
    entryOrder: any;
    slOrder?: any;
    tpOrder?: any;
    tpOrders?: any[];
};

export type OrderPlan = {
    _id: string;
    accountId: string;
    environment?: "LIVE" | "TESTNET" | "DEMO";
    connectionTarget?: string;
    symbol: string;
    orderType: OrderType;
    side: Side;
    usdAmount: number;
    leverage: number;
    marginType: MarginType;
    qty: number;
    previewPrice: number;
    allowedDeviation: number;
    entry: number;
    sl: number;
    tp: number[];
    reasons?: any[];
    status: PlanStatus;

    entryOrderId?: number;
    slOrderId?: number;
    tpOrderIds?: number[];

    exchangeStatus?: ExchangeStatus;
    lastSyncAt?: string;

    exchangeSnapshot?: any;
    protectionState?: string | null;
    sizingSnapshot?: {
        notional?: number;
        riskUsd?: number;
        riskPctOfCapital?: number;
        slDistPct?: number;
    };
    metadata?: Record<string, any>;
    failureReason?: string | null;

    createdAt?: string;
    updatedAt?: string;
};

// ✅ Sync response nên trả về OrderPlan (hoặc một phần của nó)
// để FE có thể update rows ngay.
export type SyncOrderResponse = Partial<
    Pick<OrderPlan, "exchangeStatus" | "lastSyncAt" | "exchangeSnapshot" | "status">
> & { _id?: string };

export const ordersService = {
    findAll(params: { page: number; limit: number; accountId?: string; status?: PlanStatus }) {
        const qs = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
            ...(params.accountId ? { accountId: params.accountId } : {}),
            ...(params.status ? { status: params.status } : {}),
        });
        return apiFetch<Paginated<OrderPlan>>(`/orders?${qs.toString()}`);
    },

    findOne(id: string) {
        return apiFetch<OrderPlan>(`/orders/${id}`);
    },

    preview(accountId: string, payload: PreviewOrderPayload) {
        return apiFetch<PreviewOrderResponse>(`/orders/${accountId}/preview`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    execute(accountId: string, payload: ExecuteOrderPayload) {
        return apiFetch<ExecuteOrderResponse>(`/orders/${accountId}/execute`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    // ✅ sync realtime from Binance
    sync(planId: string) {
        return apiFetch<SyncOrderResponse>(`/orders/${planId}/sync`, { method: "POST" });
    },
};
