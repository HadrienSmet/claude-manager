import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import type { FastifyInstance } from "fastify";

import { status, diff, rawDiff, GitLayerError, GIT_LAYER_ERROR_CODE } from "@claude-manager/git-layer";
import type { Repo } from "@claude-manager/core";

import type { RepoStore } from "./store.js";

type PostRepoBody = { path: string };
type RepoParams = { id: string };

const gitErrorToStatus = (code: GitLayerError["code"]): number =>
    code === GIT_LAYER_ERROR_CODE.PATH_NOT_FOUND ? 404 : 422;

export const registerReposRoutes = async (
    app: FastifyInstance,
    store: RepoStore
): Promise<void> => {
    app.post<{ Body: PostRepoBody }>(
        "/repos",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["path"],
                    properties: { path: { type: "string", minLength: 1 } },
                },
            },
        },
        async (req, reply) => {
            const { path } = req.body;

            const existing = await store.findByPath(path);
            if (existing !== undefined) {
                return reply
                    .status(409)
                    .send({ error: "Repository already registered", repo: existing });
            }

            const gitStatus = await status(path);
            if (!gitStatus.ok) {
                const e = gitStatus.error;
                if (e instanceof GitLayerError) {
                    return reply
                        .status(gitErrorToStatus(e.code))
                        .send({ error: e.message, code: e.code });
                }
                return reply.status(422).send({ error: "Failed to read repository" });
            }

            const repo: Repo = {
                id: randomUUID(),
                name: basename(path),
                path,
                currentBranch: gitStatus.value.branch,
                createdAt: new Date().toISOString(),
            };

            await store.add(repo);
            return reply.status(201).send(repo);
        }
    );

    app.get("/repos", async () => store.list());

    app.get<{ Params: RepoParams }>("/repos/:id/status", async (req, reply) => {
        const repo = await store.findById(req.params.id);
        if (repo === undefined) {
            return reply.status(404).send({ error: "Repository not found" });
        }

        const result = await status(repo.path);
        if (!result.ok) {
            const e = result.error;
            if (e instanceof GitLayerError) {
                return reply
                    .status(gitErrorToStatus(e.code))
                    .send({ error: e.message, code: e.code });
            }
            return reply.status(422).send({ error: "Failed to read repository status" });
        }

        return result.value;
    });

    app.get<{ Params: RepoParams }>("/repos/:id/diff", async (req, reply) => {
        const repo = await store.findById(req.params.id);
        if (repo === undefined) {
            return reply.status(404).send({ error: "Repository not found" });
        }

        const [result, rawResult] = await Promise.all([
            diff(repo.path),
            rawDiff(repo.path),
        ]);

        if (!result.ok) {
            const e = result.error;
            if (e instanceof GitLayerError) {
                return reply
                    .status(gitErrorToStatus(e.code))
                    .send({ error: e.message, code: e.code });
            }
            return reply.status(422).send({ error: "Failed to read repository diff" });
        }

        return {
            ...result.value,
            ...(rawResult.ok ? { rawDiff: rawResult.value } : {}),
        };
    });
};
