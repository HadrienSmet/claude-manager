import type { JSX } from "react";
import { useTranslation } from "react-i18next";

import type { TaskStatus } from "@claude-manager/core";

const STATUS_DOT: Record<TaskStatus, string> = {
    pending: "bg-yellow-500",
    running: "bg-blue-500 animate-pulse",
    waiting_approval: "bg-violet-500",
    completed: "bg-green-500",
    rejected: "bg-red-500",
};

const STATUS_TEXT: Record<TaskStatus, string> = {
    pending: "text-yellow-500",
    running: "text-blue-500",
    waiting_approval: "text-violet-500",
    completed: "text-green-500",
    rejected: "text-red-500",
};

export const StatusBadge = ({ status }: { readonly status: TaskStatus }): JSX.Element => {
    const { t } = useTranslation();
    const labels: Record<TaskStatus, string> = {
        pending: t("agentTask.status.pending"),
        running: t("agentTask.status.running"),
        waiting_approval: t("agentTask.status.waiting_approval"),
        completed: t("agentTask.status.completed"),
        rejected: t("agentTask.status.rejected"),
    };
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_TEXT[status]}`}>
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
            {labels[status]}
        </span>
    );
};
