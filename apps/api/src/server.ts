import { join } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { createRepoStore } from "./repos/store.js";
import { registerReposRoutes } from "./repos/routes.js";

export const buildServer = async (dataDir = join(process.cwd(), "data")) => {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: true });

    app.get("/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
    });

    const store = createRepoStore(join(dataDir, "repos.json"));
    await registerReposRoutes(app, store);

    return app;
};
