import { spawn } from "node:child_process";
import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";

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

        const timer = options.timeout
            ? setTimeout(() => {
                  child.kill();
                  resolve(err(new Error(`Command timed out after ${options.timeout}ms`)));
              }, options.timeout)
            : null;

        child.on("close", (code) => {
            if (timer) clearTimeout(timer);
            resolve(
                ok({
                    stdout: Buffer.concat(chunks).toString("utf-8"),
                    stderr: Buffer.concat(errChunks).toString("utf-8"),
                    exitCode: code ?? 1,
                }),
            );
        });

        child.on("error", (e) => {
            if (timer) clearTimeout(timer);
            resolve(err(e));
        });
    });
};
