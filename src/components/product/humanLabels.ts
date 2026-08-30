export function humanLabel(value?: string | null) {
    const normalized = String(value ?? "").toUpperCase();
    const labels: Record<string, string> = {
        NO_TRADE: "Chưa có cơ hội phù hợp",
        LONG: "Mua",
        SHORT: "Bán",
        PROTECTED: "Đã có cắt lỗ và chốt lời",
        SKIPPED_NO_NEW_CLOSED_CANDLE: "Đang chờ nến mới",
        INSUFFICIENT_MARKET_HISTORY: "Đang thu thập thêm dữ liệu",
        RUNNING: "Đang chạy",
        PAUSED: "Đang tạm dừng",
        STOPPED: "Đã dừng",
        FAILED: "Có lỗi",
        ERROR: "Có lỗi",
        VERIFIED: "Đã kết nối",
        NOT_VERIFIED: "Chưa kiểm tra",
        ACTIVE: "Đang hoạt động",
        DISABLED: "Đã tắt",
        ENABLED: "Đang bật",
        PENDING: "Đang xử lý",
        APPROVED_FOR_EXECUTION: "Đủ điều kiện",
        REJECTED: "Không đạt điều kiện",
        EXECUTED: "Đã gửi lệnh",
        PREVIEW: "Nháp",
        EXPIRED: "Đã hết hạn",
        OPEN: "Đang mở",
        CLOSED: "Đã đóng",
        TESTNET: "Tài khoản thử nghiệm",
        DEMO: "Tài khoản thử nghiệm",
        LIVE: "Tài khoản thực tế",
        OKX_DEMO: "Tài khoản thử nghiệm",
        BINANCE_DEMO: "Tài khoản thử nghiệm",
        OKX_PRODUCTION: "Tài khoản thực tế",
        BINANCE_PRODUCTION: "Tài khoản thực tế",
        BINGX_PRODUCTION: "Tài khoản thực tế",
        "BOT ĐƯỢC ĐẶT LỆNH": "Bot được đặt lệnh",
        "BOT KHÔNG ĐƯỢC ĐẶT LỆNH": "Bot không được đặt lệnh",
    };
    return labels[normalized] ?? value ?? "Chưa rõ";
}

export function formatDateTime(value?: string | null) {
    if (!value) return "Chưa có";
    return new Date(value).toLocaleString();
}

export function formatMoney(value?: number | null) {
    if (value == null || !Number.isFinite(Number(value))) return "Chưa khả dụng";
    return `${Number(value).toFixed(2)} USDT`;
}
