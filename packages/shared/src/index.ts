export type Result<T, E = Error> =
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type Project = {
    readonly id: string;
    readonly name: string;
    readonly path: string;
    readonly createdAt: string;
    readonly updatedAt: string;
};

export type AgentSession = {
    readonly id: string;
    readonly projectId: string;
    status: "idle" | "running" | "done" | "error";
    readonly createdAt: string;
};
