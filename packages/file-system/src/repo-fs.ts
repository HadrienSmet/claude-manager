import {
    readFile as fsReadFile,
    writeFile as fsWriteFile,
    mkdir as fsMkdir,
    readdir as fsReaddir,
    stat as fsStat,
} from "node:fs/promises";
import path from "node:path";

import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";

import { FILE_SYSTEM_ERROR_CODE, FileSystemError } from "./errors.js";

/** Maximum size of a file that readFile will load into memory. */
export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

/** Directory names ignored by listFiles at every depth level. */
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage"]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

const validateRepoPath = async (repoPath: string): Promise<FileSystemError | null> => {
    try {
        const s = await fsStat(repoPath);
        if (!s.isDirectory()) {
            return new FileSystemError(FILE_SYSTEM_ERROR_CODE.REPO_NOT_FOUND, `Not a directory: "${repoPath}"`);
        }
        return null;
    } catch {
        return new FileSystemError(FILE_SYSTEM_ERROR_CODE.REPO_NOT_FOUND, `Repository directory not found: "${repoPath}"`);
    }
};

/**
 * Validates relativePath and returns the resolved absolute path, or a
 * FileSystemError if the path is absolute or escapes repoPath.
 */
const validateRelativePath = (repoPath: string, relativePath: string): string | FileSystemError => {
    if (path.isAbsolute(relativePath)) {
        return new FileSystemError(
            FILE_SYSTEM_ERROR_CODE.ABSOLUTE_PATH,
            `Relative path must not be absolute: "${relativePath}"`,
        );
    }
    const base = path.resolve(repoPath);
    const resolved = path.resolve(base, relativePath);
    // Allow paths strictly inside base (or equal to base for fileExists on ".")
    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
        return new FileSystemError(
            FILE_SYSTEM_ERROR_CODE.PATH_TRAVERSAL,
            `Path traversal detected: "${relativePath}" escapes the repository root`,
        );
    }
    return resolved;
};

// ─── Recursive walk for listFiles ─────────────────────────────────────────────

const walk = async (dir: string, base: string, acc: string[]): Promise<void> => {
    const entries = await fsReaddir(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name)) {
                await walk(path.join(dir, entry.name), base, acc);
            }
        } else if (entry.isFile()) {
            // Normalize to forward slashes for cross-platform consistency
            const rel = path.relative(base, path.join(dir, entry.name));
            acc.push(rel.split(path.sep).join("/"));
        }
    }
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Lists all files in repoPath recursively.
 * Ignores: .git, node_modules, dist, build, coverage.
 * Returns paths relative to repoPath, separated by "/".
 */
export const listFiles = async (
    repoPath: string,
): Promise<Result<readonly string[], FileSystemError>> => {
    const repoError = await validateRepoPath(repoPath);
    if (repoError !== null) return err(repoError);

    try {
        const files: string[] = [];
        await walk(repoPath, repoPath, files);
        return ok(files);
    } catch (e) {
        return err(new FileSystemError(FILE_SYSTEM_ERROR_CODE.READ_FAILED, "Failed to list files", e));
    }
};

/**
 * Reads a file inside repoPath.
 * Rejects absolute paths, path traversal, directories, and files > MAX_FILE_SIZE_BYTES.
 */
export const readFile = async (
    repoPath: string,
    relativePath: string,
): Promise<Result<string, FileSystemError>> => {
    const resolved = validateRelativePath(repoPath, relativePath);
    if (resolved instanceof FileSystemError) return err(resolved);

    try {
        const s = await fsStat(resolved);
        if (s.isDirectory()) {
            return err(new FileSystemError(FILE_SYSTEM_ERROR_CODE.IS_DIRECTORY, `Path is a directory: "${relativePath}"`));
        }
        if (s.size > MAX_FILE_SIZE_BYTES) {
            return err(
                new FileSystemError(
                    FILE_SYSTEM_ERROR_CODE.FILE_TOO_LARGE,
                    `File exceeds ${MAX_FILE_SIZE_BYTES} bytes: "${relativePath}" (${s.size} bytes)`,
                ),
            );
        }
    } catch {
        return err(new FileSystemError(FILE_SYSTEM_ERROR_CODE.FILE_NOT_FOUND, `File not found: "${relativePath}"`));
    }

    try {
        const content = await fsReadFile(resolved, "utf-8");
        return ok(content);
    } catch (e) {
        return err(new FileSystemError(FILE_SYSTEM_ERROR_CODE.READ_FAILED, `Failed to read file: "${relativePath}"`, e));
    }
};

/**
 * Writes content to a file inside repoPath, creating parent directories as needed.
 * Rejects absolute paths and path traversal.
 */
export const writeFile = async (
    repoPath: string,
    relativePath: string,
    content: string,
): Promise<Result<void, FileSystemError>> => {
    const resolved = validateRelativePath(repoPath, relativePath);
    if (resolved instanceof FileSystemError) return err(resolved);

    try {
        await fsMkdir(path.dirname(resolved), { recursive: true });
        await fsWriteFile(resolved, content, "utf-8");
        return ok(undefined);
    } catch (e) {
        return err(
            new FileSystemError(FILE_SYSTEM_ERROR_CODE.WRITE_FAILED, `Failed to write file: "${relativePath}"`, e),
        );
    }
};

/**
 * Returns true if the file exists inside repoPath, false otherwise.
 * Rejects absolute paths and path traversal.
 */
export const fileExists = async (
    repoPath: string,
    relativePath: string,
): Promise<Result<boolean, FileSystemError>> => {
    const resolved = validateRelativePath(repoPath, relativePath);
    if (resolved instanceof FileSystemError) return err(resolved);

    try {
        await fsStat(resolved);
        return ok(true);
    } catch {
        return ok(false);
    }
};
