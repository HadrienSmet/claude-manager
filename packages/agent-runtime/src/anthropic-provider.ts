import Anthropic from "@anthropic-ai/sdk";

import type { AgentProvider } from "./types.js";

export const ANTHROPIC_PROVIDER_ERROR_CODE = {
    MISSING_API_KEY: "MISSING_API_KEY",
    API_ERROR: "API_ERROR",
    UNEXPECTED_RESPONSE: "UNEXPECTED_RESPONSE",
} as const;

export type AnthropicProviderErrorCode = typeof ANTHROPIC_PROVIDER_ERROR_CODE[keyof typeof ANTHROPIC_PROVIDER_ERROR_CODE];

export class AnthropicProviderError extends Error {
    readonly code: AnthropicProviderErrorCode;

    constructor(code: AnthropicProviderErrorCode, message: string, readonly cause?: unknown) {
        super(message);
        this.name = "AnthropicProviderError";
        this.code = code;
    }
}

export type AnthropicProviderOptions = {
    /** Defaults to "claude-opus-4-7". */
    readonly model?: string;
    /** When true, passes thinking: { type: "adaptive" }. Only supported on Opus 4.7+. */
    readonly enableThinking?: boolean;
};

const DEFAULT_MODEL = "claude-opus-4-7";

export class AnthropicProvider implements AgentProvider {
    private readonly client: Anthropic;
    private readonly model: string;
    private readonly enableThinking: boolean;

    constructor(apiKey: string, options: AnthropicProviderOptions = {}) {
        this.client = new Anthropic({ apiKey });
        this.model = options.model ?? DEFAULT_MODEL;
        this.enableThinking = options.enableThinking ?? false;
    }

    async run(systemPrompt: string, userPrompt: string): Promise<string> {
        let response: Anthropic.Message;
        try {
            response = await this.client.messages.create({
                model: this.model,
                max_tokens: 16000,
                ...(this.enableThinking ? { thinking: { type: "adaptive" } } : {}),
                system: [
                    {
                        type: "text",
                        text: systemPrompt,
                        cache_control: { type: "ephemeral" },
                    },
                ],
                messages: [{ role: "user", content: userPrompt }],
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            throw new AnthropicProviderError(
                ANTHROPIC_PROVIDER_ERROR_CODE.API_ERROR,
                `Claude API call failed: ${msg}`,
                error,
            );
        }

        const textBlock = response.content.find((block) => block.type === "text");
        if (textBlock === undefined || textBlock.type !== "text") {
            throw new AnthropicProviderError(
                ANTHROPIC_PROVIDER_ERROR_CODE.UNEXPECTED_RESPONSE,
                `No text block in response. Got: ${response.content.map((b) => b.type).join(", ")}`,
            );
        }

        return textBlock.text;
    }
}

export const createAnthropicProviderFromEnv = (): AnthropicProvider => {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
        throw new AnthropicProviderError(
            ANTHROPIC_PROVIDER_ERROR_CODE.MISSING_API_KEY,
            "ANTHROPIC_API_KEY environment variable is not set",
        );
    }
    const model = process.env["ANTHROPIC_MODEL"];
    return new AnthropicProvider(apiKey, model !== undefined ? { model } : {});
};
