import type { AgentSession, Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";

export type AgentTask = {
    readonly id: string;
    readonly sessionId: string;
    readonly command: string;
    readonly args: readonly string[];
    readonly cwd: string;
};

export type AgentRuntime = {
    readonly startSession: (projectId: string) => Promise<Result<AgentSession>>;
    readonly stopSession: (sessionId: string) => Promise<Result<void>>;
    readonly getSession: (sessionId: string) => AgentSession | undefined;
};

export const createAgentRuntime = (): AgentRuntime => {
    const sessions = new Map<string, AgentSession>();

    return {
        startSession: async (projectId: string): Promise<Result<AgentSession>> => {
            const session: AgentSession = {
                id: crypto.randomUUID(),
                projectId,
                status: "idle",
                createdAt: new Date().toISOString(),
            };
            sessions.set(session.id, session);
            return ok(session);
        },

        stopSession: async (sessionId: string): Promise<Result<void>> => {
            const session = sessions.get(sessionId);
            if (!session) return err(new Error(`Session ${sessionId} not found`));
            session.status = "done";
            return ok(undefined);
        },

        getSession: (sessionId: string): AgentSession | undefined => {
            return sessions.get(sessionId);
        },
    };
};
