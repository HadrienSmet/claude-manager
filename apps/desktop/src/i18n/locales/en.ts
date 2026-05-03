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
        description: "Create a task and let the agent implement it on a dedicated branch.",
        form: {
            title: "New task",
            repoLabel: "Repository",
            promptLabel: "Prompt",
            promptPlaceholder: "Describe what the agent should implement…",
            createButton: "Create task",
            creating: "Creating…",
        },
        status: {
            pending: "Pending",
            running: "Running",
            waiting_approval: "Awaiting approval",
            completed: "Completed",
            rejected: "Rejected",
        },
        task: {
            summary: "Summary",
            filesWritten: "Files written",
            commandsToRun: "Commands",
            diffTitle: "Diff",
            noFiles: "No files changed",
            noChanges: "No changes",
            runButton: "Run agent",
            running: "Running…",
            commitButton: "Commit",
            committing: "Committing…",
            rejectButton: "Reject",
            rejecting: "Rejecting…",
            commitHash: "Commit",
        },
        errors: {
            create: "Failed to create task",
            run: "Failed to run agent",
            commit: "Failed to commit",
            reject: "Failed to reject",
        },
        loadingRepos: "Loading repositories…",
        noRepos: "No repositories registered. Add one in the Repositories page first.",
        empty: {
            title: "No active task",
            hint: "Select a repository and enter a prompt to create a new task.",
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
