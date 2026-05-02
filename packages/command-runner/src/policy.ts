export type PolicyResult =
    | { readonly verdict: "allowed" }
    | { readonly verdict: "blocked"; readonly pattern: string }
    | { readonly verdict: "not-allowed" };

/** Commands that are never allowed, regardless of context. */
const BLOCKED_PATTERNS: readonly string[] = [
    "sudo",
    "rm -rf",
    "git push --force",
    "ssh",
    "scp",
    "curl",
    "wget",
    "chmod",
    "chown",
];

/** Commands allowed for automated agents without human confirmation. */
const ALLOWED_PREFIXES: readonly string[] = [
    "git status",
    "git diff",
    "npm test",
    "npm run test",
    "npm run build",
    "pnpm test",
    "pnpm build",
    "pnpm lint",
];

/**
 * Returns true when `normalized` equals `pattern` or starts with `pattern`
 * followed by a space/tab (word boundary).
 */
const matchesAtWordBoundary = (normalized: string, pattern: string): boolean =>
    normalized === pattern ||
    normalized.startsWith(`${pattern} `) ||
    normalized.startsWith(`${pattern}\t`);

export const checkPolicy = (command: string): PolicyResult => {
    const normalized = command.trim().toLowerCase();

    for (const pattern of BLOCKED_PATTERNS) {
        if (matchesAtWordBoundary(normalized, pattern)) {
            return { verdict: "blocked", pattern };
        }
    }

    for (const prefix of ALLOWED_PREFIXES) {
        if (matchesAtWordBoundary(normalized, prefix)) {
            return { verdict: "allowed" };
        }
    }

    return { verdict: "not-allowed" };
};
