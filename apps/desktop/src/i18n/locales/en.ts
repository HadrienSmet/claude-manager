const en = {
    nav: {
        repositories: "Repositories",
        agentTask: "Agent Task",
        settings: "Settings",
    },
    sidebar: {
        appName: "Claude Manager",
        status: {
            connected: "Backend connected",
            disconnected: "Backend offline",
            checking: "Connecting…",
        },
        theme: {
            dark: "Dark mode",
            light: "Light mode",
        },
        language: {
            label: "Language",
        },
    },
    theme: {
        ariaLight: "Switch to light mode",
        ariaDark: "Switch to dark mode",
    },
    repositories: {
        title: "Repositories",
        description: "Manage the Git repositories registered with Claude Manager.",
        empty: {
            title: "No repositories yet",
            hint: "Repository registration will be available in a future update.",
        },
    },
    agentTask: {
        title: "Agent Task",
        description: "View and manage tasks assigned to AI agents.",
        stats: {
            active: "Active tasks",
            completed: "Completed",
            review: "Needs review",
        },
        empty: {
            title: "No tasks running",
            hint: "Task assignment will be available once a repository is registered.",
        },
    },
    settings: {
        title: "Settings",
        description: "Application configuration and connection status.",
        appearance: {
            title: "Appearance",
            theme: "Theme",
            language: "Language",
        },
        backend: {
            title: "Backend API",
            url: "URL",
            status: {
                label: "Status",
                connected: "Connected",
                disconnected: "Offline",
                checking: "Checking…",
            },
            lastChecked: "Last checked",
            refresh: "Refresh now",
        },
        application: {
            title: "Application",
            version: "Version",
        },
    },
};

export default en;
