export const FILE_SYSTEM_ERROR_CODE = {
    REPO_NOT_FOUND: "REPO_NOT_FOUND",
    ABSOLUTE_PATH: "ABSOLUTE_PATH",
    PATH_TRAVERSAL: "PATH_TRAVERSAL",
    FILE_NOT_FOUND: "FILE_NOT_FOUND",
    FILE_TOO_LARGE: "FILE_TOO_LARGE",
    IS_DIRECTORY: "IS_DIRECTORY",
    WRITE_FAILED: "WRITE_FAILED",
    READ_FAILED: "READ_FAILED",
} as const;
export type FileSystemErrorCode = typeof FILE_SYSTEM_ERROR_CODE[keyof typeof FILE_SYSTEM_ERROR_CODE];

export class FileSystemError extends Error {
    readonly code: FileSystemErrorCode;

    constructor(code: FileSystemErrorCode, message: string, readonly cause?: unknown) {
        super(message);
        this.name = "FileSystemError";
        this.code = code;
    }
}
