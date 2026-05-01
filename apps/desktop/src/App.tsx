import { useState } from "react";

import { PAGE, Sidebar, type Page } from "./components";
import { ThemeProvider, useTheme } from "./contexts";
import { useHealthCheck } from "./hooks";
import { AgentTaskPage, RepositoriesPage, SettingsPage } from "./pages";

const AppContent = () => {
    const [currentPage, setCurrentPage] = useState<Page>(PAGE.REPO);
    const { status } = useHealthCheck();
    const { theme } = useTheme();

    return (
        <div className={theme === "dark" ? "dark" : undefined}>
            <div
                className="flex h-screen w-screen overflow-hidden"
                style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
            >
                <Sidebar
                    currentPage={currentPage}
                    onNavigate={setCurrentPage}
                    healthStatus={status}
                />

                <main className="flex flex-1 overflow-y-auto">
                    {currentPage === PAGE.REPO && <RepositoriesPage />}
                    {currentPage === PAGE.TASK && <AgentTaskPage />}
                    {currentPage === PAGE.SETTINGS && (<SettingsPage />)}
                </main>
            </div>
        </div>
    );
};

export const App = () => (
    <ThemeProvider>
        <AppContent />
    </ThemeProvider>
);
