import type { Account } from "@/types/account";
import type { BotProfile, DecisionJournal, RuntimeStatus } from "@/types/botProfile";

export type ProductState = "OBSERVING" | "WAITING" | "IN_POSITION" | "PAUSED" | "ERROR" | "RISK_BLOCKED" | "STRATEGY_BLOCKED";

function normalize(value?: string | null) {
    return String(value ?? "").toUpperCase();
}

export function formatMoneyValue(value?: number | string | null, unavailable = "$0.00") {
    const n = Number(value);
    if (value == null || !Number.isFinite(n)) return unavailable;
    const sign = n > 0 ? "+" : "";
    return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function formatTradeCount(value?: number | string | null) {
    const n = Number(value);
    if (value == null || !Number.isFinite(n) || n < 0) return "0 lệnh";
    return `${Math.trunc(n).toLocaleString("en-US")} lệnh`;
}

export function compactBotStatusText(profile?: BotProfile | null, runtime?: RuntimeStatus | null) {
    if (!profile) return "OFFLINE";
    const hasErrors = (runtime?.lastRun?.errorSummaries?.length ?? 0) > 0;
    if (hasErrors) return "CẦN KIỂM TRA";
    if (profile.status === "RUNNING" && strategyExecutionBlocked(runtime)) return "ĐANG QUÉT";
    if (profile.status === "RUNNING") return "ONLINE";
    if (profile.status === "PAUSED") return "TẠM DỪNG";
    if (profile.status === "STOPPED") return "OFFLINE";
    if (profile.status === "ARCHIVED") return "LƯU TRỮ";
    return profile.status;
}

export function formatUsdtValue(value?: number | null, unavailable = "$0.00") {
    if (value == null || !Number.isFinite(Number(value))) return unavailable;
    const n = Number(value);
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(2)} USDT`;
}

export function formatNullableValue(value?: number | null, suffix = "") {
    if (value == null || !Number.isFinite(Number(value))) return "Chưa có dữ liệu";
    return `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 })}${suffix}`;
}

export function formatNumber(value?: number | null, dp = 2) {
    if (value == null || !Number.isFinite(Number(value))) return "-";
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: dp });
}

export function environmentLabel(value?: string | null) {
    const normalized = normalize(value);
    if (normalized === "LIVE" || normalized.includes("PRODUCTION")) return "Tài khoản thực tế";
    if (normalized === "TESTNET" || normalized === "DEMO" || normalized.includes("DEMO")) return "Tài khoản thử nghiệm";
    return "Chưa xác định";
}

export function environmentTone(value?: string | null): "success" | "warning" | "error" | "neutral" | "dry" | "stopped" | "gold" {
    const label = environmentLabel(value);
    if (label === "Tài khoản thực tế") return "gold";
    if (label === "Tài khoản thử nghiệm") return "neutral";
    return "warning";
}

export function accountEnvironment(account?: Account | null) {
    return account?.connectionTarget ?? account?.environment;
}

export function botEnvironment(profile?: BotProfile | null) {
    return profile?.environment;
}

export function decisionIsStale(decision?: DecisionJournal | null) {
    if (!decision) return false;
    if (decision.isOldDecision) return true;
    const value = decision.createdAt ?? decision.evaluatedCandleOpenTime;
    if (!value) return false;
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return false;
    return Date.now() - time > 15 * 60_000;
}

export function botStatusText(profile?: BotProfile | null, runtime?: RuntimeStatus | null) {
    if (!profile) return "Chưa rõ";
    const hasErrors = (runtime?.lastRun?.errorSummaries?.length ?? 0) > 0;
    if (hasErrors) return "Có lỗi cần kiểm tra";
    if (profile.status === "RUNNING" && strategyExecutionBlocked(runtime)) return "Đang hoạt động";
    if (profile.status === "RUNNING") return "Đang chạy";
    if (profile.status === "PAUSED") return "Đã tạm dừng";
    if (profile.status === "STOPPED") return "Đã dừng";
    if (profile.status === "ARCHIVED") return "Đã lưu trữ";
    return profile.status;
}

export function riskStatusText(runtime?: RuntimeStatus | null) {
    if (!runtime) return "Chưa xác định";
    const dailyStatus = normalize(runtime.executionReadiness?.dailyPnlStatus);
    if (dailyStatus === "DAILY_LOSS_LIMIT_REACHED") return "Đã đạt giới hạn lỗ ngày";
    if (dailyStatus === "DAILY_PNL_INCOMPLETE") return "Thiếu dữ liệu PnL thật";
    const positions = runtime?.protectionSummary?.activePositions ?? [];
    if (!positions.length) return "Bình thường";
    const unprotected = positions.find((position) => normalize(position.protectionState) !== "PROTECTED");
    if (unprotected) return "Bình thường";
    return "Đang được bảo vệ";
}

export function strategyExecutionBlocked(runtime?: RuntimeStatus | null) {
    const gate = normalize(runtime?.executionReadiness?.strategyGate);
    return gate === "FAIL_CLOSED" || gate.includes("NOT_APPROVED") || gate.includes("BLOCK");
}

export function productStatusMessage(profile?: BotProfile | null, runtime?: RuntimeStatus | null) {
    if (!profile || profile.status === "STOPPED") return "Bot đã dừng";
    if (profile.status === "PAUSED") return "Bot đã tạm dừng";
    if (profile.status === "ARCHIVED") return "Bot đã lưu trữ";
    const riskText = riskStatusText(runtime);
    if (riskText.includes("giới hạn lỗ")) return "Đã đạt giới hạn lỗ trong ngày - không mở lệnh mới";
    if (riskText.includes("bảo vệ")) return "Đang xử lý an toàn vị thế - không mở lệnh mới";
    if (strategyExecutionBlocked(runtime)) return "Hệ thống đang quét bối cảnh thị trường real-time và chờ tín hiệu đạt điểm chuẩn...";
    if (profile.status === "RUNNING") return "Bot đang chạy";
    return profile.status;
}

export function activePositionText(runtime?: RuntimeStatus | null) {
    if (!runtime) return "Chưa xác định";
    const positions = runtime?.protectionSummary?.activePositions ?? [];
    if (!positions.length) return "Không có";
    return `${positions.length} vị thế`;
}

export function lastActivityText(runtime?: RuntimeStatus | null, latest?: DecisionJournal | null) {
    if (latest?.symbol) {
        const date = latest.createdAt ? new Date(latest.createdAt) : latest.evaluatedCandleOpenTime ? new Date(latest.evaluatedCandleOpenTime) : null;
        const time = date && Number.isFinite(date.getTime()) ? date.toLocaleTimeString() : "";
        return `Vừa kiểm tra ${latest.symbol}${time ? ` lúc ${time}` : ""}`;
    }
    const lastRunAt = runtime?.lastRun?.completedAt ?? runtime?.lastRun?.startedAt;
    if (lastRunAt) return `Vừa kiểm tra thị trường lúc ${new Date(lastRunAt).toLocaleTimeString()}`;
    return "Chưa có hoạt động gần đây";
}

export function reasonText(code?: string | null) {
    const normalized = normalize(code);
    const labels: Record<string, string> = {
        M5_TRIGGER_WAITING: "Đang chờ tín hiệu xác nhận trên M5",
        NO_STRATEGY_FOR_MARKET_REGIME: "Thị trường hiện chưa phù hợp với chiến lược",
        CONTEXT_CONFIDENCE_LOW: "Tín hiệu thị trường chưa đủ rõ ràng",
        INSUFFICIENT_MARKET_HISTORY: "Đang thu thập thêm dữ liệu thị trường",
        SKIPPED_NO_NEW_CLOSED_CANDLE: "Đang chờ nến mới đóng",
        ENTRY_INVALIDATION_TARGET_READY: "Đã có vùng vào lệnh và mức bảo vệ",
        RISK_REJECTED: "Bị chặn bởi giới hạn an toàn",
        APPROVED_FOR_EXECUTION: "Đủ điều kiện giao dịch",
    };
    return labels[normalized] ?? code ?? "Chưa có lý do cụ thể";
}

export function presentDecision(decision?: DecisionJournal | null, runtime?: RuntimeStatus | null, opts: { ignoreStale?: boolean } = {}) {
    const riskStatus = normalize(decision?.riskEvaluation?.status);
    const trigger = normalize(decision?.triggerStatus);
    const decisionSide = normalize(decision?.decision);
    const reasons = decision?.reasonCodes ?? [];
    const matchingPosition = (runtime?.protectionSummary?.activePositions ?? []).find((position) => (
        normalize(position.symbol) === normalize(decision?.symbol) &&
        (!position.direction || normalize(position.direction) === decisionSide)
    ));

    if (strategyExecutionBlocked(runtime)) {
        return {
            state: "STRATEGY_BLOCKED" as ProductState,
            title: "Đang hoạt động",
            summary: "Hệ thống đang quét bối cảnh thị trường real-time và chờ tín hiệu đạt điểm chuẩn...",
            detail: "Đang chờ tín hiệu đủ điều kiện",
        };
    }

    if (!decision) {
        return {
            state: "OBSERVING" as ProductState,
            title: "Đang quan sát thị trường",
            summary: "Bot chưa ghi nhận tín hiệu mới. Khi đủ dữ liệu, bot sẽ tiếp tục đánh giá cơ hội.",
            detail: "Chưa có quyết định gần đây",
        };
    }

    if (!opts.ignoreStale && decisionIsStale(decision)) {
        return {
            state: "OBSERVING" as ProductState,
            title: "Quyết định gần nhất đã cũ",
            summary: "Bot chưa có đánh giá thị trường mới đủ gần để coi là trạng thái hiện tại.",
            detail: reasonText(reasons[0]),
        };
    }

    if (matchingPosition && (decisionSide === "LONG" || decisionSide === "SHORT")) {
        return {
            state: "IN_POSITION" as ProductState,
            title: `Đang giữ ${decisionSide} ${decision.symbol}`,
            summary: "Bot đang theo dõi vị thế và trạng thái bảo vệ.",
            detail: reasonText(reasons[0]),
        };
    }

    if (riskStatus.includes("REJECT") || reasons.some((item) => normalize(item).includes("RISK"))) {
        return {
            state: "RISK_BLOCKED" as ProductState,
            title: "Tạm ngừng vào lệnh mới",
            summary: "Bot phát hiện cơ hội nhưng giới hạn an toàn hiện tại chưa cho phép vào thêm lệnh.",
            detail: reasonText(reasons[0]),
        };
    }

    if (trigger.includes("WAIT") || reasons.some((item) => normalize(item).includes("WAITING"))) {
        return {
            state: "WAITING" as ProductState,
            title: "Đang chờ điểm vào",
            summary: "Bot đã thấy bối cảnh đáng chú ý nhưng tín hiệu xác nhận chưa xuất hiện.",
            detail: reasonText(reasons[0] ?? decision.triggerStatus),
        };
    }

    if (decisionSide === "LONG" || decisionSide === "SHORT") {
        return {
            state: "WAITING" as ProductState,
            title: `Bot phát hiện cơ hội ${decisionSide} ${decision.symbol}`,
            summary: "Bot đã đưa ra tín hiệu giao dịch. Điều này chưa chứng minh lệnh đã gửi, đã khớp hoặc vị thế đã mở.",
            detail: reasonText(reasons[0]),
        };
    }

    return {
        state: "OBSERVING" as ProductState,
        title: "Đang quan sát thị trường",
        summary: `${decision.symbol} hiện chưa có cơ hội phù hợp. Bot vẫn theo dõi và chỉ vào lệnh khi đủ điều kiện.`,
        detail: reasonText(reasons[0]),
    };
}

export function productStateTone(state: ProductState): "success" | "warning" | "error" | "neutral" | "dry" | "stopped" {
    if (state === "IN_POSITION") return "success";
    if (state === "WAITING" || state === "RISK_BLOCKED" || state === "STRATEGY_BLOCKED") return "warning";
    if (state === "ERROR") return "error";
    if (state === "PAUSED") return "stopped";
    return "dry";
}
