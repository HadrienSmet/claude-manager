import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { buildServer } from "../server.js";

import type { PublicSettings } from "./config.js";

const makeDataDir = async (temps: string[]): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "api-settings-test-"));
    temps.push(dir);
    return dir;
};

type SettingsBody = { agentProvider: string; anthropicModel: string | null };

describe("GET /settings/public", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("returns fake provider with null model by default", async () => {
        const settings: PublicSettings = { agentProvider: "fake", anthropicModel: null };
        const app = await buildServer(await makeDataDir(temps), undefined, settings);

        const res = await app.inject({ method: "GET", url: "/settings/public" });

        expect(res.statusCode).toBe(200);
        const body = res.json<SettingsBody>();
        expect(body.agentProvider).toBe("fake");
        expect(body.anthropicModel).toBeNull();
    });

    it("returns anthropic provider with model when configured", async () => {
        const settings: PublicSettings = { agentProvider: "anthropic", anthropicModel: "claude-sonnet-4-6" };
        const app = await buildServer(await makeDataDir(temps), undefined, settings);

        const res = await app.inject({ method: "GET", url: "/settings/public" });

        expect(res.statusCode).toBe(200);
        const body = res.json<SettingsBody>();
        expect(body.agentProvider).toBe("anthropic");
        expect(body.anthropicModel).toBe("claude-sonnet-4-6");
    });

    it("returns anthropic provider with null model when model is not set", async () => {
        const settings: PublicSettings = { agentProvider: "anthropic", anthropicModel: null };
        const app = await buildServer(await makeDataDir(temps), undefined, settings);

        const res = await app.inject({ method: "GET", url: "/settings/public" });

        expect(res.statusCode).toBe(200);
        const body = res.json<SettingsBody>();
        expect(body.agentProvider).toBe("anthropic");
        expect(body.anthropicModel).toBeNull();
    });

    it("does not expose ANTHROPIC_API_KEY", async () => {
        const settings: PublicSettings = { agentProvider: "anthropic", anthropicModel: "claude-sonnet-4-6" };
        const app = await buildServer(await makeDataDir(temps), undefined, settings);

        const res = await app.inject({ method: "GET", url: "/settings/public" });

        const raw = res.body;
        expect(raw).not.toContain("apiKey");
        expect(raw).not.toContain("api_key");
        expect(raw).not.toContain("ANTHROPIC_API_KEY");
    });
});
