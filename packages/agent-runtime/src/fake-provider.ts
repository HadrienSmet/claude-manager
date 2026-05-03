import type { AgentProvider, AgentResponsePayload } from "./types.js";

export type FakeProviderCall = {
    readonly systemPrompt: string;
    readonly userPrompt: string;
};

/**
 * Test double for AgentProvider.
 * Records every call and returns a pre-configured JSON payload.
 * Pass `errorToThrow` to simulate a provider failure.
 */
export class FakeAgentProvider implements AgentProvider {
    readonly calls: FakeProviderCall[] = [];

    constructor(
        private readonly payload: AgentResponsePayload = {
            summary: "Fake response",
            files: [],
            commandsToRun: [],
        },
        private readonly errorToThrow: Error | null = null,
    ) {}

    async run(systemPrompt: string, userPrompt: string): Promise<string> {
        this.calls.push({ systemPrompt, userPrompt });
        if (this.errorToThrow !== null) {
            throw this.errorToThrow;
        }
        return JSON.stringify(this.payload);
    }
}
