// // src/lib/apiFetch.ts
// // src/lib/apiFetch.ts
// const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";


// type ApiEnvelope<T> = {
//     success?: boolean;
//     message?: any;
//     data?: T;
//     meta?: any;
//     errors?: any;
//     statusCode?: number;
// };

// function normalizeErrorMessage(msg: any) {
//     if (!msg) return "Request failed";
//     if (Array.isArray(msg)) return msg.join(", ");
//     if (typeof msg === "object") return JSON.stringify(msg);
//     return String(msg);
// }

// function logoutAndRedirect() {
//     if (typeof window === "undefined") return;
//     localStorage.removeItem("accessToken");
//     localStorage.removeItem("refreshToken");
//     window.location.href = "/signin"; // reload sạch state
// }

// export async function apiFetch<T>(path: string, options: RequestInit = {}) {
//     const token =
//         typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

//     const headers: Record<string, string> = {
//         ...(options.headers as any),
//     };

//     if (options.body && !(options.body instanceof FormData)) {
//         headers["Content-Type"] = headers["Content-Type"] || "application/json";
//     }

//     if (token) headers["Authorization"] = `Bearer ${token}`;

//     const res = await fetch(`${API_URL}${path}`, {
//         ...options,
//         headers,
//         cache: "no-store",
//     });

//     // ✅ 1) Bắt 401 trước khi parse JSON
//     if (res.status === 401) {
//         logoutAndRedirect();
//         throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
//     }

//     // ✅ 2) parse JSON sau
//     const json: ApiEnvelope<T> = await res.json().catch(() => ({}));

//     // ✅ 3) nếu backend trả statusCode=401 trong body (phòng hờ)
//     if (json?.statusCode === 401) {
//         logoutAndRedirect();
//         throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
//     }

//     // ✅ 4) error logic
//     if (!res.ok || json?.success === false) {
//         const msg = json?.message ?? json?.errors ?? "Request failed";
//         throw new Error(normalizeErrorMessage(msg));
//     }

//     // ✅ 5) unwrap data
//     return (json.data as T) ?? ({} as T);
// }




// const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";
// src/lib/apiFetch.ts
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";

// ✅ envelope giống backend bạn đang trả
type ApiEnvelope<T> = {
  success?: boolean;
  message?: any;
  data?: T;
  meta?: any;
  errors?: any;
  statusCode?: number;
};

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function normalizeErrorMessage(msg: any) {
  if (!msg) return "Request failed";
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "object") return JSON.stringify(msg);
  return String(msg);
}

// ✅ chỉ logout nếu chắc chắn là lỗi auth token
function shouldLogoutOn401(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("jwt") ||
    m.includes("token") ||
    m.includes("unauthorized") ||
    m.includes("phiên đăng nhập") ||
    m.includes("expired") ||
    m.includes("hết hạn")
  );
}

/**
 * ✅ FE-wide event: AuthContext sẽ nghe event này để logout mềm (router.replace)
 * - Không hard redirect ở đây
 * - Tránh vòng lặp refresh / reload khó debug
 */
export const AUTH_LOGOUT_EVENT = "auth:logout";

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = { ...(options.headers as any) };

  // set content-type nếu body là JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  // parse json để lấy message/statusCode
  const json: ApiEnvelope<T> = await res.json().catch(() => ({} as any));

  const status = json?.statusCode ?? res.status;
  const msg = normalizeErrorMessage(json?.message ?? json?.errors ?? "");

  // ✅ 401: chỉ logout khi đúng kiểu token hết hạn
  if (status === 401) {
    if (shouldLogoutOn401(msg)) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
      }
      throw new ApiError(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        401,
        json
      );
    }

    // 401 nghiệp vụ -> không logout
    throw new ApiError(msg || "Unauthorized", 401, json);
  }

  // ✅ các lỗi khác
  if (!res.ok || json?.success === false) {
    throw new ApiError(msg || "Request failed", status || res.status, json);
  }

  // ✅ success: ưu tiên json.data
  return (json.data as T) ?? ({} as T);
}
