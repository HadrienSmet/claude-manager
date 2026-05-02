import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Repo } from "@claude-manager/core";

type StorageShape = { repos: Repo[] };

export type RepoStore = {
    list: () => Promise<readonly Repo[]>;
    findById: (id: string) => Promise<Repo | undefined>;
    findByPath: (path: string) => Promise<Repo | undefined>;
    add: (repo: Repo) => Promise<void>;
};

export const createRepoStore = (dataFile: string): RepoStore => {
    const load = async (): Promise<StorageShape> => {
        try {
            const raw = await readFile(dataFile, "utf-8");
            return JSON.parse(raw) as StorageShape;
        } catch {
            return { repos: [] };
        }
    };

    const save = async (data: StorageShape): Promise<void> => {
        await mkdir(dirname(dataFile), { recursive: true });
        await writeFile(dataFile, JSON.stringify(data, null, 2), "utf-8");
    };

    return {
        list: async () => {
            const data = await load();
            return data.repos;
        },

        findById: async (id) => {
            const data = await load();
            return data.repos.find((r) => r.id === id);
        },

        findByPath: async (path) => {
            const data = await load();
            return data.repos.find((r) => r.path === path);
        },

        add: async (repo) => {
            const data = await load();
            data.repos.push(repo);
            await save(data);
        },
    };
};
