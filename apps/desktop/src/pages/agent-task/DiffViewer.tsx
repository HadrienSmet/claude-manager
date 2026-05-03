import type { JSX } from "react";
import { useTranslation } from "react-i18next";

const LINE_KIND = {
	add: "add",
	header: "header",
	hunk: "hunk",
	neutral: "neutral",
	remove: "remove",
} as const;
type LineKind = typeof LINE_KIND[keyof typeof LINE_KIND];

const lineKind = (line: string): LineKind => {
    if (line.startsWith("+++ ") || line.startsWith("--- ") || line.startsWith("diff ") || line.startsWith("index ")) return LINE_KIND.header;
    if (line.startsWith("@@")) return LINE_KIND.hunk;
    if (line.startsWith("+")) return LINE_KIND.add;
    if (line.startsWith("-")) return LINE_KIND.remove;
    return LINE_KIND.neutral;
};

const LINE_STYLE: Record<LineKind, React.CSSProperties> = {
    add: { backgroundColor: "rgba(34,197,94,0.12)", color: "var(--text-primary)" },
    remove: { backgroundColor: "rgba(239,68,68,0.12)", color: "var(--text-primary)" },
    hunk: { backgroundColor: "rgba(99,102,241,0.10)", color: "var(--text-muted)" },
    header: { color: "var(--text-muted)" },
    neutral: { color: "var(--text-secondary)" },
};

export const DiffViewer = ({ rawDiff }: { readonly rawDiff: string }): JSX.Element => {
    const { t } = useTranslation();

    if (rawDiff.trim() === "") {
        return (
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {t("agentTask.task.noChanges")}
            </p>
        );
    }

    const lines = rawDiff.split("\n");

    return (
        <div
            className="rounded-md border overflow-auto font-mono text-xs"
            style={{
                backgroundColor: "var(--bg-subtle)",
                borderColor: "var(--border)",
                maxHeight: "28rem",
            }}
        >
            <div className="min-w-0">
                {lines.map((line, i) => {
                    const kind = lineKind(line);
                    return (
                        <div
                            key={i}
                            className="px-3 py-px whitespace-pre leading-5"
                            style={LINE_STYLE[kind]}
                        >
                            {line || " "}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
