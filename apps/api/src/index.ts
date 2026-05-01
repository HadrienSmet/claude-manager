import { buildServer } from "./server.js";

const HOST = process.env["HOST"] ?? "127.0.0.1";
const PORT = Number(process.env["PORT"] ?? 3001);

const app = await buildServer();

try {
    await app.listen({ host: HOST, port: PORT });
} catch (e) {
    app.log.error(e);
    process.exit(1);
}
