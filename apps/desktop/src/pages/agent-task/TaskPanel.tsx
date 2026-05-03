import type { JSX } from "react";
import { useTranslation } from "react-i18next";

import type { AgentTask } from "../../api";
import { ErrorBanner } from "../../components";

import { DiffSummary } from "./DiffSummary";
import { DiffViewer } from "./DiffViewer";
import { StatusBadge } from "./StatusBadge";

const SectionLabel = ({ children }: { readonly children: string }): JSX.Element => (
    <p
        className="text-xs font-medium uppercase tracking-wide mb-1.5"
        style={{ color: "var(--text-muted)" }}
    >
        {children}
    </p>
);

type Props = {
    readonly task: AgentTask;
    readonly actionLoading: boolean;
    readonly actionError: string | null;
    readonly canRun: boolean;
    readonly canCommit: boolean;
    readonly canReject: boolean;
    readonly onRun: () => void;
    readonly onCommit: () => void;
    readonly onReject: () => void;
};

export const TaskPanel = ({
    task,
    actionLoading,
    actionError,
    canRun,
    canCommit,
    canReject,
    onRun,
    onCommit,
    onReject,
}: Props): JSX.Element => {
    const { t } = useTranslation();

    return (
        <div
            className="rounded-lg border p-5 space-y-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
            {/* Task header + actions */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                            #{task.id.slice(0, 8)}
                        </span>
                        <StatusBadge status={task.status} />
                    </div>
                    <p
                        className="text-xs font-mono truncate"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {task.branchName}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {canRun && (
                        <button
                            onClick={onRun}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-sm font-medium rounded-md bg-violet-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("agentTask.task.runButton")}
                        </button>
                    )}
                    {canCommit && (
                        <button
                            onClick={onCommit}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading
                                ? t("agentTask.task.committing")
                                : t("agentTask.task.commitButton")}
                        </button>
                    )}
                    {canReject && (
                        <button
                            onClick={onReject}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-500 text-red-500 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading
                                ? t("agentTask.task.rejecting")
                                : t("agentTask.task.rejectButton")}
                        </button>
                    )}
                </div>
            </div>

            {/* Running indicator */}
            {actionLoading && (
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("agentTask.task.running")}
                    </p>
                </div>
            )}

            {/* Prompt */}
            <div>
                <SectionLabel>{t("agentTask.form.promptLabel")}</SectionLabel>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {task.prompt}
                </p>
            </div>

            {/* Summary */}
            {task.summary !== undefined && (
                <div>
                    <SectionLabel>{t("agentTask.task.summary")}</SectionLabel>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {task.summary}
                    </p>
                </div>
            )}

            {/* Files written */}
            {task.filesWritten !== undefined && task.filesWritten.length > 0 && (
                <div>
                    <SectionLabel>{t("agentTask.task.filesWritten")}</SectionLabel>
                    <ul className="space-y-0.5">
                        {task.filesWritten.map((f) => (
                            <li
                                key={f}
                                className="text-xs font-mono"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Commands to run */}
            {task.commandsToRun !== undefined && task.commandsToRun.length > 0 && (
                <div>
                    <SectionLabel>{t("agentTask.task.commandsToRun")}</SectionLabel>
                    <ul className="space-y-1">
                        {task.commandsToRun.map((cmd) => (
                            <li
                                key={cmd}
                                className="text-xs font-mono px-2 py-1 rounded"
                                style={{
                                    backgroundColor: "var(--bg-subtle)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                $ {cmd}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Diff */}
            {(task.rawDiff !== undefined || task.diff !== undefined) && (
                <div>
                    <SectionLabel>{t("agentTask.task.diffTitle")}</SectionLabel>
                    {task.rawDiff !== undefined
                        ? <DiffViewer rawDiff={task.rawDiff} />
                        : <DiffSummary diff={task.diff!} />}
                </div>
            )}

            {/* Commit hash */}
            {task.commitHash !== undefined && task.commitHash !== "" && (
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("agentTask.task.commitHash")}:
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                        {task.commitHash.slice(0, 8)}
                    </span>
                </div>
            )}

            {actionError !== null && <ErrorBanner message={actionError} />}
        </div>
    );
};
