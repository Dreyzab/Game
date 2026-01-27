// Safe startup wrapper
// This file is the entry point. We use dynamic imports to catch errors that happen
// during module loading (e.g. DB connection errors at the top level of imported files).

console.log(`[Startup] Booting Grezwanderer Backend...`);
console.log(`[Startup] Node Version: ${process.version}, Platform: ${process.platform}`);
console.log(`[Startup] ENV PORT: ${process.env.PORT}`);

import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";

(async () => {
    try {
        console.log(`[Startup] Loading modules path...`);

        // Dynamic imports allow us to catch initialization errors in these files
        const { app } = await import("./app");
        console.log(`[Startup] Module './app' loaded.`);

        const { runDbMigrations } = await import("./db/migrate");
        console.log(`[Startup] Module './db/migrate' loaded.`);

        const { initSurvivalService } = await import("./services/survivalService");
        console.log(`[Startup] Module './services/survivalService' loaded.`);

        const { startCleanupScheduler } = await import("./jobs/cleanupExpiredSessions");
        console.log(`[Startup] Module './jobs/cleanupExpiredSessions' loaded.`);

        const port = Number(process.env.PORT) || 3000;
        console.log(`[Startup] Configured Port: ${port}`);

        // Start the server FIRST to satisfy Cloud Run health check immediately
        // We attach the listener to 0.0.0.0 to ensure external access
        app.use(swagger()).use(cors()).listen({ port, hostname: "0.0.0.0" }, (server) => {
            console.log(`[Startup] ✅ Server listening at ${server?.hostname}:${server?.port}`);
        });

        // Background initialization (non-blocking for the server port bind)
        (async () => {
            try {
                console.log(`[Startup] Starting background initialization...`);

                console.log(`[Startup] Running DB migrations...`);
                await runDbMigrations();
                console.log(`[Startup] DB Migrations completed.`);

                console.log(`[Startup] Initializing Survival Service...`);
                await initSurvivalService();
                console.log(`[Startup] Survival Service ready.`);

                console.log(`[Startup] Starting Cleanup Scheduler...`);
                startCleanupScheduler();
                console.log(`[Startup] 🚀 Full startup complete.`);

            } catch (initError) {
                console.error(`[Startup] ⚠️ Background initialization failed (Non-fatal, server still running):`, initError);
                // We do NOT exit here, so the server keeps running (e.g. to serve health checks or error pages)
            }
        })();

    } catch (criticalError) {
        console.error(`[Startup] ❌ CRITICAL FAILURE DURING STARTUP:`);
        console.error(criticalError);
        process.exit(1);
    }
})();
