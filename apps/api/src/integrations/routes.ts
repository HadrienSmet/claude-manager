import type { FastifyInstance } from "fastify";

import { PROVIDERS, type Provider, type CredentialsStore } from "./store.js";

type ProviderParams = { provider: string };
type PutBody = { secret: string };

const isProvider = (value: string): value is Provider =>
    (PROVIDERS as readonly string[]).includes(value);

export const registerIntegrationsRoutes = async (
    app: FastifyInstance,
    store: CredentialsStore,
): Promise<void> => {
    app.get("/integrations", async () => store.list());

    app.put<{ Params: ProviderParams; Body: PutBody }>(
        "/integrations/:provider",
        {
            schema: {
                body: {
                    type: "object",
                    required: ["secret"],
                    properties: { secret: { type: "string", minLength: 1 } },
                    additionalProperties: false,
                },
            },
        },
        async (req, reply) => {
            const { provider } = req.params;
            if (!isProvider(provider)) {
                return reply.status(400).send({ error: `Unknown provider: ${provider}` });
            }

            await store.set(provider, req.body.secret);
            return reply.status(200).send({ provider, configured: true });
        },
    );

    app.delete<{ Params: ProviderParams }>(
        "/integrations/:provider",
        async (req, reply) => {
            const { provider } = req.params;
            if (!isProvider(provider)) {
                return reply.status(400).send({ error: `Unknown provider: ${provider}` });
            }

            await store.remove(provider);
            return reply.status(204).send();
        },
    );
};
