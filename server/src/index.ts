import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { app } from "./app";
import { runDbMigrations } from "./db/migrate";

try {
    await runDbMigrations();
} catch (error) {
    console.error("[DB] Failed to run migrations on startup.");
    console.error("Tip: run `bun run db:migrate` inside the `server/` folder, or set `DB_MIGRATE_ON_STARTUP=false`.");
    throw error;
}

const port = Number(process.env.PORT) || 3000;
app.use(swagger()).use(cors()).listen({ port, hostname: "0.0.0.0" });

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
