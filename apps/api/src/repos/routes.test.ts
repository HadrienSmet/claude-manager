import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import { buildServer } from "../server.js";

const makeGitRepo = async (temps: string[]): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "api-repo-test-"));
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

describe("POST /repos", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("registers a valid git repo and returns 201", async () => {
        const repoPath = await makeGitRepo(temps);
        const app = await buildServer(await makeDataDir(temps));

        const res = await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });

        expect(res.statusCode).toBe(201);
        const body = res.json<{ id: string; path: string; name: string }>();
        expect(body.path).toBe(repoPath);
        expect(typeof body.id).toBe("string");
        expect(body.name).toBeTruthy();
    });

    it("returns 409 when the same path is registered twice", async () => {
        const repoPath = await makeGitRepo(temps);
        const app = await buildServer(await makeDataDir(temps));

        await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });
        const res = await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });

        expect(res.statusCode).toBe(409);
    });

    it("returns 404 for a non-existent path", async () => {
        const app = await buildServer(await makeDataDir(temps));

        const res = await app.inject({
            method: "POST",
            url: "/repos",
            body: { path: "/nonexistent/path/xyz" },
        });

        expect(res.statusCode).toBe(404);
        expect(res.json<{ code: string }>().code).toBe("PATH_NOT_FOUND");
    });

    it("returns 400 when path is missing from body", async () => {
        const app = await buildServer(await makeDataDir(temps));

        const res = await app.inject({ method: "POST", url: "/repos", body: {} });

        expect(res.statusCode).toBe(400);
    });
});

describe("GET /repos", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("returns an empty array when no repos are registered", async () => {
        const app = await buildServer(await makeDataDir(temps));

        const res = await app.inject({ method: "GET", url: "/repos" });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual([]);
    });

    it("lists repos after registration", async () => {
        const repoPath = await makeGitRepo(temps);
        const app = await buildServer(await makeDataDir(temps));
        await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });

        const res = await app.inject({ method: "GET", url: "/repos" });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toHaveLength(1);
    });
});

describe("GET /repos/:id/status", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("returns git status for a registered repo", async () => {
        const repoPath = await makeGitRepo(temps);
        const app = await buildServer(await makeDataDir(temps));
        const addRes = await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });
        const { id } = addRes.json<{ id: string }>();

        const res = await app.inject({ method: "GET", url: `/repos/${id}/status` });

        expect(res.statusCode).toBe(200);
        expect(res.json<{ clean: boolean }>().clean).toBe(true);
    });

    it("returns 404 for unknown repo id", async () => {
        const app = await buildServer(await makeDataDir(temps));

        const res = await app.inject({ method: "GET", url: "/repos/unknown-id/status" });

        expect(res.statusCode).toBe(404);
    });
});

describe("GET /repos/:id/diff", () => {
    const temps: string[] = [];
    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("returns an empty diff for a clean repo", async () => {
        const repoPath = await makeGitRepo(temps);
        const app = await buildServer(await makeDataDir(temps));
        const addRes = await app.inject({ method: "POST", url: "/repos", body: { path: repoPath } });
        const { id } = addRes.json<{ id: string }>();

        const res = await app.inject({ method: "GET", url: `/repos/${id}/diff` });

        expect(res.statusCode).toBe(200);
        const body = res.json<{ files: unknown[]; totalAdditions: number; totalDeletions: number }>();
        expect(body.files).toHaveLength(0);
        expect(body.totalAdditions).toBe(0);
    });
});
