import type { JSX } from "react";
import { PiRobot } from "react-icons/pi";
import { useTranslation } from "react-i18next";

type StatCardProps = {
    readonly label: string;
    readonly value: string;
};

const StatCard = ({ label, value }: StatCardProps): JSX.Element => (
    <div
        className="rounded-lg border px-4 py-3"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
);

export const AgentTaskPage = (): JSX.Element => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col flex-1 p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t("agentTask.title")}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("agentTask.description")}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <StatCard label={t("agentTask.stats.active")} value="0" />
                <StatCard label={t("agentTask.stats.completed")} value="0" />
                <StatCard label={t("agentTask.stats.review")} value="0" />
            </div>

            <div
                className="flex flex-col flex-1 justify-center items-center rounded-lg border border-dashed p-12"
                style={{ borderColor: "var(--border-dashed)" }}
            >
                <PiRobot size={60} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm font-medium mt-4" style={{ color: "var(--text-subtle)" }}>
                    {t("agentTask.empty.title")}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                    {t("agentTask.empty.hint")}
                </p>
            </div>
        </div>
    );
};
