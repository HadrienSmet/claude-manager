import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";
import { CommandRunnerError, RunTimeoutError } from "./errors.js";
import { checkPolicy } from "./policy.js";
import { resolveExecutable } from "./resolve-executable.js";

export type { CommandRunnerErrorCode } from "./errors.js";
export { CommandRunnerError, RunTimeoutError } from "./errors.js";
export { checkPolicy } from "./policy.js";
export type { PolicyResult } from "./policy.js";
export { resolveExecutable } from "./resolve-executable.js";
export type { SpawnTarget } from "./resolve-executable.js";

// ─── Low-level runner ─────────────────────────────────────────────────────────

export type RunOptions = {
    readonly cwd?: string;
    readonly env?: NodeJS.ProcessEnv;
    readonly timeout?: number;
};

export type RunResult = {
    readonly stdout: string;
    readonly stderr: string;
    readonly exitCode: number;
};

export const run = (
    command: string,
    args: readonly string[],
    options: RunOptions = {},
): Promise<Result<RunResult>> => {
    return new Promise((resolve) => {
        const chunks: Buffer[] = [];
        const errChunks: Buffer[] = [];

        const child = spawn(command, [...args], {
            cwd: options.cwd,
            env: options.env ?? process.env,
            shell: false,
        });

        child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
        child.stderr.on("data", (chunk: Buffer) => errChunks.push(chunk));

        const timeoutMs = options.timeout;
        const timer =
            timeoutMs !== undefined
                ? setTimeout(() => {
                      child.kill();
                      resolve(err(new RunTimeoutError(timeoutMs)));
                  }, timeoutMs)
                : null;

        child.on("close", (code) => {
            if (timer !== null) clearTimeout(timer);
            resolve(
                ok({
                    stdout: Buffer.concat(chunks).toString("utf-8"),
                    stderr: Buffer.concat(errChunks).toString("utf-8"),
                    exitCode: code ?? 1,
                }),
            );
        });

        child.on("error", (e) => {
            if (timer !== null) clearTimeout(timer);
            resolve(err(e));
        });
    });
};

// ─── Policy-aware runner ──────────────────────────────────────────────────────

export type RunCommandInput = {
    readonly command: string;
    readonly cwd: string;
    readonly timeoutMs?: number;
};

const validateCwd = async (cwd: string): Promise<CommandRunnerError | null> => {
    try {
        const s = await stat(cwd);
        if (!s.isDirectory()) {
            return new CommandRunnerError("CWD_NOT_FOUND", `Not a directory: ${cwd}`);
        }
        return null;
    } catch {
        return new CommandRunnerError("CWD_NOT_FOUND", `Directory not found: ${cwd}`);
    }
};

export const runCommand = async (
    input: RunCommandInput,
): Promise<Result<RunResult, CommandRunnerError>> => {
    // Policy check first — no I/O, fast rejection
    const policy = checkPolicy(input.command);
    if (policy.verdict === "blocked") {
        return err(
            new CommandRunnerError(
                "COMMAND_BLOCKED",
                `Command is blocked (matches "${policy.pattern}"): "${input.command}"`,
            ),
        );
    }
    if (policy.verdict === "not-allowed") {
        return err(
            new CommandRunnerError(
                "COMMAND_NOT_ALLOWED",
                `Command not in allowed list: "${input.command}"`,
            ),
        );
    }

    // Validate working directory
    const cwdError = await validateCwd(input.cwd);
    if (cwdError !== null) return err(cwdError);

    // Parse command string into executable + args
    const parts = input.command.trim().split(/\s+/);
    const executable = parts[0];
    if (executable === undefined || executable === "") {
        return err(new CommandRunnerError("COMMAND_NOT_ALLOWED", "Empty command"));
    }

    const runOptions: RunOptions =
        input.timeoutMs !== undefined
            ? { cwd: input.cwd, timeout: input.timeoutMs }
            : { cwd: input.cwd };

    const target = resolveExecutable(executable, parts.slice(1));
    const result = await run(target.executable, target.args, runOptions);
    if (!result.ok) {
        if (result.error instanceof RunTimeoutError) {
            return err(new CommandRunnerError("TIMEOUT", result.error.message, result.error));
        }
        return err(new CommandRunnerError("SPAWN_FAILED", result.error.message, result.error));
    }
    return result;
};
