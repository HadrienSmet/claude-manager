import { AgentProvider, FakeAgentProvider, createAnthropicProviderFromEnv } from "@claude-manager/agent-runtime";

export const createProvider = (): AgentProvider => {
    if (process.env["AGENT_PROVIDER"] === "anthropic") {
        return createAnthropicProviderFromEnv();
    }
    return new FakeAgentProvider();
};
