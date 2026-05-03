import { apiFetch } from "./client";

export type PublicSettings = {
    readonly agentProvider: "fake" | "anthropic";
    readonly anthropicModel: string | null;
};

export const getPublicSettings = (): Promise<PublicSettings> =>
    apiFetch<PublicSettings>("/settings/public");
