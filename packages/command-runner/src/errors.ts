export const COMMAND_RUNNER_ERROR_CODE = {
    CWD_NOT_FOUND: "CWD_NOT_FOUND",
    COMMAND_BLOCKED: "COMMAND_BLOCKED",
    COMMAND_NOT_ALLOWED: "COMMAND_NOT_ALLOWED",
    SPAWN_FAILED: "SPAWN_FAILED",
    TIMEOUT: "TIMEOUT",
} as const;
export type CommandRunnerErrorCode = typeof COMMAND_RUNNER_ERROR_CODE[keyof typeof COMMAND_RUNNER_ERROR_CODE];

export class CommandRunnerError extends Error {
    readonly code: CommandRunnerErrorCode;

    constructor(code: CommandRunnerErrorCode, message: string, readonly cause?: unknown) {
        super(message);
        this.name = "CommandRunnerError";
        this.code = code;
    }
}

/** Thrown (via Result) by `run` when the process is killed due to timeout. */
export class RunTimeoutError extends Error {
    constructor(readonly ms: number) {
        super(`Command timed out after ${ms}ms`);
        this.name = "RunTimeoutError";
    }
}
