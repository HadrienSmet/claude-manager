export type AgentTaskStatus =
    | "draft"
    | "running"
    | "waiting_approval"
    | "completed"
    | "failed"
    | "cancelled";

export type AgentTask = {
    readonly id: string;
    readonly repoId: string;
    readonly title: string;
    readonly prompt: string;
    readonly branchName: string;
    readonly status: AgentTaskStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
};
