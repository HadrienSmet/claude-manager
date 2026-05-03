import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

import { AgentProvider ,runAgent, AgentRuntimeError } from "@claude-manager/agent-runtime";
import { TASK_STATUS } from "@claude-manager/core";
import {
    createAndCheckoutBranch,
    checkout,
    diff,
    addAll,
    commit,
    GitLayerError,
} from "@claude-manager/git-layer";

import type { RepoStore } from "../repos/store.js";

import type { AgentTask, TaskStore } from "./store.js";

type PostTaskBody = { repoId: string; prompt: string };
type TaskParams = { id: string };

const now = () => new Date().toISOString();

const gitErrStatus = (e: GitLayerError): number =>
    e.code === "PATH_NOT_FOUND" ? 404 : 422;

export const registerTasksRoutes = async (
    app: FastifyInstance,
    repoStore: RepoStore,
    taskStore: TaskStore,
    provider: AgentProvider,
): Promise<void> => {
    // POST /tasks — create task and checkout dedicated branch
    app.post<{ Body: PostTaskBody }>(
        "/tasks",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["repoId", "prompt"],
                    properties: {
                        repoId: { type: "string", minLength: 1 },
                        prompt: { type: "string", minLength: 1 },
                    },
                },
            },
        },
        async (req, reply) => {
            const { repoId, prompt } = req.body;

            const repo = await repoStore.findById(repoId);
            if (repo === undefined) {
                return reply.status(404).send({ error: "Repository not found" });
            }

            const id = randomUUID();
            const slug = prompt
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .slice(0, 30)
                .replace(/-+$/, "") || "task";
            const branchName = `agent/task-${id.slice(0, 8)}/${slug}`;

            const branchResult = await createAndCheckoutBranch(repo.path, branchName);
            if (!branchResult.ok) {
                const e = branchResult.error;
                if (e instanceof GitLayerError) {
                    return reply.status(gitErrStatus(e)).send({ error: e.message, code: e.code });
                }
                return reply.status(422).send({ error: "Failed to create branch" });
            }

            const task: AgentTask = {
                id,
                repoId: repo.id,
                repoPath: repo.path,
                branchName,
                prompt,
                status: TASK_STATUS.pending,
                createdAt: now(),
                updatedAt: now(),
            };

            await taskStore.add(task);
            return reply.status(201).send(task);
        },
    );

    // GET /tasks
    app.get("/tasks", async () => taskStore.list());

    // GET /tasks/:id
    app.get<{ Params: TaskParams }>("/tasks/:id", async (req, reply) => {
        const task = await taskStore.findById(req.params.id);
        if (task === undefined) {
            return reply.status(404).send({ error: "Task not found" });
        }
        return task;
    });

    // POST /tasks/:id/run — checkout branch, run agent, record diff, await approval
    app.post<{ Params: TaskParams }>("/tasks/:id/run", async (req, reply) => {
        const task = await taskStore.findById(req.params.id);
        if (task === undefined) {
            return reply.status(404).send({ error: "Task not found" });
        }

        if (task.status === TASK_STATUS.completed) {
            return reply.status(409).send({ error: "Task is already completed" });
        }

        const checkoutResult = await checkout(task.repoPath, task.branchName);
        if (!checkoutResult.ok) {
            const e = checkoutResult.error;
            if (e instanceof GitLayerError) {
                return reply.status(422).send({ error: e.message, code: e.code });
            }
            return reply.status(422).send({ error: "Failed to checkout branch" });
        }

        const runResult = await runAgent({
            repoPath: task.repoPath,
            userPrompt: task.prompt,
            provider,
        });

        if (!runResult.ok) {
            const e = runResult.error;
            return reply.status(422).send({
                error: e.message,
                code: e instanceof AgentRuntimeError ? e.code : undefined,
            });
        }

        const diffResult = await diff(task.repoPath);

        const updated = await taskStore.update(task.id, {
            status: TASK_STATUS.waiting_approval,
            summary: runResult.value.summary,
            filesWritten: [...runResult.value.filesWritten],
            commandsToRun: [...runResult.value.commandsToRun],
            updatedAt: now(),
            ...(diffResult.ok ? { diff: diffResult.value } : {}),
        });

        return reply.send(updated ?? task);
    });

    // POST /tasks/:id/commit — git add + commit, mark completed
    app.post<{ Params: TaskParams }>("/tasks/:id/commit", async (req, reply) => {
        const task = await taskStore.findById(req.params.id);
        if (task === undefined) {
            return reply.status(404).send({ error: "Task not found" });
        }

        if (task.status !== TASK_STATUS.waiting_approval) {
            return reply.status(409).send({
                error: `Task cannot be committed (status: ${task.status})`,
            });
        }

        const checkoutResult = await checkout(task.repoPath, task.branchName);
        if (!checkoutResult.ok) {
            return reply.status(422).send({ error: checkoutResult.error.message });
        }

        const addResult = await addAll(task.repoPath);
        if (!addResult.ok) {
            return reply.status(422).send({ error: addResult.error.message });
        }

        const message = `feat(task): ${task.summary ?? task.prompt}\n\nTask-ID: ${task.id}`;
        const commitResult = await commit(task.repoPath, message);
        if (!commitResult.ok) {
            return reply.status(422).send({ error: commitResult.error.message });
        }

        const updated = await taskStore.update(task.id, {
            status: TASK_STATUS.completed,
            commitHash: commitResult.value,
            updatedAt: now(),
        });

        return reply.send(updated ?? task);
    });

    // POST /tasks/:id/reject — mark rejected, no destructive git ops
    app.post<{ Params: TaskParams }>("/tasks/:id/reject", async (req, reply) => {
        const task = await taskStore.findById(req.params.id);
        if (task === undefined) {
            return reply.status(404).send({ error: "Task not found" });
        }

        if (task.status !== TASK_STATUS.waiting_approval) {
            return reply.status(409).send({
                error: `Task cannot be rejected (status: ${task.status})`,
            });
        }

        const updated = await taskStore.update(task.id, {
            status: TASK_STATUS.rejected,
            updatedAt: now(),
        });

        return reply.send(updated ?? task);
    });
};
