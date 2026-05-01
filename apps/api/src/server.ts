import Fastify from "fastify";
import cors from "@fastify/cors";

export const buildServer = async () => {
    const app = Fastify({ logger: true });

    await app.register(cors, { origin: true });

    app.get("/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
    });

    return app;
};
