// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3007";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";
const TOKEN_KEY = "accessToken";

function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    if (!token) throw new Error("No access token");

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json?.message ? (Array.isArray(json.message) ? json.message.join(", ") : String(json.message)) : "Request failed";
        throw new Error(msg);
    }

    return (json?.data ?? json) as T;
}

// ✅ update profile (name/email/phone/bio/avatarUrl...)
export function updateMeProfile(payload: {
    fullName?: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
}) {
    return request<any>(`/profile/me`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

// ✅ update address
export function updateMeAddress(payload: {
    country?: string | null;
    cityState?: string | null;
    postalCode?: string | null;
    taxId?: string | null;
}) {
    return request<any>(`/profile/me/address`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

// ✅ update social
export function updateMeSocial(payload: {
    facebook?: string | null;
    x?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
}) {
    return request<any>(`/profile/me/social`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}