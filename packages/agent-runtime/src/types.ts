/** A file produced or modified by the agent. */
export type AgentResponseFile = {
    readonly path: string;    // relative to repo root
    readonly content: string; // full file content (not a diff)
};

/** The JSON structure the agent must return. */
export type AgentResponsePayload = {
    readonly summary: string;
    readonly files: readonly AgentResponseFile[];
    readonly commandsToRun: readonly string[];
};

/** Minimal interface any agent provider must satisfy. */
export type AgentProvider = {
    readonly run: (systemPrompt: string, userPrompt: string) => Promise<string>;
};

/** Input for a single agent run. */
export type AgentRunInput = {
    readonly repoPath: string;
    readonly userPrompt: string;
    /** Relative paths to files that will be prepended to the system prompt as context. */
    readonly contextFiles?: readonly string[];
    readonly provider: AgentProvider;
};

/** Result of a successful agent run. */
export type AgentRunResult = {
    readonly summary: string;
    readonly filesWritten: readonly string[];
    /** Commands the agent requested to run — returned as-is, NOT executed. */
    readonly commandsToRun: readonly string[];
    readonly rawResponse: string;
};
