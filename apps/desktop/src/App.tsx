import { useState } from "react";
import type { JSX } from "react";

import { Sidebar, type Page } from "./components";
import { useHealthCheck } from "./hooks";
import { AgentTaskPage, RepositoriesPage, SettingsPage } from "./pages";

export const App = (): JSX.Element => {
    const [currentPage, setCurrentPage] = useState<Page>("repositories");
    const { status, lastChecked, refresh } = useHealthCheck();

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-100">
            <Sidebar
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                healthStatus={status}
            />

            <main className="flex-1 overflow-y-auto">
                {currentPage === "repositories" && <RepositoriesPage />}
                {currentPage === "agent-task" && <AgentTaskPage />}
                {currentPage === "settings" && (
                    <SettingsPage
                        healthStatus={status}
                        lastChecked={lastChecked}
                        onRefresh={refresh}
                    />
                )}
            </main>
        </div>
    );
};
