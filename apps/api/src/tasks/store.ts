import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { GitDiff } from "@claude-manager/git-layer";
import { TaskStatus } from "@claude-manager/core";

export type AgentTask = {
    id: string;
    repoId: string;
    repoPath: string;
    branchName: string;
    prompt: string;
    status: TaskStatus;
    createdAt: string;
    updatedAt: string;
    summary?: string;
    filesWritten?: string[];
    commandsToRun?: string[];
    diff?: GitDiff;
    commitHash?: string;
};

type StorageShape = { tasks: AgentTask[] };

export type TaskStore = {
    list: () => Promise<readonly AgentTask[]>;
    findById: (id: string) => Promise<AgentTask | undefined>;
    add: (task: AgentTask) => Promise<void>;
    update: (id: string, patch: Partial<AgentTask>) => Promise<AgentTask | undefined>;
};

export const createTaskStore = (dataFile: string): TaskStore => {
    const load = async (): Promise<StorageShape> => {
        try {
            const raw = await readFile(dataFile, "utf-8");
            return JSON.parse(raw) as StorageShape;
        } catch {
            return { tasks: [] };
        }
    };

    const save = async (data: StorageShape): Promise<void> => {
        await mkdir(dirname(dataFile), { recursive: true });
        await writeFile(dataFile, JSON.stringify(data, null, 2), "utf-8");
    };

    return {
        list: async () => {
            const { tasks } = await load();
            return tasks;
        },

        findById: async (id) => {
            const { tasks } = await load();
            return tasks.find((t) => t.id === id);
        },

        add: async (task) => {
            const data = await load();
            data.tasks.push(task);
            await save(data);
        },

        update: async (id, patch) => {
            const data = await load();
            const idx = data.tasks.findIndex((t) => t.id === id);
            if (idx === -1) return undefined;
            const existing = data.tasks[idx];
            if (existing === undefined) return undefined;
            const updated = { ...existing, ...patch } as AgentTask;
            data.tasks[idx] = updated;
            await save(data);
            return updated;
        },
    };
};
