import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    writeFile as fsWriteFile,
    mkdir as fsMkdir,
    rm,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import {
    listFiles,
    readFile,
    writeFile,
    fileExists,
    FileSystemError,
    MAX_FILE_SIZE_BYTES,
} from "./index.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let repoDir = "";

beforeEach(async () => {
    repoDir = await mkdtemp(join(tmpdir(), "fs-test-"));
});

afterEach(async () => {
    await rm(repoDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
});

const touch = async (rel: string, content = "content") => {
    const full = join(repoDir, rel);
    await fsMkdir(join(full, ".."), { recursive: true });
    await fsWriteFile(full, content, "utf-8");
};

const mkdir = async (rel: string) => {
    await fsMkdir(join(repoDir, rel), { recursive: true });
};

// ─── listFiles ────────────────────────────────────────────────────────────────

describe("listFiles", () => {
    it("returns files relative to repoPath with forward slashes", async () => {
        await touch("src/index.ts");
        await touch("src/utils.ts");
        await touch("README.md");

        const result = await listFiles(repoDir);

        expect(result.ok).toBe(true);
        if (result.ok) {
            const files = [...result.value].sort();
            expect(files).toContain("README.md");
            expect(files).toContain("src/index.ts");
            expect(files).toContain("src/utils.ts");
            // forward slashes on all platforms
            expect(files.every((f) => !f.includes("\\"))).toBe(true);
        }
    });

    it("ignores .git, node_modules, dist, build, coverage", async () => {
        await touch("README.md");
        await touch(".git/config");
        await touch("node_modules/pkg/index.js");
        await touch("dist/bundle.js");
        await touch("build/output.js");
        await touch("coverage/lcov.info");

        const result = await listFiles(repoDir);

        expect(result.ok).toBe(true);
        if (result.ok) {
            const files = result.value;
            expect(files).toEqual(["README.md"]);
            expect(files.some((f) => f.includes(".git"))).toBe(false);
            expect(files.some((f) => f.includes("node_modules"))).toBe(false);
            expect(files.some((f) => f.includes("dist"))).toBe(false);
            expect(files.some((f) => f.includes("build"))).toBe(false);
            expect(files.some((f) => f.includes("coverage"))).toBe(false);
        }
    });

    it("returns REPO_NOT_FOUND for a missing directory", async () => {
        const result = await listFiles("/nonexistent/path/xyz");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(FileSystemError);
            expect(result.error.code).toBe("REPO_NOT_FOUND");
        }
    });

    it("returns an empty array for an empty repo", async () => {
        const result = await listFiles(repoDir);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toEqual([]);
        }
    });
});

// ─── readFile ─────────────────────────────────────────────────────────────────

describe("readFile", () => {
    it("reads an existing file", async () => {
        await touch("hello.txt", "hello world");

        const result = await readFile(repoDir, "hello.txt");

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toBe("hello world");
        }
    });

    it("reads a file in a subdirectory", async () => {
        await touch("src/deep/file.ts", "export {}");

        const result = await readFile(repoDir, "src/deep/file.ts");

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toBe("export {}");
        }
    });

    it("returns FILE_NOT_FOUND for a missing file", async () => {
        const result = await readFile(repoDir, "missing.txt");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("FILE_NOT_FOUND");
        }
    });

    it("returns IS_DIRECTORY when relativePath points to a directory", async () => {
        await mkdir("src");

        const result = await readFile(repoDir, "src");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("IS_DIRECTORY");
        }
    });

    it("returns FILE_TOO_LARGE when file exceeds MAX_FILE_SIZE_BYTES", async () => {
        const oversized = "x".repeat(MAX_FILE_SIZE_BYTES + 1);
        await touch("big.txt", oversized);

        const result = await readFile(repoDir, "big.txt");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("FILE_TOO_LARGE");
        }
    });

    it("returns ABSOLUTE_PATH for an absolute relativePath", async () => {
        const result = await readFile(repoDir, "/etc/passwd");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("ABSOLUTE_PATH");
        }
    });

    it("returns PATH_TRAVERSAL for a traversal attempt", async () => {
        const result = await readFile(repoDir, "../outside.txt");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("PATH_TRAVERSAL");
        }
    });

    it("returns PATH_TRAVERSAL for a deeply nested traversal", async () => {
        const result = await readFile(repoDir, "src/../../outside.txt");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("PATH_TRAVERSAL");
        }
    });
});

// ─── writeFile ────────────────────────────────────────────────────────────────

describe("writeFile", () => {
    it("creates a new file with the given content", async () => {
        const result = await writeFile(repoDir, "output.txt", "written");

        expect(result.ok).toBe(true);
        const readBack = await readFile(repoDir, "output.txt");
        expect(readBack.ok).toBe(true);
        if (readBack.ok) expect(readBack.value).toBe("written");
    });

    it("creates parent directories automatically", async () => {
        const result = await writeFile(repoDir, "a/b/c/file.txt", "deep");

        expect(result.ok).toBe(true);
        const readBack = await readFile(repoDir, "a/b/c/file.txt");
        expect(readBack.ok).toBe(true);
    });

    it("overwrites an existing file", async () => {
        await touch("file.txt", "original");

        await writeFile(repoDir, "file.txt", "updated");
        const result = await readFile(repoDir, "file.txt");

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toBe("updated");
    });

    it("returns ABSOLUTE_PATH for an absolute relativePath", async () => {
        const result = await writeFile(repoDir, "/tmp/evil.txt", "x");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("ABSOLUTE_PATH");
        }
    });

    it("returns PATH_TRAVERSAL for a traversal attempt", async () => {
        const result = await writeFile(repoDir, "../evil.txt", "x");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("PATH_TRAVERSAL");
        }
    });
});

// ─── fileExists ───────────────────────────────────────────────────────────────

describe("fileExists", () => {
    it("returns true for an existing file", async () => {
        await touch("present.txt");

        const result = await fileExists(repoDir, "present.txt");

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toBe(true);
    });

    it("returns false for a non-existent file", async () => {
        const result = await fileExists(repoDir, "absent.txt");

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value).toBe(false);
    });

    it("returns PATH_TRAVERSAL for a traversal attempt", async () => {
        const result = await fileExists(repoDir, "../../etc/passwd");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("PATH_TRAVERSAL");
        }
    });

    it("returns ABSOLUTE_PATH for an absolute relativePath", async () => {
        const result = await fileExists(repoDir, "/etc/passwd");

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.code).toBe("ABSOLUTE_PATH");
        }
    });
});
