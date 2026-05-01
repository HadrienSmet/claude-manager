import type { JSX } from "react";
import { PiFolders } from "react-icons/pi";
import { useTranslation } from "react-i18next";

export const RepositoriesPage = (): JSX.Element => {
    const { t } = useTranslation();

    return (
        <div style={{ flex: 1 }} className="flex flex-col p-8">
            <div className="mb-6">
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t("repositories.title")}
                </h1>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("repositories.description")}
                </p>
            </div>

            <div
                className="flex flex-1 flex-col justify-center items-center rounded-lg border border-dashed p-12 text-center"
                style={{ borderColor: "var(--border-dashed)" }}
            >
                <PiFolders size={66} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm font-medium mt-4" style={{ color: "var(--text-subtle)" }}>
                    {t("repositories.empty.title")}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                    {t("repositories.empty.hint")}
                </p>
            </div>
        </div>
    );
};
