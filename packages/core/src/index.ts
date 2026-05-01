export type { Project, AgentSession, Result } from "@claude-manager/shared";
export { ok, err } from "@claude-manager/shared";

export type AppConfig = {
    readonly dataDir: string;
    readonly logLevel: "debug" | "info" | "warn" | "error";
};

export const defaultConfig: AppConfig = {
    dataDir: "./data",
    logLevel: "info",
};
