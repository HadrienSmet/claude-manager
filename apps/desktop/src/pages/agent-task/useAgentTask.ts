import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { TASK_STATUS } from "@claude-manager/core";

import { 
	commitTask, 
	createTask, 
	listRepos, 
	listTasks, 
	rejectTask, 
	runTask, 
	AgentTask, 
	ApiError, 
	Repo,
} from "../../api";

export type AgentTaskHook = {
    readonly repos: Repo[];
    readonly reposLoading: boolean;
    readonly selectedRepoId: string;
    readonly setSelectedRepoId: (id: string) => void;
    readonly prompt: string;
    readonly setPrompt: (p: string) => void;
    readonly creating: boolean;
    readonly formError: string | null;
    readonly task: AgentTask | null;
    readonly actionLoading: boolean;
    readonly actionError: string | null;
    readonly canRun: boolean;
    readonly canCommit: boolean;
    readonly canReject: boolean;
    readonly handleCreate: (e: FormEvent) => Promise<void>;
    readonly handleRun: () => Promise<void>;
    readonly handleCommit: () => Promise<void>;
    readonly handleReject: () => Promise<void>;
};

export const useAgentTask = (): AgentTaskHook => {
    const { t } = useTranslation();

    const [repos, setRepos] = useState<Repo[]>([]);
    const [reposLoading, setReposLoading] = useState(true);
    const [selectedRepoId, setSelectedRepoId] = useState("");
    const [prompt, setPrompt] = useState("");
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [task, setTask] = useState<AgentTask | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        listRepos()
            .then((data) => {
                if (!alive) return;
                setRepos(data);
                setReposLoading(false);
                const [first] = data;
                if (first !== undefined) setSelectedRepoId(first.id);
            })
            .catch(() => {
                if (alive) setReposLoading(false);
            });

        listTasks()
            .then((tasks) => {
                if (!alive) return;
                const active = tasks.find(
                    (tk) => tk.status === TASK_STATUS.pending || tk.status === TASK_STATUS.waiting_approval,
                );
                const [first] = tasks;
                const toShow = active ?? first;
                if (toShow !== undefined) setTask(toShow);
            })
            .catch(() => {});

        return () => {
            alive = false;
        };
    }, []);

    const handleCreate = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        if (!selectedRepoId || !prompt.trim()) return;
        setCreating(true);
        setFormError(null);
        try {
            const newTask = await createTask(selectedRepoId, prompt.trim());
            setTask(newTask);
            setPrompt("");
            setActionError(null);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : t("agentTask.errors.create"));
        } finally {
            setCreating(false);
        }
    };

    const handleRun = async (): Promise<void> => {
        if (task === null) return;
        setActionLoading(true);
        setActionError(null);
        try {
            setTask(await runTask(task.id));
        } catch (err) {
            setActionError(err instanceof ApiError ? err.message : t("agentTask.errors.run"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCommit = async (): Promise<void> => {
        if (task === null) return;
        setActionLoading(true);
        setActionError(null);
        try {
            setTask(await commitTask(task.id));
        } catch (err) {
            setActionError(err instanceof ApiError ? err.message : t("agentTask.errors.commit"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (): Promise<void> => {
        if (task === null) return;
        setActionLoading(true);
        setActionError(null);
        try {
            setTask(await rejectTask(task.id));
        } catch (err) {
            setActionError(err instanceof ApiError ? err.message : t("agentTask.errors.reject"));
        } finally {
            setActionLoading(false);
        }
    };

    const canRun =
        task !== null && !actionLoading && (task.status === TASK_STATUS.pending || task.status === TASK_STATUS.rejected);
    const canCommit = task !== null && !actionLoading && task.status === TASK_STATUS.waiting_approval;
    const canReject = task !== null && !actionLoading && task.status === TASK_STATUS.waiting_approval;

    return {
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
    };
};
