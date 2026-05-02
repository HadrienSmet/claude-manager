import simpleGit, { type SimpleGit, type StatusResult, type DiffResult } from "simple-git";
import { stat } from "node:fs/promises";
import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";

// ─── Typed errors ─────────────────────────────────────────────────────────────

export const GIT_LAYER_ERROR_CODE = {
    PATH_NOT_FOUND: "PATH_NOT_FOUND",
    NOT_A_GIT_REPO: "NOT_A_GIT_REPO",
    GIT_OPERATION_FAILED: "GIT_OPERATION_FAILED",
}
export type GitLayerErrorCode = typeof GIT_LAYER_ERROR_CODE[keyof typeof GIT_LAYER_ERROR_CODE];

export class GitLayerError extends Error {
    readonly code: GitLayerErrorCode;

    constructor(code: GitLayerErrorCode, message: string, readonly cause?: unknown) {
        super(message);
        this.name = "GitLayerError";
        this.code = code;
    }
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export type GitStatus = {
    readonly branch: string;
    readonly ahead: number;
    readonly behind: number;
    readonly staged: readonly string[];
    readonly unstaged: readonly string[];
    readonly untracked: readonly string[];
    readonly clean: boolean;
};

export const CHANGE_TYPE = {
	added: "added",
	modified: "modified",
	deleted: "deleted",
	renamed: "renamed",
} as const;
type ChangeType = typeof CHANGE_TYPE[keyof typeof CHANGE_TYPE];
export type GitDiffFile = {
    readonly path: string;
    readonly additions: number;
    readonly deletions: number;
    readonly changeType: ChangeType;
};

export type GitDiff = {
    readonly files: readonly GitDiffFile[];
    readonly totalAdditions: number;
    readonly totalDeletions: number;
};

// ─── Validation ───────────────────────────────────────────────────────────────

const validateRepoPath = async (repoPath: string): Promise<GitLayerError | null> => {
    try {
        const s = await stat(repoPath);
        if (!s.isDirectory()) {
            return new GitLayerError(GIT_LAYER_ERROR_CODE.PATH_NOT_FOUND, `Not a directory: ${repoPath}`);
        }
    } catch {
        return new GitLayerError(GIT_LAYER_ERROR_CODE.PATH_NOT_FOUND, `Directory not found: ${repoPath}`);
    }

    // revparse works with both standard repos and git worktrees
    try {
        await simpleGit(repoPath).revparse(["--git-dir"]);
    } catch {
        return new GitLayerError(GIT_LAYER_ERROR_CODE.NOT_A_GIT_REPO, `Not a Git repository: ${repoPath}`);
    }

    return null;
};

// ─── Internal helper ──────────────────────────────────────────────────────────

const withValidation = async <T>(
    repoPath: string,
    fn: (git: SimpleGit) => Promise<T>
): Promise<Result<T>> => {
    const validationError = await validateRepoPath(repoPath);
    if (validationError !== null) {
        return err(validationError);
    }
    try {
        return ok(await fn(simpleGit(repoPath)));
    } catch (e) {
        return err(
            new GitLayerError(
                GIT_LAYER_ERROR_CODE.GIT_OPERATION_FAILED,
                e instanceof Error ? e.message : String(e),
                e
            )
        );
    }
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const status = (repoPath: string): Promise<Result<GitStatus>> =>
    withValidation(repoPath, async (git) => {
        const s: StatusResult = await git.status();
        return {
            branch: s.current ?? "unknown",
            ahead: s.ahead,
            behind: s.behind,
            staged: s.staged,
            unstaged: s.modified,
            untracked: s.not_added,
            clean: s.isClean(),
        };
    });

export const getCurrentBranch = (repoPath: string): Promise<Result<string>> =>
    withValidation(repoPath, async (git) => {
        const s = await git.status();
        return s.current ?? "HEAD";
    });

/** Creates a branch from HEAD without switching to it (git branch <name>). */
export const createBranch = (repoPath: string, branchName: string): Promise<Result<void>> =>
    withValidation(repoPath, async (git) => {
        await git.branch([branchName]);
    });

export const checkout = (repoPath: string, branchName: string): Promise<Result<void>> =>
    withValidation(repoPath, async (git) => {
        await git.checkout(branchName);
    });

/** Creates a branch from HEAD and immediately switches to it (git checkout -b <name>). */
export const createAndCheckoutBranch = (repoPath: string, branchName: string): Promise<Result<void>> =>
    withValidation(repoPath, async (git) => {
        await git.checkoutLocalBranch(branchName);
    });

export const diff = (repoPath: string): Promise<Result<GitDiff>> =>
    withValidation(repoPath, async (git) => {
        const d: DiffResult = await git.diffSummary();
        return {
            files: d.files.map((f) => {
                const additions = "insertions" in f ? f.insertions : 0;
                const deletions = "deletions" in f ? f.deletions : 0;
                let changeType: GitDiffFile["changeType"] = CHANGE_TYPE.modified;
                if (additions > 0 && deletions === 0) changeType = CHANGE_TYPE.added;
                else if (additions === 0 && deletions > 0) changeType = CHANGE_TYPE.deleted;
                return { path: f.file, additions, deletions, changeType };
            }),
            totalAdditions: d.insertions,
            totalDeletions: d.deletions,
        };
    });

export const addAll = (repoPath: string): Promise<Result<void>> =>
    withValidation(repoPath, async (git) => {
        await git.add(".");
    });

export const commit = (repoPath: string, message: string): Promise<Result<string>> =>
    withValidation(repoPath, async (git) => {
        const result = await git.commit(message);
        return result.commit;
    });
