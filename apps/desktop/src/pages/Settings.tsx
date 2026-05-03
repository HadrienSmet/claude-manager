import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PiShieldCheck } from "react-icons/pi";

import { getPublicSettings, type PublicSettings } from "../api";
import { LanguageSelect, ThemeToggle } from "../components";
import { useHealthCheck } from "../hooks";

type SectionProps = {
    readonly title: string;
    readonly children: ReactNode;
};

const Section = ({ title, children }: SectionProps) => (
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

const useAgentSettings = () => {
    const [settings, setSettings] = useState<PublicSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        getPublicSettings()
            .then((s) => { if (alive) { setSettings(s); setLoading(false); } })
            .catch(() => { if (alive) { setError("error"); setLoading(false); } });
        return () => { alive = false; };
    }, []);

    return { settings, loading, error };
};

export const SettingsPage = () => {
    const { t } = useTranslation();
    const { status, lastChecked, refresh } = useHealthCheck();
    const { settings, loading: agentLoading, error: agentError } = useAgentSettings();

    const statusConfig = useMemo(
        () => ({
            connected: { label: t("settings.backend.status.connected"), className: "text-green-500" },
            disconnected: { label: t("settings.backend.status.disconnected"), className: "text-red-500" },
            checking: { label: t("settings.backend.status.checking"), className: "text-yellow-500" },
        })[status],
        [status, t],
    );

    const providerLabel =
        settings?.agentProvider === "anthropic"
            ? t("settings.agent.providerAnthropic")
            : t("settings.agent.providerFake");

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t("settings.title")}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("settings.description")}
                </p>
            </div>

            <div className="max-w-lg space-y-6">
                <Section title={t("settings.appearance.title")}>
                    <Row label={t("settings.appearance.theme")}>
                        <ThemeToggle />
                    </Row>
                    <Row label={t("settings.appearance.language")}>
                        <LanguageSelect />
                    </Row>
                </Section>

                <Section title={t("settings.backend.title")}>
                    <Row label={t("settings.backend.url")}>
                        <code
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-subtle)" }}
                        >
                            http://127.0.0.1:3001
                        </code>
                    </Row>

                    <Row label={t("settings.backend.status.label")}>
                        <span className={`text-sm font-medium ${statusConfig.className}`}>
                            {statusConfig.label}
                        </span>
                    </Row>

                    <Row label={t("settings.backend.lastChecked")}>
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
                        </span>
                    </Row>

                    <div className="pt-2">
                        <button
                            onClick={refresh}
                            className="rounded-md px-3 py-1.5 text-xs transition-colors"
                            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-hover-subtle)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-subtle)"; }}
                        >
                            {t("settings.backend.refresh")}
                        </button>
                    </div>
                </Section>

                <Section title={t("settings.agent.title")}>
                    {agentLoading ? (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {t("settings.agent.loading")}
                        </p>
                    ) : agentError !== null ? (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {t("settings.agent.error")}
                        </p>
                    ) : (
                        <>
                            <Row label={t("settings.agent.provider")}>
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    {providerLabel}
                                </span>
                            </Row>

                            <Row label={t("settings.agent.model")}>
                                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {settings?.anthropicModel ?? t("settings.agent.noModel")}
                                </span>
                            </Row>

                            <div
                                className="flex items-center gap-2 rounded-md px-3 py-2 mt-1"
                                style={{ backgroundColor: "var(--bg-subtle)" }}
                            >
                                <PiShieldCheck size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {t("settings.agent.apiKeySafe")}
                                </p>
                            </div>
                        </>
                    )}
                </Section>

                <Section title={t("settings.application.title")}>
                    <Row label={t("settings.application.version")}>
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>0.0.1</span>
                    </Row>
                </Section>
            </div>
        </div>
    );
};
