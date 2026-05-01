import simpleGit, { type SimpleGit, type StatusResult } from "simple-git";
import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";

export type GitStatus = {
    readonly branch: string;
    readonly ahead: number;
    readonly behind: number;
    readonly staged: readonly string[];
    readonly unstaged: readonly string[];
    readonly untracked: readonly string[];
};

export const createGitClient = (repoPath: string): SimpleGit => simpleGit(repoPath);

export const getStatus = async (repoPath: string): Promise<Result<GitStatus>> => {
    try {
        const git = createGitClient(repoPath);
        const status: StatusResult = await git.status();
        return ok({
            branch: status.current ?? "unknown",
            ahead: status.ahead,
            behind: status.behind,
            staged: status.staged,
            unstaged: status.modified,
            untracked: status.not_added,
        });
    } catch (e) {
        return err(e instanceof Error ? e : new Error(String(e)));
    }
};
