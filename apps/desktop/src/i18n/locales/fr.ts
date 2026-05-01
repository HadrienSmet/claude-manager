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
        description: "Visualisez et gérez les tâches assignées aux agents IA.",
        stats: {
            active: "Tâches actives",
            completed: "Terminées",
            review: "À réviser",
        },
        empty: {
            title: "Aucune tâche en cours",
            hint: "L'assignation de tâches sera disponible une fois un dépôt enregistré.",
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
