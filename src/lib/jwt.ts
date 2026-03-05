export function decodeJwt<T = any>(token: string): T | null {
    try {
        const [, payload] = token.split('.');
        if (!payload) return null;

        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

        const json = atob(padded);
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}