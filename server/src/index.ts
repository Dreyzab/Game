import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { app } from "./app";
import { runDbMigrations } from "./db/migrate";
import { initSurvivalService } from "./services/survivalService";
import { startCleanupScheduler } from "./jobs/cleanupExpiredSessions";

const port = Number(process.env.PORT) || 3000;
console.log(`[Startup] PORT env var: ${process.env.PORT}, parsed: ${port}`);
console.log(`[Startup] Initializing Elysia app...`);

// Start the server FIRST so Cloud Run health checks pass
try {
    app.use(swagger()).use(cors()).listen({ port, hostname: "0.0.0.0" }, (server) => {
        console.log(`[Startup] Elysia is running at ${server?.hostname}:${server?.port}`);
    });
    console.log(`[Startup] app.listen() called.`);
} catch (e) {
    console.error(`[Startup] Failed to start server:`, e);
    process.exit(1);
}

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

// Run migrations AFTER server is up (non-blocking for health checks)
try {
    await runDbMigrations();
    console.log("[DB] Migrations completed successfully.");

    // Initialize survival service - recover active sessions from database
    await initSurvivalService();

    // Start cleanup scheduler for expired sessions
    startCleanupScheduler();
} catch (error) {
    console.error("[DB] Failed to run migrations on startup.");
    console.error("Tip: run `bun run db:migrate` inside the `server/` folder, or set `DB_MIGRATE_ON_STARTUP=false`.");
    console.error(error);
    // Don't crash the server - it's already responding to health checks
}
