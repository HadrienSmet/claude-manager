export type GitStatus = {
    readonly branch: string;
    readonly ahead: number;
    readonly behind: number;
    readonly staged: readonly string[];
    readonly unstaged: readonly string[];
    readonly untracked: readonly string[];
    readonly clean: boolean;
};

export type GitDiffFile = {
    readonly path: string;
    readonly additions: number;
    readonly deletions: number;
    readonly changeType: "added" | "modified" | "deleted" | "renamed";
};

export type GitDiff = {
    readonly base: string;
    readonly head: string;
    readonly files: readonly GitDiffFile[];
    readonly totalAdditions: number;
    readonly totalDeletions: number;
};
