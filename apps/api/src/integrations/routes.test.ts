import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildServer } from "../server.js";
import { ENV_VARS } from "./store.js";

type ProviderStatus = {
    provider: string;
    configured: boolean;
    source: "store" | "env" | null;
    updatedAt: string | null;
};

const makeTestDirs = async (temps: string[]): Promise<{ dataDir: string; credentialsFile: string }> => {
    const dir = await mkdtemp(join(tmpdir(), "api-integrations-test-"));
    temps.push(dir);
    return { dataDir: join(dir, "data"), credentialsFile: join(dir, "credentials.json") };
};

// Save and clear all integration env vars, returning a restore function.
const clearIntegrationEnv = (): (() => void) => {
    const saved: Partial<Record<string, string>> = {};
    for (const key of Object.values(ENV_VARS)) {
        saved[key] = process.env[key];
        delete process.env[key];
    }
    return () => {
        for (const [key, val] of Object.entries(saved)) {
            if (val === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = val;
            }
        }
    };
};

describe("GET /integrations", () => {
    const temps: string[] = [];
    let restoreEnv: () => void;

    beforeEach(() => {
        restoreEnv = clearIntegrationEnv();
    });

    afterEach(async () => {
        restoreEnv();
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("returns all providers unconfigured by default", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({ method: "GET", url: "/integrations" });

        expect(res.statusCode).toBe(200);
        const body = res.json<ProviderStatus[]>();
        expect(body).toHaveLength(3);
        expect(body.map((p) => p.provider)).toEqual(["anthropic", "openai", "github"]);
        for (const item of body) {
            expect(item.configured).toBe(false);
            expect(item.source).toBeNull();
            expect(item.updatedAt).toBeNull();
        }
    });

    it("reflects configured=true with source=store after a PUT", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        await app.inject({
            method: "PUT",
            url: "/integrations/anthropic",
            payload: { secret: "sk-ant-test" },
        });

        const res = await app.inject({ method: "GET", url: "/integrations" });
        const body = res.json<ProviderStatus[]>();
        const anthropic = body.find((p) => p.provider === "anthropic")!;
        expect(anthropic.configured).toBe(true);
        expect(anthropic.source).toBe("store");
        expect(anthropic.updatedAt).not.toBeNull();
    });

    it("never returns raw secrets", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        await app.inject({
            method: "PUT",
            url: "/integrations/openai",
            payload: { secret: "sk-openai-supersecret" },
        });

        const res = await app.inject({ method: "GET", url: "/integrations" });
        expect(res.body).not.toContain("sk-openai-supersecret");
        expect(res.body).not.toContain("secret");
    });
});

describe("PUT /integrations/:provider", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("stores anthropic credentials and returns 200", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/anthropic",
            payload: { secret: "sk-ant-123" },
        });

        expect(res.statusCode).toBe(200);
        const body = res.json<{ provider: string; configured: boolean }>();
        expect(body.provider).toBe("anthropic");
        expect(body.configured).toBe(true);
    });

    it("stores openai credentials and returns 200", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/openai",
            payload: { secret: "sk-openai-456" },
        });

        expect(res.statusCode).toBe(200);
        expect(res.json<{ provider: string }>().provider).toBe("openai");
    });

    it("stores github credentials and returns 200", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/github",
            payload: { secret: "ghp_token123" },
        });

        expect(res.statusCode).toBe(200);
        expect(res.json<{ provider: string }>().provider).toBe("github");
    });

    it("returns 400 for unknown provider", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/unknown-llm",
            payload: { secret: "some-key" },
        });

        expect(res.statusCode).toBe(400);
        expect(res.json<{ error: string }>().error).toMatch(/unknown provider/i);
    });

    it("returns 400 when secret is missing", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/anthropic",
            payload: {},
        });

        expect(res.statusCode).toBe(400);
    });

    it("returns 400 when secret is empty string", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/anthropic",
            payload: { secret: "" },
        });

        expect(res.statusCode).toBe(400);
    });

    it("response body never contains the secret value", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({
            method: "PUT",
            url: "/integrations/anthropic",
            payload: { secret: "sk-ant-verysecret" },
        });

        expect(res.body).not.toContain("sk-ant-verysecret");
    });
});

describe("DELETE /integrations/:provider", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("removes configured credentials and returns 204", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        await app.inject({
            method: "PUT",
            url: "/integrations/github",
            payload: { secret: "ghp_to-delete" },
        });

        const del = await app.inject({ method: "DELETE", url: "/integrations/github" });
        expect(del.statusCode).toBe(204);

        const list = await app.inject({ method: "GET", url: "/integrations" });
        const github = list.json<ProviderStatus[]>().find((p) => p.provider === "github")!;
        expect(github.configured).toBe(false);
    });

    it("returns 204 even when provider was not configured (idempotent)", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({ method: "DELETE", url: "/integrations/openai" });
        expect(res.statusCode).toBe(204);
    });

    it("returns 400 for unknown provider", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({ method: "DELETE", url: "/integrations/not-a-provider" });
        expect(res.statusCode).toBe(400);
    });
});

describe("env fallback", () => {
    const temps: string[] = [];
    let restoreEnv: () => void;

    beforeEach(() => {
        restoreEnv = clearIntegrationEnv();
    });

    afterEach(async () => {
        restoreEnv();
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("reports configured=true with source=env when env var is set and store is empty", async () => {
        process.env["ANTHROPIC_API_KEY"] = "sk-ant-from-env";
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({ method: "GET", url: "/integrations" });
        const body = res.json<ProviderStatus[]>();

        const anthropic = body.find((p) => p.provider === "anthropic")!;
        expect(anthropic.configured).toBe(true);
        expect(anthropic.source).toBe("env");
        expect(anthropic.updatedAt).toBeNull();

        // Other providers without env vars remain unconfigured
        const openai = body.find((p) => p.provider === "openai")!;
        expect(openai.configured).toBe(false);
    });

    it("store takes priority over env var when both are set", async () => {
        process.env["ANTHROPIC_API_KEY"] = "sk-ant-from-env";
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        await app.inject({
            method: "PUT",
            url: "/integrations/anthropic",
            payload: { secret: "sk-ant-from-store" },
        });

        const res = await app.inject({ method: "GET", url: "/integrations" });
        const anthropic = res.json<ProviderStatus[]>().find((p) => p.provider === "anthropic")!;
        expect(anthropic.configured).toBe(true);
        expect(anthropic.source).toBe("store");
        expect(anthropic.updatedAt).not.toBeNull();
    });

    it("falls back to env after store entry is deleted", async () => {
        process.env["GITHUB_TOKEN"] = "ghp_from-env";
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        // Store a secret, then delete it
        await app.inject({
            method: "PUT",
            url: "/integrations/github",
            payload: { secret: "ghp_from-store" },
        });
        await app.inject({ method: "DELETE", url: "/integrations/github" });

        const res = await app.inject({ method: "GET", url: "/integrations" });
        const github = res.json<ProviderStatus[]>().find((p) => p.provider === "github")!;
        expect(github.configured).toBe(true);
        expect(github.source).toBe("env");
    });

    it("never exposes env var value in the response body", async () => {
        process.env["OPENAI_API_KEY"] = "sk-openai-env-secret-value";
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile);

        const res = await app.inject({ method: "GET", url: "/integrations" });
        expect(res.body).not.toContain("sk-openai-env-secret-value");
        expect(res.body).not.toContain("secret");
    });
});
