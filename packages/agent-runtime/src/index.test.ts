import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile as fsWriteFile, mkdir as fsMkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { AgentRuntimeError } from "./errors.js";
import { FakeAgentProvider } from "./fake-provider.js";
import { parseAgentResponse } from "./response-parser.js";
import { runAgent } from "./runtime.js";
import type { AgentResponsePayload } from "./types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let repoDir = "";

beforeEach(async () => {
    repoDir = await mkdtemp(join(tmpdir(), "agent-runtime-test-"));
});

afterEach(async () => {
    await rm(repoDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});

const validPayload = (overrides: Partial<AgentResponsePayload> = {}): AgentResponsePayload => ({
    summary: "Added feature",
    files: [],
    commandsToRun: [],
    ...overrides,
});

// ─── parseAgentResponse ───────────────────────────────────────────────────────

describe("parseAgentResponse", () => {
    it("parses a valid JSON payload", () => {
        const raw = JSON.stringify(validPayload({ summary: "ok" }));
        const result = parseAgentResponse(raw);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.summary).toBe("ok");
            expect(result.value.files).toEqual([]);
            expect(result.value.commandsToRun).toEqual([]);
        }
    });

    it("parses a payload with files and commands", () => {
        const raw = JSON.stringify(
            validPayload({
                files: [{ path: "src/index.ts", content: "export {}" }],
                commandsToRun: ["pnpm test"],
            }),
        );
        const result = parseAgentResponse(raw);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.files).toHaveLength(1);
            expect(result.value.commandsToRun).toEqual(["pnpm test"]);
        }
    });

    it("extracts JSON from a response with preamble text", () => {
        const payload = validPayload({ summary: "extracted" });
        const raw = `Here is my response:\n${JSON.stringify(payload)}\nThat's all.`;
        const result = parseAgentResponse(raw);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.summary).toBe("extracted");
        }
    });

    it("fails when there is no JSON object", () => {
        const result = parseAgentResponse("No JSON here at all");
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toMatch(/No JSON/i);
    });

    it("fails for invalid JSON", () => {
        const result = parseAgentResponse("{ broken json }");
        expect(result.ok).toBe(false);
    });

    it("fails when summary is missing", () => {
        const result = parseAgentResponse(JSON.stringify({ files: [], commandsToRun: [] }));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toMatch(/summary/i);
    });

    it("fails when files is missing", () => {
        const result = parseAgentResponse(JSON.stringify({ summary: "x", commandsToRun: [] }));
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toMatch(/files/i);
    });

    it("fails when a file entry is missing path or content", () => {
        const result = parseAgentResponse(
            JSON.stringify({ summary: "x", files: [{ path: "only-path" }], commandsToRun: [] }),
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toMatch(/content/i);
    });

    it("fails when commandsToRun contains a non-string", () => {
        const result = parseAgentResponse(
            JSON.stringify({ summary: "x", files: [], commandsToRun: [42] }),
        );
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.message).toMatch(/commandsToRun/i);
    });
});

// ─── FakeAgentProvider ────────────────────────────────────────────────────────

describe("FakeAgentProvider", () => {
    it("records calls and returns JSON payload", async () => {
        const provider = new FakeAgentProvider(validPayload({ summary: "fake" }));
        const response = await provider.run("sys", "usr");
        expect(provider.calls).toHaveLength(1);
        expect(provider.calls[0]?.systemPrompt).toBe("sys");
        expect(JSON.parse(response)).toMatchObject({ summary: "fake" });
    });

    it("throws when configured with errorToThrow", async () => {
        const provider = new FakeAgentProvider(
            validPayload(),
            new Error("provider down"),
        );
        await expect(provider.run("s", "u")).rejects.toThrow("provider down");
    });
});

// ─── runAgent ─────────────────────────────────────────────────────────────────

describe("runAgent — happy path", () => {
    it("writes files and returns the result", async () => {
        const provider = new FakeAgentProvider(
            validPayload({
                summary: "Created file",
                files: [{ path: "src/hello.ts", content: "export const x = 1;" }],
                commandsToRun: ["pnpm test"],
            }),
        );

        const result = await runAgent({
            repoPath: repoDir,
            userPrompt: "Add a hello module",
            provider,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.summary).toBe("Created file");
            expect(result.value.filesWritten).toEqual(["src/hello.ts"]);
            expect(result.value.commandsToRun).toEqual(["pnpm test"]);
            expect(result.value.rawResponse).toContain("Created file");
        }
    });

    it("reads context files and passes them to the provider", async () => {
        await fsMkdir(join(repoDir, "src"), { recursive: true });
        await fsWriteFile(join(repoDir, "src", "context.ts"), "// context", "utf-8");

        const provider = new FakeAgentProvider(validPayload());

        await runAgent({
            repoPath: repoDir,
            userPrompt: "Fix the bug",
            contextFiles: ["src/context.ts"],
            provider,
        });

        expect(provider.calls[0]?.systemPrompt).toContain("src/context.ts");
        expect(provider.calls[0]?.systemPrompt).toContain("// context");
    });

    it("does not execute commandsToRun — only returns them", async () => {
        const provider = new FakeAgentProvider(
            validPayload({ commandsToRun: ["rm -rf /"] }),
        );

        const result = await runAgent({
            repoPath: repoDir,
            userPrompt: "Do something",
            provider,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            // Commands are returned but NOT executed — no side effects
            expect(result.value.commandsToRun).toEqual(["rm -rf /"]);
        }
    });
});

describe("runAgent — error cases", () => {
    it("returns CONTEXT_READ_FAILED for a missing context file", async () => {
        const provider = new FakeAgentProvider(validPayload());

        const result = await runAgent({
            repoPath: repoDir,
            userPrompt: "Fix",
            contextFiles: ["nonexistent.ts"],
            provider,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(AgentRuntimeError);
            expect(result.error.code).toBe("CONTEXT_READ_FAILED");
        }
    });

    it("returns PROVIDER_FAILED when the provider throws", async () => {
        const provider = new FakeAgentProvider(validPayload(), new Error("network error"));

        const result = await runAgent({
            repoPath: repoDir,
            userPrompt: "Fix",
            provider,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("PROVIDER_FAILED");
            expect(result.error.message).toContain("network error");
        }
    });

    it("returns RESPONSE_PARSE_FAILED for a non-JSON response", async () => {
        const provider: import("./types.js").AgentProvider = {
            run: async () => "Sorry, I cannot help with that.",
        };

        const result = await runAgent({ repoPath: repoDir, userPrompt: "Fix", provider });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("RESPONSE_PARSE_FAILED");
        }
    });

    it("returns FILE_WRITE_FAILED when the agent attempts path traversal", async () => {
        const provider = new FakeAgentProvider(
            validPayload({
                files: [{ path: "../evil.txt", content: "hacked" }],
            }),
        );

        const result = await runAgent({
            repoPath: repoDir,
            userPrompt: "Exploit",
            provider,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("FILE_WRITE_FAILED");
            // Underlying cause must be a path-traversal rejection from file-system
            expect(result.error.message).toContain("../evil.txt");
        }
    });
});
