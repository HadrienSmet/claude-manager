import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildServer } from "../server.js";
import { ENV_VARS } from "./store.js";
import type { Fetcher } from "./tester.js";

type TestBody = { provider: string; ok: boolean; message: string };

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

const makeTestDirs = async (temps: string[]): Promise<{ dataDir: string; credentialsFile: string }> => {
    const dir = await mkdtemp(join(tmpdir(), "api-tester-test-"));
    temps.push(dir);
    return { dataDir: join(dir, "data"), credentialsFile: join(dir, "credentials.json") };
};

const ok200 = (): Promise<Response> => Promise.resolve(new Response(null, { status: 200 }));
const fail401 = (): Promise<Response> => Promise.resolve(new Response(null, { status: 401 }));
const fail500 = (): Promise<Response> => Promise.resolve(new Response(null, { status: 500 }));

describe("POST /integrations/:provider/test", () => {
    const temps: string[] = [];
    let restoreEnv: () => void;
    let mockFetch: ReturnType<typeof vi.fn<Fetcher>>;

    beforeEach(() => {
        restoreEnv = clearIntegrationEnv();
        mockFetch = vi.fn<Fetcher>();
    });

    afterEach(async () => {
        restoreEnv();
        vi.restoreAllMocks();
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    // --- happy paths ---

    it("returns ok=true for anthropic when API returns 200", async () => {
        mockFetch.mockImplementation(ok200);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/anthropic", payload: { secret: "sk-ant-123" } });

        const res = await app.inject({ method: "POST", url: "/integrations/anthropic/test" });
        expect(res.statusCode).toBe(200);
        const body = res.json<TestBody>();
        expect(body.provider).toBe("anthropic");
        expect(body.ok).toBe(true);
        expect(body.message).toBe("Connection successful");
    });

    it("returns ok=true for openai when API returns 200", async () => {
        mockFetch.mockImplementation(ok200);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/openai", payload: { secret: "sk-openai-456" } });

        const res = await app.inject({ method: "POST", url: "/integrations/openai/test" });
        expect(res.statusCode).toBe(200);
        expect(res.json<TestBody>().ok).toBe(true);
    });

    it("returns ok=true for github when API returns 200", async () => {
        mockFetch.mockImplementation(ok200);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/github", payload: { secret: "ghp_token" } });

        const res = await app.inject({ method: "POST", url: "/integrations/github/test" });
        expect(res.statusCode).toBe(200);
        expect(res.json<TestBody>().ok).toBe(true);
    });

    // --- auth failure ---

    it("returns ok=false when API returns 401", async () => {
        mockFetch.mockImplementation(fail401);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/anthropic", payload: { secret: "sk-ant-bad" } });

        const res = await app.inject({ method: "POST", url: "/integrations/anthropic/test" });
        const body = res.json<TestBody>();
        expect(body.ok).toBe(false);
        expect(body.message).toMatch(/invalid credentials/i);
    });

    it("returns ok=false when API returns 403", async () => {
        mockFetch.mockImplementation(() => Promise.resolve(new Response(null, { status: 403 })));
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/github", payload: { secret: "ghp_bad" } });

        const res = await app.inject({ method: "POST", url: "/integrations/github/test" });
        expect(res.json<TestBody>().ok).toBe(false);
    });

    it("returns ok=false on unexpected status", async () => {
        mockFetch.mockImplementation(fail500);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/openai", payload: { secret: "sk-openai-x" } });

        const res = await app.inject({ method: "POST", url: "/integrations/openai/test" });
        const body = res.json<TestBody>();
        expect(body.ok).toBe(false);
        expect(body.message).toContain("500");
    });

    // --- network errors ---

    it("returns ok=false on network error", async () => {
        mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/anthropic", payload: { secret: "sk-ant-x" } });

        const res = await app.inject({ method: "POST", url: "/integrations/anthropic/test" });
        const body = res.json<TestBody>();
        expect(body.ok).toBe(false);
        expect(body.message).toMatch(/connection failed/i);
    });

    it("returns ok=false on timeout", async () => {
        const timeoutError = new DOMException("The operation timed out.", "TimeoutError");
        mockFetch.mockRejectedValue(timeoutError);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/openai", payload: { secret: "sk-openai-slow" } });

        const res = await app.inject({ method: "POST", url: "/integrations/openai/test" });
        const body = res.json<TestBody>();
        expect(body.ok).toBe(false);
        expect(body.message).toMatch(/timed out/i);
    });

    // --- no secret ---

    it("returns ok=false with clear message when no secret is configured", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        const res = await app.inject({ method: "POST", url: "/integrations/anthropic/test" });
        expect(res.statusCode).toBe(200);
        const body = res.json<TestBody>();
        expect(body.ok).toBe(false);
        expect(body.message).toMatch(/no secret/i);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("resolves secret from env var when store is empty", async () => {
        process.env["GITHUB_TOKEN"] = "ghp_from-env";
        mockFetch.mockImplementation(ok200);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        const res = await app.inject({ method: "POST", url: "/integrations/github/test" });
        expect(res.json<TestBody>().ok).toBe(true);
        expect(mockFetch).toHaveBeenCalledOnce();
    });

    // --- unknown provider ---

    it("returns 400 for unknown provider", async () => {
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        const res = await app.inject({ method: "POST", url: "/integrations/unknown/test" });
        expect(res.statusCode).toBe(400);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    // --- secret never exposed ---

    it("never exposes the secret in the response body", async () => {
        mockFetch.mockImplementation(ok200);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        await app.inject({ method: "PUT", url: "/integrations/anthropic", payload: { secret: "sk-ant-topsecret" } });

        const res = await app.inject({ method: "POST", url: "/integrations/anthropic/test" });
        expect(res.body).not.toContain("sk-ant-topsecret");
    });

    it("verifies correct ping URL is called for each provider", async () => {
        mockFetch.mockImplementation(ok200);
        const { dataDir, credentialsFile } = await makeTestDirs(temps);
        const app = await buildServer(dataDir, undefined, undefined, credentialsFile, mockFetch);

        for (const [provider, url] of [
            ["anthropic", "https://api.anthropic.com/v1/models"],
            ["openai", "https://api.openai.com/v1/models"],
            ["github", "https://api.github.com/user"],
        ] as const) {
            await app.inject({ method: "PUT", url: `/integrations/${provider}`, payload: { secret: "test-secret" } });
            await app.inject({ method: "POST", url: `/integrations/${provider}/test` });

            const lastCall = mockFetch.mock.calls.at(-1)!;
            expect(lastCall[0]).toBe(url);
        }
    });
});
