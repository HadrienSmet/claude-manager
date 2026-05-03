import type { JSX } from "react";
import { useTranslation } from "react-i18next";

import type { ChangeType } from "@claude-manager/core";

import type { GitDiff } from "../../api";

const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
    added: "A",
    modified: "M",
    deleted: "D",
    renamed: "R",
};

export const DiffSummary = ({ diff }: { readonly diff: GitDiff }): JSX.Element => {
    const { t } = useTranslation();

    if (diff.files.length === 0) {
        return (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t("agentTask.task.noFiles")}
            </p>
        );
    }

    return (
        <div
            className="rounded-md border p-3 font-mono text-xs space-y-1"
            style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}
        >
            {diff.files.map((file) => (
                <div key={file.path} className="flex items-center gap-2">
                    <span className="w-3 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {CHANGE_TYPE_LABEL[file.changeType] ?? "?"}
                    </span>
                    <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                        {file.path}
                    </span>
                    <span className="text-green-500">+{file.additions}</span>
                    <span className="text-red-500">−{file.deletions}</span>
                </div>
            ))}
            <div
                className="flex gap-4 border-t pt-1.5 mt-0.5"
                style={{ borderColor: "var(--border)" }}
            >
                <span className="text-green-500">+{diff.totalAdditions}</span>
                <span className="text-red-500">−{diff.totalDeletions}</span>
            </div>
        </div>
    );
};
