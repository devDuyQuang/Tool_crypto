// src/services/auth.service.ts
// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3007";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";
export type LoginBody = {
    email: string;
    password: string;
};

export type LoginResult = {
    accessToken: string;
    refreshToken?: string;
};

// Kiểu user trả về từ /auth/me (FE dùng)
export type MeResult = {
    id: string;
    email: string;
    role: string;
    fullName: string;
    isActive?: boolean;
    avatarUrl?: string | null;

    // Nếu sau này BE có thêm field thì cứ mở rộng
    phone?: string;
    bio?: string;
    address?: {
        country?: string;
        cityState?: string;
        postalCode?: string;
        taxId?: string;
    };
    social?: {
        facebook?: string;
        x?: string;
        linkedin?: string;
        instagram?: string;
    };
};

function getErrMsg(json: any, fallback: string) {
    const msg = json?.message || fallback;
    return Array.isArray(msg) ? msg.join(", ") : String(msg);
}

/**
 * unwrap linh hoạt:
 * - có thể BE trả thẳng object
 * - hoặc {data: ...}
 * - hoặc {data: {data: ...}} (case của bạn trên postman)
 */
function unwrapDeep<T>(json: any): T {
    let x = json;
    // unwrap tối đa 3 lần để tránh loop
    for (let i = 0; i < 3; i++) {
        if (x && typeof x === "object" && "data" in x) x = x.data;
        else break;
    }
    return x as T;
}

export async function login(body: LoginBody): Promise<LoginResult> {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(getErrMsg(json, "Login failed"));

    const data = unwrapDeep<LoginResult>(json);

    if (!data?.accessToken) {
        throw new Error("Login response missing accessToken");
    }

    return data;
}

export async function me(accessToken: string): Promise<MeResult> {
    if (!accessToken) throw new Error("No access token");

    const res = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(getErrMsg(json, "Load profile failed"));

    const raw = unwrapDeep<any>(json);

    // normalize id (BE bạn trả id rồi)
    const id = raw?.id ?? raw?._id ?? raw?.sub;
    if (!id) throw new Error("Missing id from /auth/me response");

    return {
        id: String(id),
        email: raw.email,
        role: raw.role,
        fullName: raw.fullName ?? "", // đảm bảo string
        isActive: raw.isActive,
        avatarUrl: raw.avatarUrl ?? null,
        phone: raw.phone,
        bio: raw.bio,
        address: raw.address,
        social: raw.social,
    };
}