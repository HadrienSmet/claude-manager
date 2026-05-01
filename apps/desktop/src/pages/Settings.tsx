import { useMemo } from "react";
import type { JSX, ReactNode } from "react";
import type { HealthStatus } from "../hooks";

type SectionProps = {
    readonly title: string;
    readonly children: ReactNode;
};

const Section = ({ title, children }: SectionProps): JSX.Element => {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {title}
            </h2>
            <div className="space-y-3">{children}</div>
        </div>
    );
};

type RowProps = {
    readonly label: string;
    readonly children: ReactNode;
};

const Row = ({ label, children }: RowProps): JSX.Element => {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{label}</span>
            <div>{children}</div>
        </div>
    );
};

type SettingsPageProps = {
    readonly healthStatus: HealthStatus;
    readonly lastChecked: Date | null;
    readonly onRefresh: () => void;
};

export const SettingsPage = ({
    healthStatus,
    lastChecked,
    onRefresh,
}: SettingsPageProps): JSX.Element => {
    const statusConfig = useMemo(
        () =>
            ({
                connected: { label: "Connected", className: "text-green-400" },
                disconnected: { label: "Offline", className: "text-red-400" },
                checking: { label: "Checking…", className: "text-yellow-400" },
            })[healthStatus],
        [healthStatus],
    );

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-100">Settings</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Application configuration and connection status.
                </p>
            </div>

            <div className="max-w-lg space-y-6">
                <Section title="Backend API">
                    <Row label="URL">
                        <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                            http://127.0.0.1:3001
                        </code>
                    </Row>

                    <Row label="Status">
                        <span className={`text-sm font-medium ${statusConfig.className}`}>
                            {statusConfig.label}
                        </span>
                    </Row>

                    <Row label="Last checked">
                        <span className="text-sm text-gray-400">
                            {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
                        </span>
                    </Row>

                    <div className="pt-2">
                        <button
                            onClick={onRefresh}
                            className="rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 transition-colors"
                        >
                            Refresh now
                        </button>
                    </div>
                </Section>

                <Section title="Application">
                    <Row label="Version">
                        <span className="text-sm text-gray-400">0.0.1</span>
                    </Row>
                </Section>
            </div>
        </div>
    );
};
