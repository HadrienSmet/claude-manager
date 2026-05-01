export type AgentResponse = {
    readonly content: string;
    readonly model: string;
    readonly usage: {
        readonly inputTokens: number;
        readonly outputTokens: number;
    };
};

export type AgentProvider = {
    readonly id: string;
    readonly model: string;
    readonly run: (prompt: string) => Promise<AgentResponse>;
};
