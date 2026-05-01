export type CommandResult = {
    readonly command: string;
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
};
