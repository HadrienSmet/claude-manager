import { apiFetch } from "./client";
import type { AgentTask } from "./types";

export const listTasks = (): Promise<AgentTask[]> => apiFetch<AgentTask[]>("/tasks");

export const createTask = (repoId: string, prompt: string): Promise<AgentTask> =>
    apiFetch<AgentTask>("/tasks", {
        method: "POST",
        body: JSON.stringify({ repoId, prompt }),
    });

export const runTask = (id: string): Promise<AgentTask> =>
    apiFetch<AgentTask>(`/tasks/${id}/run`, { method: "POST" });

export const commitTask = (id: string): Promise<AgentTask> =>
    apiFetch<AgentTask>(`/tasks/${id}/commit`, { method: "POST" });

export const rejectTask = (id: string): Promise<AgentTask> =>
    apiFetch<AgentTask>(`/tasks/${id}/reject`, { method: "POST" });
