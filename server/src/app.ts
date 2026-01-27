import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./api/auth";
import { playerRoutes } from "./api/routes/player";
import { inventoryRoutes } from "./api/routes/inventory";
import { questsRoutes } from "./api/routes/quests";
import { skillsRoutes } from "./api/routes/skills";
import { mapRoutes } from "./api/routes/map";
import { combatRoutes } from "./api/routes/combat";
import { vnRoutes } from "./api/routes/vn";
import { coopRoutes } from "./api/routes/coop";
import { pvpRoutes } from "./api/routes/pvp";
import { presenceRoutes } from "./api/routes/presence";
import { masteryRoutes } from "./api/routes/mastery";
import { resonanceRoutes } from "./api/routes/resonance";
import { adminRoutes } from "./api/routes/admin";
import { survivalRoutes } from "./api/routes/survival";
import { detectiveRoutes } from "./api/routes/detective";
import { wsRoutes } from "./sockets";

export const app = new Elysia()
    .use(cors({
        origin: [
            'https://grezwanderer-dda4f.web.app',
            'http://localhost:5173',
            'http://localhost:4173'
        ],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'Upgrade', 'Connection', 'x-device-id'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
    }))
    .use(auth)
    .use(playerRoutes)
    .use(inventoryRoutes)
    .use(questsRoutes)
    .use(skillsRoutes)
    .use(mapRoutes)
    .use(combatRoutes)
    .use(vnRoutes)
    .use(coopRoutes)
    .use(survivalRoutes)
    .use(resonanceRoutes)
    .use(pvpRoutes)
    .use(presenceRoutes)
    .use(masteryRoutes)
    .use(detectiveRoutes)
    .use(adminRoutes)
    .use(wsRoutes)
    .get("/", () => "Hello form Grezwanderer Backend (Bun + Elysia)");

export type App = typeof app;

