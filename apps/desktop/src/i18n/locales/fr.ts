import type en from "./en";

const fr: typeof en = {
    nav: {
        repositories: "Dépôts",
        agentTask: "Tâche Agent",
        settings: "Paramètres",
    },
    sidebar: {
        appName: "Claude Manager",
        status: {
            connected: "Backend connecté",
            disconnected: "Backend hors ligne",
            checking: "Connexion…",
        },
        theme: {
            dark: "Mode sombre",
            light: "Mode clair",
        },
        language: {
            label: "Langue",
        },
    },
    theme: {
        ariaLight: "Passer en mode clair",
        ariaDark: "Passer en mode sombre",
    },
    repositories: {
        title: "Dépôts",
        description: "Gérez les dépôts Git enregistrés dans Claude Manager.",
        empty: {
            title: "Aucun dépôt",
            hint: "L'enregistrement de dépôts sera disponible dans une prochaine mise à jour.",
        },
    },
    agentTask: {
        title: "Tâche Agent",
        description: "Créez une tâche et laissez l'agent l'implémenter sur une branche dédiée.",
        form: {
            title: "Nouvelle tâche",
            repoLabel: "Dépôt",
            promptLabel: "Prompt",
            promptPlaceholder: "Décrivez ce que l'agent doit implémenter…",
            createButton: "Créer la tâche",
            creating: "Création…",
        },
        status: {
            pending: "En attente",
            running: "En cours",
            waiting_approval: "En attente d'approbation",
            completed: "Terminée",
            rejected: "Rejetée",
        },
        task: {
            summary: "Résumé",
            filesWritten: "Fichiers créés",
            commandsToRun: "Commandes",
            diffTitle: "Diff",
            noFiles: "Aucun fichier modifié",
            runButton: "Lancer l'agent",
            running: "Exécution…",
            commitButton: "Valider",
            committing: "Validation…",
            rejectButton: "Rejeter",
            rejecting: "Rejet…",
            commitHash: "Commit",
        },
        errors: {
            create: "Impossible de créer la tâche",
            run: "Impossible de lancer l'agent",
            commit: "Impossible de valider",
            reject: "Impossible de rejeter",
        },
        loadingRepos: "Chargement des dépôts…",
        noRepos: "Aucun dépôt enregistré. Ajoutez-en un dans la page Dépôts.",
        empty: {
            title: "Aucune tâche active",
            hint: "Sélectionnez un dépôt et entrez un prompt pour créer une tâche.",
        },
    },
    settings: {
        title: "Paramètres",
        description: "Configuration de l'application et état de la connexion.",
        appearance: {
            title: "Apparence",
            theme: "Thème",
            language: "Langue",
        },
        backend: {
            title: "API Backend",
            url: "URL",
            status: {
                label: "Statut",
                connected: "Connecté",
                disconnected: "Hors ligne",
                checking: "Vérification…",
            },
            lastChecked: "Dernière vérification",
            refresh: "Actualiser",
        },
        application: {
            title: "Application",
            version: "Version",
        },
    },
};

export default fr;
