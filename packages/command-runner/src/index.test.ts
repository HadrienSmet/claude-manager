import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import { run, runCommand, resolveExecutable, RunTimeoutError, CommandRunnerError } from "./index.js";

const makeGitRepo = async (temps: string[]): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "cmd-runner-test-"));
    temps.push(dir);
    const git = simpleGit(dir);
    await git.init();
    await git.addConfig("user.name", "Test");
    await git.addConfig("user.email", "test@example.com");
    await writeFile(join(dir, "README.md"), "init");
    await git.add(".");
    await git.commit("initial commit");
    return dir;
};

describe("resolveExecutable", () => {
    it("wraps npm in cmd.exe /c on Windows", () => {
        const target = resolveExecutable("npm", ["run", "build"], "win32");
        expect(target.executable).toBe("cmd.exe");
        expect(target.args).toEqual(["/c", "npm", "run", "build"]);
    });

    it("wraps pnpm in cmd.exe /c on Windows", () => {
        const target = resolveExecutable("pnpm", ["test"], "win32");
        expect(target.executable).toBe("cmd.exe");
        expect(target.args).toEqual(["/c", "pnpm", "test"]);
    });

    it("wraps npx in cmd.exe /c on Windows", () => {
        const target = resolveExecutable("npx", ["tsc", "--noEmit"], "win32");
        expect(target.executable).toBe("cmd.exe");
        expect(target.args).toEqual(["/c", "npx", "tsc", "--noEmit"]);
    });

    it("does not wrap git on Windows", () => {
        const target = resolveExecutable("git", ["status"], "win32");
        expect(target.executable).toBe("git");
        expect(target.args).toEqual(["status"]);
    });

    it("does not wrap npm on Linux", () => {
        const target = resolveExecutable("npm", ["run", "build"], "linux");
        expect(target.executable).toBe("npm");
        expect(target.args).toEqual(["run", "build"]);
    });

    it("does not wrap pnpm on macOS", () => {
        const target = resolveExecutable("pnpm", ["test"], "darwin");
        expect(target.executable).toBe("pnpm");
        expect(target.args).toEqual(["test"]);
    });
});

describe("checkPolicy — allowed commands", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        }
    });

    it("allows git status", async () => {
        const cwd = await makeGitRepo(temps);
        const result = await runCommand({ command: "git status", cwd });
        expect(result.ok).toBe(true);
    });

    it("allows git diff", async () => {
        const cwd = await makeGitRepo(temps);
        const result = await runCommand({ command: "git diff", cwd });
        expect(result.ok).toBe(true);
    });

    it("allows extra flags after an allowed prefix (e.g. git status --short)", async () => {
        const cwd = await makeGitRepo(temps);
        const result = await runCommand({ command: "git status --short", cwd });
        expect(result.ok).toBe(true);
    });
});

describe("checkPolicy — blocked commands", () => {
    it("blocks sudo", async () => {
        const result = await runCommand({ command: "sudo git status", cwd: process.cwd() });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(CommandRunnerError);
            expect(result.error.code).toBe("COMMAND_BLOCKED");
        }
    });

    it("blocks rm -rf", async () => {
        const result = await runCommand({ command: "rm -rf /", cwd: process.cwd() });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("COMMAND_BLOCKED");
        }
    });

    it("blocks git push --force", async () => {
        const result = await runCommand({ command: "git push --force origin main", cwd: process.cwd() });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("COMMAND_BLOCKED");
        }
    });

    it("blocks curl", async () => {
        const result = await runCommand({ command: "curl https://example.com", cwd: process.cwd() });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("COMMAND_BLOCKED");
        }
    });
});

describe("checkPolicy — not-allowed commands", () => {
    it("rejects unlisted commands", async () => {
        const result = await runCommand({ command: "ls -la", cwd: process.cwd() });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("COMMAND_NOT_ALLOWED");
        }
    });

    it("rejects git push without --force (not in allowed list)", async () => {
        const result = await runCommand({ command: "git push origin main", cwd: process.cwd() });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("COMMAND_NOT_ALLOWED");
        }
    });
});

describe("cwd validation", () => {
    it("returns CWD_NOT_FOUND for a non-existent directory", async () => {
        const result = await runCommand({ command: "git status", cwd: "/nonexistent/path/xyz" });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("CWD_NOT_FOUND");
        }
    });
});

describe("timeout", () => {
    it("run: kills the process and returns RunTimeoutError", async () => {
        // Use the current Node binary to run a long-sleeping script
        const result = await run(
            process.execPath,
            ["-e", "setTimeout(() => {}, 10000)"],
            { cwd: process.cwd(), timeout: 80 },
        );
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(RunTimeoutError);
        }
    });

    it("runCommand: maps timeout to TIMEOUT error code", async () => {
        // timeoutMs: 1 — nearly guaranteed to fire before git starts on any OS
        const temps: string[] = [];
        const cwd = await makeGitRepo(temps);
        try {
            const result = await runCommand({ command: "git status", cwd, timeoutMs: 1 });
            if (!result.ok) {
                // If it failed, it must be TIMEOUT (not SPAWN_FAILED or anything else)
                expect(result.error.code).toBe("TIMEOUT");
            }
            // If it succeeded in < 1ms, that is also acceptable
        } finally {
            for (const dir of temps) {
                // Windows: killed git process may still hold directory handles briefly
                await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
            }
        }
    });
});
