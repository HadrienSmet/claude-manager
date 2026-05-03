import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

export const PROVIDERS = ["anthropic", "openai", "github"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const DEFAULT_CREDENTIALS_FILE = join(homedir(), ".claude-manager", "credentials.json");

export const ENV_VARS: Record<Provider, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    github: "GITHUB_TOKEN",
};

type StoredEntry = { secret: string; updatedAt: string };
type StorageShape = { credentials: Partial<Record<Provider, StoredEntry>> };

export type ProviderStatus = {
    provider: Provider;
    configured: boolean;
    source: "store" | "env" | null;
    updatedAt: string | null;
};

export type CredentialsStore = {
    list: () => Promise<ProviderStatus[]>;
    /** Returns the raw secret (store > env fallback). Never expose in API responses. */
    resolve: (provider: Provider) => Promise<string | null>;
    set: (provider: Provider, secret: string) => Promise<void>;
    remove: (provider: Provider) => Promise<void>;
};

export const createCredentialsStore = (dataFile: string = DEFAULT_CREDENTIALS_FILE): CredentialsStore => {
    const load = async (): Promise<StorageShape> => {
        try {
            const raw = await readFile(dataFile, "utf-8");
            return JSON.parse(raw) as StorageShape;
        } catch {
            return { credentials: {} };
        }
    };

    const save = async (data: StorageShape): Promise<void> => {
        await mkdir(dirname(dataFile), { recursive: true });
        await writeFile(dataFile, JSON.stringify(data, null, 2), "utf-8");
    };

    return {
        list: async () => {
            const data = await load();
            return PROVIDERS.map((provider) => {
                const stored = data.credentials[provider];
                if (stored !== undefined) {
                    return { provider, configured: true, source: "store" as const, updatedAt: stored.updatedAt };
                }
                const envVal = process.env[ENV_VARS[provider]];
                if (envVal !== undefined && envVal.length > 0) {
                    return { provider, configured: true, source: "env" as const, updatedAt: null };
                }
                return { provider, configured: false, source: null, updatedAt: null };
            });
        },

        resolve: async (provider) => {
            const data = await load();
            const stored = data.credentials[provider];
            if (stored !== undefined) return stored.secret;
            const envVal = process.env[ENV_VARS[provider]];
            return envVal !== undefined && envVal.length > 0 ? envVal : null;
        },

        set: async (provider, secret) => {
            const data = await load();
            data.credentials[provider] = { secret, updatedAt: new Date().toISOString() };
            await save(data);
        },

        remove: async (provider) => {
            const data = await load();
            delete data.credentials[provider];
            await save(data);
        },
    };
};
