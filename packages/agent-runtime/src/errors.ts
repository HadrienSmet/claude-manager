export const AGENT_RUNTIME_ERROR_CODE = {
    CONTEXT_READ_FAILED: "CONTEXT_READ_FAILED",
    PROVIDER_FAILED: "PROVIDER_FAILED",
    RESPONSE_PARSE_FAILED: "RESPONSE_PARSE_FAILED",
    FILE_WRITE_FAILED: "FILE_WRITE_FAILED",
} as const;

export type AgentRuntimeErrorCode = typeof AGENT_RUNTIME_ERROR_CODE[keyof typeof AGENT_RUNTIME_ERROR_CODE];

export class AgentRuntimeError extends Error {
    readonly code: AgentRuntimeErrorCode;

    constructor(code: AgentRuntimeErrorCode, message: string, readonly cause?: unknown) {
        super(message);
        this.name = "AgentRuntimeError";
        this.code = code;
    }
}
