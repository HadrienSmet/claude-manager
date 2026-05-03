import type { FastifyInstance } from "fastify";

import type { PublicSettings } from "./config.js";

export const registerSettingsRoutes = async (
    app: FastifyInstance,
    settings: PublicSettings,
): Promise<void> => {
    app.get("/settings/public", async () => settings);
};
