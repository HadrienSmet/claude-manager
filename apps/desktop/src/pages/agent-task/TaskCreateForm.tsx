import type { JSX, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { PiArrowsClockwise } from "react-icons/pi";

import type { Repo } from "../../api";
import { ErrorBanner } from "../../components";

type Props = {
    readonly repos: Repo[];
    readonly reposLoading: boolean;
    readonly selectedRepoId: string;
    readonly onRepoChange: (id: string) => void;
    readonly prompt: string;
    readonly onPromptChange: (prompt: string) => void;
    readonly creating: boolean;
    readonly formError: string | null;
    readonly isTaskRunning: boolean;
    readonly onSubmit: (e: FormEvent) => void;
    readonly onRefreshRepos: () => void;
};

export const TaskCreateForm = ({
    repos,
    reposLoading,
    selectedRepoId,
    onRepoChange,
    prompt,
    onPromptChange,
    creating,
    formError,
    isTaskRunning,
    onSubmit,
    onRefreshRepos,
}: Props): JSX.Element => {
    const { t } = useTranslation();

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-lg border p-5 space-y-4 flex-shrink-0"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {t("agentTask.form.title")}
            </h2>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label
                        className="text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {t("agentTask.form.repoLabel")}
                    </label>
                    <button
                        type="button"
                        onClick={onRefreshRepos}
                        disabled={reposLoading}
                        className="flex items-center gap-1 text-xs disabled:opacity-40"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <PiArrowsClockwise size={12} className={reposLoading ? "animate-spin" : ""} />
                        {t("agentTask.form.refreshRepos")}
                    </button>
                </div>
                {reposLoading ? (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("agentTask.loadingRepos")}
                    </p>
                ) : repos.length === 0 ? (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("agentTask.noRepos")}
                    </p>
                ) : (
                    <select
                        value={selectedRepoId}
                        onChange={(e) => onRepoChange(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                        style={{
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--border)",
                            color: "var(--text-primary)",
                        }}
                    >
                        {repos.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name} ({r.currentBranch})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div>
                <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                >
                    {t("agentTask.form.promptLabel")}
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={t("agentTask.form.promptPlaceholder")}
                    rows={3}
                    className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                    style={{
                        backgroundColor: "var(--bg-surface)",
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                    }}
                />
            </div>

            {isTaskRunning && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("agentTask.form.taskRunning")}
                </p>
            )}

            {formError !== null && <ErrorBanner message={formError} />}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={creating || !selectedRepoId || !prompt.trim() || isTaskRunning}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-violet-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {creating ? t("agentTask.form.creating") : t("agentTask.form.createButton")}
                </button>
            </div>
        </form>
    );
};
