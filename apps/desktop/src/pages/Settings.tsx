import { ReactNode, useMemo } from "react";

import { ThemeToggle } from "../components";
import { useHealthCheck } from "../hooks";

type SectionProps = {
    readonly title: string;
    readonly children: ReactNode;
};
const Section = ({ title, children }: SectionProps) =>  (
    <div
        className="rounded-lg border p-4"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
        <h2
            className="mb-4 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
        >
            {title}
        </h2>
        <div className="space-y-3">{children}</div>
    </div>
);

type RowProps = {
    readonly label: string;
    readonly children: ReactNode;
};
const Row = ({ label, children }: RowProps) => (
    <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <div>{children}</div>
    </div>
);

export const SettingsPage = () => {
	const { status, lastChecked, refresh } = useHealthCheck();

    const statusConfig = useMemo(
        () =>
            ({
                connected: { label: "Connected", className: "text-green-500" },
                disconnected: { label: "Offline", className: "text-red-500" },
                checking: { label: "Checking…", className: "text-yellow-500" },
            })[status],
        [status],
    );

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    Settings
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    Application configuration and connection status.
                </p>
            </div>

            <div className="max-w-lg space-y-6">
                <Section title="Appearance">
                    <Row label="Theme">
                        <ThemeToggle />
                    </Row>
                </Section>

                <Section title="Backend API">
                    <Row label="URL">
                        <code
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-subtle)" }}
                        >
                            http://127.0.0.1:3001
                        </code>
                    </Row>

                    <Row label="Status">
                        <span className={`text-sm font-medium ${statusConfig.className}`}>
                            {statusConfig.label}
                        </span>
                    </Row>

                    <Row label="Last checked">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
                        </span>
                    </Row>

                    <div className="pt-2">
                        <button
                            onClick={refresh}
                            className="rounded-md px-3 py-1.5 text-xs transition-colors"
                            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-hover-subtle)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                            }}
                        >
                            Refresh now
                        </button>
                    </div>
                </Section>

                <Section title="Application">
                    <Row label="Version">
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>0.0.1</span>
                    </Row>
                </Section>
            </div>
        </div>
    );
};
