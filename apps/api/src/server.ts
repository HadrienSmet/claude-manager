import { join } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";

import type { AgentProvider } from "@claude-manager/agent-runtime";

import { createRepoStore } from "./repos/store.js";
import { registerReposRoutes } from "./repos/routes.js";
import { readPublicSettings, type PublicSettings } from "./settings/config.js";
import { registerSettingsRoutes } from "./settings/routes.js";
import { createTaskStore } from "./tasks/store.js";
import { registerTasksRoutes } from "./tasks/routes.js";
import { createProvider } from "./tasks/provider.js";

export const buildServer = async (
    dataDir = join(process.cwd(), "data"),
    provider?: AgentProvider,
    settings?: PublicSettings,
) => {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: true });

    app.get("/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
    });

    const repoStore = createRepoStore(join(dataDir, "repos.json"));
    await registerReposRoutes(app, repoStore);

    const taskStore = createTaskStore(join(dataDir, "tasks.json"));
    await registerTasksRoutes(app, repoStore, taskStore, provider ?? createProvider());

    await registerSettingsRoutes(app, settings ?? readPublicSettings());

    return app;
};
