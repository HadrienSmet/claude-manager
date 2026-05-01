import type { JSX } from "react";
import type { HealthStatus } from "../hooks";

export type Page = "repositories" | "agent-task" | "settings";

type NavItem = {
    readonly id: Page;
    readonly label: string;
    readonly icon: string;
};

const NAV_ITEMS: readonly NavItem[] = [
    { id: "repositories", label: "Repositories", icon: "🗂" },
    { id: "agent-task", label: "Agent Task", icon: "🤖" },
    { id: "settings", label: "Settings", icon: "⚙️" },
];

type SidebarProps = {
    readonly currentPage: Page;
    readonly onNavigate: (page: Page) => void;
    readonly healthStatus: HealthStatus;
};

export const Sidebar = ({ currentPage, onNavigate, healthStatus }: SidebarProps): JSX.Element => {
    return (
        <aside className="flex h-screen w-56 flex-col border-r border-gray-800 bg-gray-950">
            <div className="flex h-14 items-center px-4 border-b border-gray-800">
                <span className="text-sm font-semibold text-gray-100 tracking-tight">
                    Claude Manager
                </span>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-left ${
                            currentPage === item.id
                                ? "bg-gray-800 text-gray-100"
                                : "text-gray-400 hover:bg-gray-900 hover:text-gray-100"
                        }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="border-t border-gray-800 px-4 py-3">
                <StatusIndicator status={healthStatus} />
            </div>
        </aside>
    );
};

type StatusIndicatorProps = {
    readonly status: HealthStatus;
};

const StatusIndicator = ({ status }: StatusIndicatorProps): JSX.Element => {
    const config = {
        connected: { dot: "bg-green-500", label: "Backend connected", animate: false },
        disconnected: { dot: "bg-red-500", label: "Backend offline", animate: false },
        checking: { dot: "bg-yellow-500", label: "Connecting…", animate: true },
    }[status];

    return (
        <div className="flex items-center gap-2">
            <span
                className={`h-2 w-2 rounded-full ${config.dot}${config.animate ? " animate-pulse" : ""}`}
            />
            <span className="text-xs text-gray-500">{config.label}</span>
        </div>
    );
};
