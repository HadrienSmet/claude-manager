export * from "./errors.js";
export * from "./repo-fs.js";

import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";

export const readJson = async <T>(filePath: string): Promise<Result<T>> => {
    try {
        const raw = await readFile(filePath, "utf-8");
        return ok(JSON.parse(raw) as T);
    } catch (e) {
        return err(e instanceof Error ? e : new Error(String(e)));
    }
};

export const writeJson = async <T>(filePath: string, data: T): Promise<Result<void>> => {
    try {
        await mkdir(join(filePath, ".."), { recursive: true });
        await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
        return ok(undefined);
    } catch (e) {
        return err(e instanceof Error ? e : new Error(String(e)));
    }
};

export const listDir = async (dirPath: string): Promise<Result<string[]>> => {
    try {
        const entries = await readdir(dirPath);
        return ok(entries);
    } catch (e) {
        return err(e instanceof Error ? e : new Error(String(e)));
    }
};

export const exists = async (filePath: string): Promise<boolean> => {
    try {
        await stat(filePath);
        return true;
    } catch {
        return false;
    }
};
