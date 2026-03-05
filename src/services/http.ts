// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3007";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://apicrypto.voduyquang.com";



export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = json?.message || "Request failed";
        throw new Error(Array.isArray(msg) ? msg.join(", ") : msg);
    }

    // unwrap ApiResponse { data: ... }
    return (json.data ?? json) as T;
}
