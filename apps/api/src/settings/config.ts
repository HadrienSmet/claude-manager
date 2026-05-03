export type AgentProviderName = "fake" | "anthropic";

export type PublicSettings = {
    readonly agentProvider: AgentProviderName;
    readonly anthropicModel: string | null;
};

export const readPublicSettings = (): PublicSettings => {
    const raw = process.env["AGENT_PROVIDER"] ?? "";
    const agentProvider: AgentProviderName = raw === "anthropic" ? "anthropic" : "fake";
    const anthropicModel = process.env["ANTHROPIC_MODEL"] ?? null;
    return { agentProvider, anthropicModel };
};
