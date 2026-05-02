import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import { createAndCheckoutBranch, getCurrentBranch, status } from "./index.js";

const makeRepo = async (temps: string[]): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "git-layer-test-"));
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

describe("git-layer", () => {
    const temps: string[] = [];

    afterEach(async () => {
        for (const dir of temps.splice(0)) {
            await rm(dir, { recursive: true, force: true });
        }
    });

    it("createAndCheckoutBranch creates the branch and switches to it", async () => {
        const repoPath = await makeRepo(temps);

        const result = await createAndCheckoutBranch(repoPath, "agent/test/feature");
        expect(result.ok).toBe(true);

        const branchResult = await getCurrentBranch(repoPath);
        expect(branchResult.ok).toBe(true);
        if (branchResult.ok) {
            expect(branchResult.value).toBe("agent/test/feature");
        }
    });

    it("status reflects a clean repo after initial commit", async () => {
        const repoPath = await makeRepo(temps);

        const result = await status(repoPath);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.clean).toBe(true);
            expect(result.value.staged).toHaveLength(0);
            expect(result.value.untracked).toHaveLength(0);
        }
    });

    it("returns PATH_NOT_FOUND for a missing directory", async () => {
        const result = await getCurrentBranch("/nonexistent/path/xyz");
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.name).toBe("GitLayerError");
            // @ts-expect-error — accessing .code on the typed error
            expect(result.error.code).toBe("PATH_NOT_FOUND");
        }
    });
});
