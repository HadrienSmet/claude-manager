/** Executables that ship as .cmd wrappers on Windows and cannot be run by spawn with shell:false. */
const WIN_CMD_WRAPPERS = new Set(["npm", "pnpm", "npx", "yarn"]);

export type SpawnTarget = {
    readonly executable: string;
    readonly args: readonly string[];
};

/**
 * On Windows, package-manager wrappers (npm, pnpm, …) are .cmd batch files
 * that require a shell to execute. This function maps them to
 * `cmd.exe /c <name> <args>` so spawn can run them with shell:false.
 * Args are passed as an array, so there is no shell-injection surface.
 *
 * Accepts an explicit `platform` parameter to keep the function pure and
 * testable on any OS without spawning real processes.
 */
export const resolveExecutable = (
    executable: string,
    args: readonly string[],
    platform: string = process.platform,
): SpawnTarget => {
    if (platform === "win32" && WIN_CMD_WRAPPERS.has(executable.toLowerCase())) {
        return { executable: "cmd.exe", args: ["/c", executable, ...args] };
    }
    return { executable, args };
};
