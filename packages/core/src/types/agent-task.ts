export const TASK_STATUS = {
	pending: "pending",
	running: "running",
	waiting_approval: "waiting_approval",
	completed: "completed",
	rejected: "rejected",
} as const;
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
