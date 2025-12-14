import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { app } from "./app";

app.use(swagger()).use(cors()).listen(3000);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

