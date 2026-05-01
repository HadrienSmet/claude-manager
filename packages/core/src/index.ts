export type { Project, AgentSession, Result } from "@claude-manager/shared";
export { ok, err } from "@claude-manager/shared";

export * from "./types";

export const LOG_LEVEL = {
	debug: "debug",
	info: "info",
	warn: "warn",
	error: "error",
} as const;
type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];
export type AppConfig = {
    readonly dataDir: string;
    readonly logLevel: LogLevel;
};

export const defaultConfig: AppConfig = {
    dataDir: "./data",
    logLevel: LOG_LEVEL.info,
};
