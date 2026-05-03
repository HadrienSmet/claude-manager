export const API_BASE = "http://127.0.0.1:3001";

export class ApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
};
