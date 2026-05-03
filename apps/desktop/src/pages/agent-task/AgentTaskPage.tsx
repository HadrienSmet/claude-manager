import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { PiRobot } from "react-icons/pi";

import { useAgentTask } from "./useAgentTask";
import { TaskCreateForm } from "./TaskCreateForm";
import { TaskPanel } from "./TaskPanel";

export const AgentTaskPage = (): JSX.Element => {
    const { t } = useTranslation();
    const {
        repos,
        reposLoading,
        selectedRepoId,
        setSelectedRepoId,
        prompt,
        setPrompt,
        creating,
        formError,
        task,
        actionLoading,
        actionError,
        canRun,
        canCommit,
        canReject,
        handleCreate,
        handleRun,
        handleCommit,
        handleReject,
    } = useAgentTask();

    return (
        <div className="flex flex-col flex-1 p-8 gap-6">
            <div>
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t("agentTask.title")}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("agentTask.description")}
                </p>
            </div>

            <TaskCreateForm
                repos={repos}
                reposLoading={reposLoading}
                selectedRepoId={selectedRepoId}
                onRepoChange={setSelectedRepoId}
                prompt={prompt}
                onPromptChange={setPrompt}
                creating={creating}
                formError={formError}
                onSubmit={(e) => { void handleCreate(e); }}
            />

            {task !== null ? (
                <TaskPanel
                    task={task}
                    actionLoading={actionLoading}
                    actionError={actionError}
                    canRun={canRun}
                    canCommit={canCommit}
                    canReject={canReject}
                    onRun={() => { void handleRun(); }}
                    onCommit={() => { void handleCommit(); }}
                    onReject={() => { void handleReject(); }}
                />
            ) : (
                <div
                    className="flex flex-1 flex-col justify-center items-center rounded-lg border border-dashed p-12"
                    style={{ borderColor: "var(--border-dashed)" }}
                >
                    <PiRobot size={48} style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm font-medium mt-4" style={{ color: "var(--text-subtle)" }}>
                        {t("agentTask.empty.title")}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                        {t("agentTask.empty.hint")}
                    </p>
                </div>
            )}
        </div>
    );
};
