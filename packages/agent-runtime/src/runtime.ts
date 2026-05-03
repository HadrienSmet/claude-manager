import { readFile, writeFile } from "@claude-manager/file-system";
import type { Result } from "@claude-manager/shared";
import { ok, err } from "@claude-manager/shared";
import { AGENT_RUNTIME_ERROR_CODE, AgentRuntimeError } from "./errors.js";
import { parseAgentResponse } from "./response-parser.js";
import type { AgentRunInput, AgentRunResult } from "./types.js";

// ─── System prompt ────────────────────────────────────────────────────────────

const RESPONSE_SCHEMA = `{
  "summary": "What was changed",
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "full new file content"
    }
  ],
  "commandsToRun": [
    "pnpm test"
  ]
}`;

const buildSystemPrompt = (
    context: readonly { path: string; content: string }[],
): string => {
    const contextSection =
        context.length > 0
            ? "\n\n## Context files\n\n" +
              context.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n")
            : "";

    return (
        `You are a coding agent. Respond ONLY with a single valid JSON object matching this schema:\n\n` +
        `${RESPONSE_SCHEMA}\n\n` +
        `Rules:\n` +
        `- All file paths must be relative (no leading /)\n` +
        `- Include the FULL content of each modified file (not a diff)\n` +
        `- commandsToRun will be reviewed before execution — list what you recommend\n` +
        `- Do not include any text outside the JSON object` +
        contextSection
    );
};

// ─── runAgent ─────────────────────────────────────────────────────────────────

export const runAgent = async (
    input: AgentRunInput,
): Promise<Result<AgentRunResult, AgentRuntimeError>> => {
    // 1. Read context files
    const context: { path: string; content: string }[] = [];
    for (const relPath of input.contextFiles ?? []) {
        const readResult = await readFile(input.repoPath, relPath);
        if (!readResult.ok) {
            return err(
                new AgentRuntimeError(
                    AGENT_RUNTIME_ERROR_CODE.CONTEXT_READ_FAILED,
                    `Failed to read context file "${relPath}": ${readResult.error.message}`,
                    readResult.error,
                ),
            );
        }
        context.push({ path: relPath, content: readResult.value });
    }

    // 2. Build system prompt and call provider
    const systemPrompt = buildSystemPrompt(context);
    let rawResponse: string;
    try {
        rawResponse = await input.provider.run(systemPrompt, input.userPrompt);
    } catch (e) {
        return err(
            new AgentRuntimeError(
                AGENT_RUNTIME_ERROR_CODE.PROVIDER_FAILED,
                e instanceof Error ? e.message : String(e),
                e,
            ),
        );
    }

    // 3. Parse and validate JSON response
    const parsed = parseAgentResponse(rawResponse);
    if (!parsed.ok) {
        return err(
            new AgentRuntimeError(
                AGENT_RUNTIME_ERROR_CODE.RESPONSE_PARSE_FAILED,
                `Agent response is not valid: ${parsed.message}`,
            ),
        );
    }

    // 4. Write files — path traversal protection is enforced by file-system
    const filesWritten: string[] = [];
    for (const file of parsed.value.files) {
        const writeResult = await writeFile(input.repoPath, file.path, file.content);
        if (!writeResult.ok) {
            return err(
                new AgentRuntimeError(
                    AGENT_RUNTIME_ERROR_CODE.FILE_WRITE_FAILED,
                    `Failed to write "${file.path}": ${writeResult.error.message}`,
                    writeResult.error,
                ),
            );
        }
        filesWritten.push(file.path);
    }

    return ok({
        summary: parsed.value.summary,
        filesWritten,
        commandsToRun: parsed.value.commandsToRun,
        rawResponse,
    });
};
