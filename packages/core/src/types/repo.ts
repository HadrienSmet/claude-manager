export type Repo = {
    readonly id: string;
    readonly name: string;
    readonly path: string;
    readonly currentBranch?: string;
};
