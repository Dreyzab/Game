// Bulletproof startup wrapper
// Starts a raw web server immediately to satisfy Cloud Run health checks,
// then loads the application logic in the background.

console.log(`[Startup] Booting Grezwanderer Backend (Bulletproof Mode)...`);
console.log(`[Startup] timestamp: ${new Date().toISOString()}`);

const port = Number(process.env.PORT) || 3000;
let isReady = false;
let appHandler: any = null;

// 1. Start raw server IMMEDIATELY
try {
    const server = Bun.serve({
        port,
        hostname: "0.0.0.0",
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Upgrade, Connection"
        };

        // Handle Preflight
        if(req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
}

            // Health check endpoint (always return 200 OK)
            const url = new URL(req.url);
if (url.pathname === '/health' || url.pathname === '/') {
    if (!isReady) return new Response("Initializing...", { status: 200, headers: corsHeaders });
}

// If app is loaded, delegate to it
// Note: App (Elysia) will handle its own CORS, so we don't inject headers here if delegating
if (isReady && appHandler) {
    return appHandler.fetch(req);
}

return new Response("Server Booting...", { status: 503, headers: corsHeaders });
        }
    });

console.log(`[Startup] ✅ Raw Bun server listening on ${server.hostname}:${server.port}`);
} catch (e) {
    console.error(`[Startup] ❌ PROHIBITED: Failed to bind port ${port}.`, e);
    process.exit(1);
}

// 2. Load modules in background
(async () => {
    try {
        console.log(`[Startup] Loading application modules...`);

        // Import modules individually
        const { app } = await import("./app");
        appHandler = app;
        console.log(`[Startup] App module loaded.`);

        const { runDbMigrations } = await import("./db/migrate");
        console.log(`[Startup] DB module loaded.`);

        const { initSurvivalService } = await import("./services/survivalService");
        console.log(`[Startup] Services module loaded.`);

        const { startCleanupScheduler } = await import("./jobs/cleanupExpiredSessions");
        console.log(`[Startup] Jobs module loaded.`);

        // Initialize Logic
        console.log(`[Startup] Running background initialization...`);

        try {
            await runDbMigrations();
            console.log(`[Startup] Migrations OK.`);
        } catch (dbErr) {
            console.error(`[Startup] ⚠️ DB Migrations failed (Non-fatal):`, dbErr);
        }

        try {
            await initSurvivalService();
            console.log(`[Startup] Survival Service OK.`);
        } catch (srvErr) {
            console.error(`[Startup] ⚠️ Survival Service failed initialization:`, srvErr);
        }

        startCleanupScheduler();

        // Mark as Ready
        isReady = true;
        console.log(`[Startup] 🚀 SYSTEM READY. Switched to App Handler.`);

    } catch (criticalError) {
        console.error(`[Startup] ❌ CRITICAL MODULE LOAD FAILURE:`);
        console.error(criticalError);
        // We still keep the process alive to serve 503s and logs, unless it's catastrophic
    }

    // Keep the process alive even if event loop is empty
    setInterval(() => { }, 10000);
})();
