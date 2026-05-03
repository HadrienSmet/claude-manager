import type { Provider } from "./store.js";

export type Fetcher = typeof globalThis.fetch;

export type TestOutcome = { ok: boolean; message: string };

export type ProviderTester = {
    test: (provider: Provider, secret: string) => Promise<TestOutcome>;
};

type PingConfig = {
    url: string;
    headers: (secret: string) => Record<string, string>;
};

const PING: Record<Provider, PingConfig> = {
    anthropic: {
        url: "https://api.anthropic.com/v1/models",
        headers: (secret) => ({
            "x-api-key": secret,
            "anthropic-version": "2023-06-01",
        }),
    },
    openai: {
        url: "https://api.openai.com/v1/models",
        headers: (secret) => ({
            Authorization: `Bearer ${secret}`,
        }),
    },
    github: {
        url: "https://api.github.com/user",
        headers: (secret) => ({
            Authorization: `Bearer ${secret}`,
            "User-Agent": "claude-manager",
        }),
    },
};

export const createProviderTester = (options?: {
    timeoutMs?: number;
    fetcher?: Fetcher;
}): ProviderTester => {
    const timeoutMs = options?.timeoutMs ?? 5000;
    const fetcher = options?.fetcher ?? globalThis.fetch;

    return {
        test: async (provider, secret) => {
            const { url, headers } = PING[provider];
            try {
                const res = await fetcher(url, {
                    method: "GET",
                    headers: headers(secret),
                    signal: AbortSignal.timeout(timeoutMs),
                });
                if (res.ok) {
                    return { ok: true, message: "Connection successful" };
                }
                if (res.status === 401 || res.status === 403) {
                    return { ok: false, message: "Invalid credentials" };
                }
                return { ok: false, message: `Unexpected response status ${res.status}` };
            } catch (err) {
                if (err instanceof Error && err.name === "TimeoutError") {
                    return { ok: false, message: "Request timed out" };
                }
                return { ok: false, message: "Connection failed" };
            }
        },
    };
};
