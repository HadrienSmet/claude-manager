export const AGENT_TASK_STATUS = {
	draft: "draft",
	running: "running",
	waiting_approval: "waiting_approval",
	completed: "completed",
	failed: "failed",
	cancelled: "cancelled",
} as const;
export type AgentTaskStatus = typeof AGENT_TASK_STATUS[keyof typeof AGENT_TASK_STATUS];

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
