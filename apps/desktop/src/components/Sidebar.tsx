import type { JSX, ReactNode } from "react";
import { PiFolders, PiGear, PiRobot } from "react-icons/pi";
import { useTranslation } from "react-i18next";

import type { HealthStatus } from "../hooks";

export const PAGE = {
    REPO: "repositories",
    TASK: "agent-task",
    SETTINGS: "settings",
} as const;
export type Page = typeof PAGE[keyof typeof PAGE];

type NavItem = {
    readonly id: Page;
    readonly labelKey: "nav.repositories" | "nav.agentTask" | "nav.settings";
    readonly icon: ReactNode;
};

const NAV_ITEMS: readonly NavItem[] = [
    { id: PAGE.REPO, labelKey: "nav.repositories", icon: <PiFolders /> },
    { id: PAGE.TASK, labelKey: "nav.agentTask", icon: <PiRobot /> },
    { id: PAGE.SETTINGS, labelKey: "nav.settings", icon: <PiGear /> },
];

type StatusIndicatorProps = {
    readonly status: HealthStatus;
};

const StatusIndicator = ({ status }: StatusIndicatorProps): JSX.Element => {
    const { t } = useTranslation();
    const config = {
        connected: { dot: "bg-green-500", label: t("sidebar.status.connected"), animate: false },
        disconnected: { dot: "bg-red-500", label: t("sidebar.status.disconnected"), animate: false },
        checking: { dot: "bg-yellow-500", label: t("sidebar.status.checking"), animate: true },
    }[status];

    return (
        <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${config.dot}${config.animate ? " animate-pulse" : ""}`} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{config.label}</span>
        </div>
    );
};

type SidebarProps = {
    readonly currentPage: Page;
    readonly onNavigate: (page: Page) => void;
    readonly healthStatus: HealthStatus;
};

export const Sidebar = ({ currentPage, onNavigate, healthStatus }: SidebarProps): JSX.Element => {
    const { t } = useTranslation();

    return (
        <aside
            className="flex h-screen w-56 flex-col border-r"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
            <div className="flex h-14 items-center px-4 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {t("sidebar.appName")}
                </span>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-left"
                        style={
                            currentPage === item.id
                                ? { backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }
                                : { color: "var(--text-secondary)" }
                        }
                        onMouseEnter={(e) => {
                            if (currentPage !== item.id) {
                                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                                e.currentTarget.style.color = "var(--text-primary)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentPage !== item.id) {
                                e.currentTarget.style.backgroundColor = "";
                                e.currentTarget.style.color = "var(--text-secondary)";
                            }
                        }}
                    >
                        <span>{item.icon}</span>
                        <span>{t(item.labelKey)}</span>
                    </button>
                ))}
            </nav>

            <div className="border-t px-2 py-3" style={{ borderColor: "var(--border)" }}>
                <div className="px-3">
                    <StatusIndicator status={healthStatus} />
                </div>
            </div>
        </aside>
    );
};
