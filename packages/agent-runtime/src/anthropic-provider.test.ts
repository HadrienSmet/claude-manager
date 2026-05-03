import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Anthropic from "@anthropic-ai/sdk";

import {
    AnthropicProvider,
    AnthropicProviderError,
    ANTHROPIC_PROVIDER_ERROR_CODE,
    createAnthropicProviderFromEnv,
} from "./anthropic-provider.js";

vi.mock("@anthropic-ai/sdk");

// ─── AnthropicProvider ────────────────────────────────────────────────────────

describe("AnthropicProvider", () => {
    let mockCreate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockCreate = vi.fn();
        vi.mocked(Anthropic).mockImplementation(
            () => ({ messages: { create: mockCreate } }) as unknown as Anthropic,
        );
    });

    it("calls the API with the correct shape", async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: "text", text: '{"summary":"ok","files":[],"commandsToRun":[]}' }],
        });

        const provider = new AnthropicProvider("test-key");
        const result = await provider.run("system prompt", "user prompt");

        expect(mockCreate).toHaveBeenCalledOnce();
        const call = mockCreate.mock.calls[0]?.[0];
        expect(call?.model).toBe("claude-opus-4-7");
        expect(call?.messages).toEqual([{ role: "user", content: "user prompt" }]);
        expect(result).toBe('{"summary":"ok","files":[],"commandsToRun":[]}');
    });

    it("passes the system prompt as an array with cache_control", async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: "text", text: "response" }],
        });

        await new AnthropicProvider("test-key").run("cached system", "user msg");

        const call = mockCreate.mock.calls[0]?.[0];
        expect(call?.system).toEqual([
            { type: "text", text: "cached system", cache_control: { type: "ephemeral" } },
        ]);
    });

    it("does not send thinking by default", async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: "text", text: "response" }],
        });

        await new AnthropicProvider("test-key").run("sys", "usr");

        const call = mockCreate.mock.calls[0]?.[0];
        expect(call).not.toHaveProperty("thinking");
    });

    it("sends thinking: adaptive when enableThinking is true", async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ type: "text", text: "response" }],
        });

        await new AnthropicProvider("test-key", { enableThinking: true }).run("sys", "usr");

        const call = mockCreate.mock.calls[0]?.[0];
        expect(call?.thinking).toEqual({ type: "adaptive" });
    });

    it("returns the text block even when thinking blocks are present", async () => {
        const expected = '{"summary":"done","files":[],"commandsToRun":[]}';
        mockCreate.mockResolvedValueOnce({
            content: [{ type: "thinking", thinking: "..." }, { type: "text", text: expected }],
        });

        const result = await new AnthropicProvider("test-key").run("sys", "usr");
        expect(result).toBe(expected);
    });

    it("uses a custom model when provided", async () => {
        mockCreate.mockResolvedValueOnce({ content: [{ type: "text", text: "r" }] });

        await new AnthropicProvider("test-key", { model: "claude-sonnet-4-6" }).run("sys", "usr");

        expect(mockCreate.mock.calls[0]?.[0]?.model).toBe("claude-sonnet-4-6");
    });

    it("throws UNEXPECTED_RESPONSE when no text block is present", async () => {
        mockCreate.mockResolvedValue({
            content: [{ type: "thinking", thinking: "only thinking" }],
        });

        await expect(new AnthropicProvider("test-key").run("sys", "usr")).rejects.toMatchObject({
            code: ANTHROPIC_PROVIDER_ERROR_CODE.UNEXPECTED_RESPONSE,
        });
    });

    it("throws API_ERROR when the API call rejects", async () => {
        mockCreate.mockRejectedValueOnce(new Error("network error"));

        await expect(new AnthropicProvider("test-key").run("sys", "usr")).rejects.toMatchObject({
            code: ANTHROPIC_PROVIDER_ERROR_CODE.API_ERROR,
            message: expect.stringContaining("network error"),
        });
    });

    it("wraps API errors as AnthropicProviderError", async () => {
        mockCreate.mockRejectedValueOnce(new Error("timeout"));

        await expect(new AnthropicProvider("test-key").run("sys", "usr")).rejects.toBeInstanceOf(
            AnthropicProviderError,
        );
    });
});

// ─── createAnthropicProviderFromEnv ──────────────────────────────────────────

describe("createAnthropicProviderFromEnv", () => {
    beforeEach(() => {
        vi.mocked(Anthropic).mockImplementation(
            () => ({ messages: { create: vi.fn() } }) as unknown as Anthropic,
        );
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("throws MISSING_API_KEY when ANTHROPIC_API_KEY is empty", () => {
        vi.stubEnv("ANTHROPIC_API_KEY", "");

        expect(() => createAnthropicProviderFromEnv()).toThrow(AnthropicProviderError);
        expect(() => createAnthropicProviderFromEnv()).toThrow(
            expect.objectContaining({ code: ANTHROPIC_PROVIDER_ERROR_CODE.MISSING_API_KEY }),
        );
    });

    it("creates a provider when ANTHROPIC_API_KEY is set", () => {
        vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");

        expect(createAnthropicProviderFromEnv()).toBeInstanceOf(AnthropicProvider);
    });

    it("uses ANTHROPIC_MODEL when set", () => {
        vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
        vi.stubEnv("ANTHROPIC_MODEL", "claude-sonnet-4-6");

        expect(createAnthropicProviderFromEnv()).toBeInstanceOf(AnthropicProvider);
    });
});
