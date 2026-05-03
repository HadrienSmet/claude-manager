import type { AgentResponseFile, AgentResponsePayload } from "./types.js";

export type ParseResult =
    | { readonly ok: true; readonly value: AgentResponsePayload }
    | { readonly ok: false; readonly message: string };

const tryParseJson = (str: string): unknown | null => {
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
};

/**
 * Parses and validates the raw string returned by an agent provider.
 * Tries direct JSON.parse first, then falls back to extracting the first
 * JSON object from the string (for models that add preamble/postamble text).
 */
export const parseAgentResponse = (raw: string): ParseResult => {
    const trimmed = raw.trim();

    let parsed: unknown = tryParseJson(trimmed);
    if (parsed === null) {
        const match = trimmed.match(/\{[\s\S]*\}/);
        const extracted = match !== null ? match[0] : undefined;
        if (extracted === undefined) {
            return { ok: false, message: "No JSON object found in response" };
        }
        parsed = tryParseJson(extracted);
        if (parsed === null) {
            return { ok: false, message: "Response contains invalid JSON" };
        }
    }

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, message: "Response must be a JSON object" };
    }

    const obj = parsed as Record<string, unknown>;

    // Validate summary
    const summary = obj["summary"];
    if (typeof summary !== "string") {
        return { ok: false, message: 'Missing or invalid "summary" field (must be a string)' };
    }

    // Validate and collect files
    if (!Array.isArray(obj["files"])) {
        return { ok: false, message: 'Missing or invalid "files" field (must be an array)' };
    }
    const files: AgentResponseFile[] = [];
    for (const entry of obj["files"] as unknown[]) {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
            return { ok: false, message: 'Each entry in "files" must be an object' };
        }
        const file = entry as Record<string, unknown>;
        const path = file["path"];
        const content = file["content"];
        if (typeof path !== "string" || typeof content !== "string") {
            return {
                ok: false,
                message: 'Each file must have "path" (string) and "content" (string)',
            };
        }
        files.push({ path, content });
    }

    // Validate and collect commandsToRun
    if (!Array.isArray(obj["commandsToRun"])) {
        return {
            ok: false,
            message: 'Missing or invalid "commandsToRun" field (must be an array)',
        };
    }
    const commandsToRun: string[] = [];
    for (const cmd of obj["commandsToRun"] as unknown[]) {
        if (typeof cmd !== "string") {
            return { ok: false, message: '"commandsToRun" must contain only strings' };
        }
        commandsToRun.push(cmd);
    }

    return { ok: true, value: { summary, files, commandsToRun } };
};
