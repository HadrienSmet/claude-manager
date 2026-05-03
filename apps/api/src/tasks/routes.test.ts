import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import simpleGit from "simple-git";

import { FakeAgentProvider } from "@claude-manager/agent-runtime";
import { TASK_STATUS } from "@claude-manager/core";

import { buildServer } from "../server.js";

import { AgentTask } from "./store.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeGitRepo = async (temps: string[]): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "api-task-test-"));
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

const makeDataDir = async (temps: string[]): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "api-data-test-"));
    temps.push(dir);
    return dir;
};

type SetupResult = {
    app: Awaited<ReturnType<typeof buildServer>>;
    repoPath: string;
    repoId: string;
};

const setup = async (
    temps: string[],
    provider?: FakeAgentProvider,
): Promise<SetupResult> => {
    const repoPath = await makeGitRepo(temps);
    const dataDir = await makeDataDir(temps);
    const app = await buildServer(dataDir, provider);
    const res = await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });
    const { id: repoId } = res.json<{ id: string }>();
    return { app, repoPath, repoId };
};

// ─── POST /tasks ──────────────────────────────────────────────────────────────

describe("POST /tasks", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
    });

    it("creates a task with status pending and returns 201", async () => {
        const { app, repoId } = await setup(temps);

        const res = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Add a hello module" },
        });

        expect(res.statusCode).toBe(201);
        const task = res.json<AgentTask>();
        expect(task.status).toBe(TASK_STATUS.pending);
        expect(task.repoId).toBe(repoId);
        expect(task.prompt).toBe("Add a hello module");
        expect(task.branchName).toMatch(/^agent\/task-[a-f0-9]+\//);
        expect(typeof task.id).toBe("string");
    });

    it("returns 404 for an unknown repoId", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId: "nonexistent-id", prompt: "Do something" },
        });

        expect(res.statusCode).toBe(404);
    });

    it("returns 400 when required fields are missing", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId: "x" },
        });

        expect(res.statusCode).toBe(400);
    });
});

// ─── GET /tasks ───────────────────────────────────────────────────────────────

describe("GET /tasks", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
    });

    it("returns an empty array when no tasks exist", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({ method: "GET", url: "/tasks" });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual([]);
    });

    it("lists tasks after creation", async () => {
        const { app, repoId } = await setup(temps);
        await app.inject({ method: "POST", url: "/tasks", body: { repoId, prompt: "Task one" } });

        const res = await app.inject({ method: "GET", url: "/tasks" });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toHaveLength(1);
    });
});

// ─── GET /tasks/:id ───────────────────────────────────────────────────────────

describe("GET /tasks/:id", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
    });

    it("returns the task by id", async () => {
        const { app, repoId } = await setup(temps);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Fix bug" },
        });
        const { id } = createRes.json<AgentTask>();

        const res = await app.inject({ method: "GET", url: `/tasks/${id}` });

        expect(res.statusCode).toBe(200);
        expect(res.json<AgentTask>().id).toBe(id);
    });

    it("returns 404 for an unknown task id", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({ method: "GET", url: "/tasks/unknown-id" });

        expect(res.statusCode).toBe(404);
    });
});

// ─── POST /tasks/:id/run ──────────────────────────────────────────────────────

describe("POST /tasks/:id/run", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
    });

    it("runs the agent and sets status to waiting_approval", async () => {
        const provider = new FakeAgentProvider({
            summary: "Added feature",
            files: [],
            commandsToRun: ["pnpm test"],
        });
        const { app, repoId } = await setup(temps, provider);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Add feature" },
        });
        const { id } = createRes.json<AgentTask>();

        const res = await app.inject({ method: "POST", url: `/tasks/${id}/run` });

        expect(res.statusCode).toBe(200);
        const task = res.json<AgentTask>();
        expect(task.status).toBe(TASK_STATUS.waiting_approval);
        expect(task.summary).toBe("Added feature");
        expect(task.commandsToRun).toEqual(["pnpm test"]);
    });

    it("returns 404 for an unknown task", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({ method: "POST", url: "/tasks/unknown-id/run" });

        expect(res.statusCode).toBe(404);
    });

    it("returns 409 when the task is already completed", async () => {
        const provider = new FakeAgentProvider({
            summary: "Done",
            files: [{ path: "out.ts", content: "export const x = 1;" }],
            commandsToRun: [],
        });
        const { app, repoId } = await setup(temps, provider);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Do something" },
        });
        const { id } = createRes.json<AgentTask>();

        await app.inject({ method: "POST", url: `/tasks/${id}/run` });
        await app.inject({ method: "POST", url: `/tasks/${id}/commit` });

        const res = await app.inject({ method: "POST", url: `/tasks/${id}/run` });

        expect(res.statusCode).toBe(409);
    });
});

// ─── POST /tasks/:id/commit ───────────────────────────────────────────────────

describe("POST /tasks/:id/commit", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
    });

    it("commits the changes and sets status to completed", async () => {
        const provider = new FakeAgentProvider({
            summary: "Added output file",
            files: [{ path: "output.ts", content: "export const x = 1;" }],
            commandsToRun: [],
        });
        const { app, repoId } = await setup(temps, provider);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Add output" },
        });
        const { id } = createRes.json<AgentTask>();
        await app.inject({ method: "POST", url: `/tasks/${id}/run` });

        const res = await app.inject({ method: "POST", url: `/tasks/${id}/commit` });

        expect(res.statusCode).toBe(200);
        const task = res.json<AgentTask>();
        expect(task.status).toBe(TASK_STATUS.completed);
        expect(typeof task.commitHash).toBe("string");
        expect(task.commitHash).not.toBe("");
    });

    it("returns 409 when the task is not in waiting_approval state", async () => {
        const { app, repoId } = await setup(temps);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Fix" },
        });
        const { id } = createRes.json<AgentTask>();

        const res = await app.inject({ method: "POST", url: `/tasks/${id}/commit` });

        expect(res.statusCode).toBe(409);
    });

    it("returns 404 for an unknown task", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({ method: "POST", url: "/tasks/unknown-id/commit" });

        expect(res.statusCode).toBe(404);
    });
});

// ─── POST /tasks/:id/reject ───────────────────────────────────────────────────

describe("POST /tasks/:id/reject", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        }
    });

    it("rejects the task and sets status to rejected", async () => {
        const provider = new FakeAgentProvider({
            summary: "Some work",
            files: [],
            commandsToRun: [],
        });
        const { app, repoId } = await setup(temps, provider);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Try something" },
        });
        const { id } = createRes.json<AgentTask>();
        await app.inject({ method: "POST", url: `/tasks/${id}/run` });

        const res = await app.inject({ method: "POST", url: `/tasks/${id}/reject` });

        expect(res.statusCode).toBe(200);
        expect(res.json<AgentTask>().status).toBe(TASK_STATUS.rejected);
    });

    it("returns 409 when the task is not in waiting_approval state", async () => {
        const { app, repoId } = await setup(temps);
        const createRes = await app.inject({
            method: "POST",
            url: "/tasks",
            body: { repoId, prompt: "Fix" },
        });
        const { id } = createRes.json<AgentTask>();

        const res = await app.inject({ method: "POST", url: `/tasks/${id}/reject` });

        expect(res.statusCode).toBe(409);
    });

    it("returns 404 for an unknown task", async () => {
        const { app } = await setup(temps);

        const res = await app.inject({ method: "POST", url: "/tasks/unknown-id/reject" });

        expect(res.statusCode).toBe(404);
    });
});
