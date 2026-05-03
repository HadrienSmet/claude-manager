import { TaskStatus, ChangeType } from "@claude-manager/core";

export type Repo = {
    readonly id: string;
    readonly name: string;
    readonly path: string;
    readonly currentBranch: string;
    readonly createdAt: string;
};

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

export type AgentTask = {
    readonly id: string;
    readonly repoId: string;
    readonly repoPath: string;
    readonly branchName: string;
    readonly prompt: string;
    readonly status: TaskStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly summary?: string;
    readonly filesWritten?: readonly string[];
    readonly commandsToRun?: readonly string[];
    readonly diff?: GitDiff;
    readonly rawDiff?: string;
    readonly commitHash?: string;
};
