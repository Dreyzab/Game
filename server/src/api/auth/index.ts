import { Elysia } from "elysia";
import { type Context } from "elysia";
import { verifyToken } from "@clerk/backend";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function normalizeClerkJwtKey(value: string | undefined) {
    if (!value) return undefined;
    // Support single-line env values containing literal "\n".
    const normalized = value.replaceAll("\\n", "\n").trim();
    return normalized.length ? normalized : undefined;
}

function loadMultilineJwtKeyFromDotenv(): string | undefined {
    if (process.env.NODE_ENV === "production") return undefined;

    const filenames = [".env.local", ".env"];

    for (const filename of filenames) {
        const envPath = join(process.cwd(), filename);
        if (!existsSync(envPath)) continue;

        try {
            const contents = readFileSync(envPath, "utf8");
            const lines = contents.split(/\r?\n/);
            const startIndex = lines.findIndex((line) => line.startsWith("CLERK_JWT_KEY="));
            if (startIndex === -1) continue;

            const firstLine = lines[startIndex] ?? "";
            const initial = firstLine.slice("CLERK_JWT_KEY=".length);
            const collected: string[] = [];

            if (initial) collected.push(initial);

            for (let i = startIndex + 1; i < lines.length; i++) {
                const line = lines[i] ?? "";

                // Stop at the next env assignment (multiline values are non-standard in .env).
                if (/^[A-Z_][A-Z0-9_]*=/.test(line)) break;

                collected.push(line);

                if (line.includes("-----END PUBLIC KEY-----")) break;
            }

            const candidate = collected.join("\n").trim();
            if (candidate.includes("BEGIN PUBLIC KEY") && candidate.includes("END PUBLIC KEY")) {
                return candidate;
            }
        } catch {
            // Ignore parsing errors and keep trying other files.
        }
    }

    return undefined;
}

// Clerk token verification can work with either:
// - CLERK_SECRET_KEY (allows fetching JWKS remotely), or
// - CLERK_JWT_KEY (PEM public key for networkless verification).
const SECRET_KEY = process.env.CLERK_SECRET_KEY?.trim();
const JWT_KEY = (() => {
    const fromEnv = normalizeClerkJwtKey(process.env.CLERK_JWT_KEY);
    if (fromEnv && fromEnv.includes("BEGIN PUBLIC KEY") && !fromEnv.includes("END PUBLIC KEY")) {
        const recovered = normalizeClerkJwtKey(loadMultilineJwtKeyFromDotenv());
        if (recovered) {
            console.warn(
                "Recovered CLERK_JWT_KEY from a multiline .env value. Prefer a single-line env value with literal \\n escapes.",
            );
            return recovered;
        }
    }
    return fromEnv;
})();

if (!SECRET_KEY && !JWT_KEY) {
    console.warn(
        "Clerk token verification is not configured. Set CLERK_SECRET_KEY or CLERK_JWT_KEY (recommended) in the server's environment (e.g. server/.env.local).",
    );
}

export const auth = (app: Elysia) =>
    app.derive(async ({ request, headers, set }: Context) => {
        const authHeader = headers["authorization"];
        const deviceId = headers["x-device-id"];
        const allowGuestFallback = process.env.NODE_ENV !== "production";

        let user: { id: string; type: 'clerk' | 'guest' } | null = null;
        let isGuest = false;

        // 1. Clerk JWT Auth
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];

            // If a token is present but we don't have verification material configured,
            // fail fast with a clear server-side error instead of trying remote JWKS.
            if (!SECRET_KEY && !JWT_KEY) {
                if (!allowGuestFallback || !deviceId) {
                    console.error(
                        "Auth token received but Clerk verification isn't configured. Set CLERK_SECRET_KEY or CLERK_JWT_KEY in server/.env (single-line with \\n escapes).",
                    );
                    set.status = 500;
                    return { user: null, isGuest: false };
                }

                console.warn(
                    "Auth token received but Clerk verification isn't configured. Falling back to guest auth via x-device-id (dev mode).",
                );
            }

            if (SECRET_KEY || JWT_KEY) {
                try {
                    const verified = await verifyToken(
                        token,
                        SECRET_KEY ? { secretKey: SECRET_KEY } : { jwtKey: JWT_KEY as string },
                    );

                    if (verified.sub) {
                        user = { id: verified.sub, type: "clerk" };
                    }
                } catch (e) {
                    console.error("Token verification failed", e);

                    // In production we treat invalid tokens as 401.
                    // In dev we can fall back to guest auth if a device id is present.
                    if (!allowGuestFallback || !deviceId) {
                        set.status = 401;
                        return { user: null, isGuest: false };
                    }
                }
            }
        }

        // 2. Guest Auth fallback (Only if no user verified yet)
        if (!user && deviceId) {
            // Ideally validate UUID format
            isGuest = true;
            user = { id: deviceId, type: "guest" };
        }

        return {
            user,
            isGuest
        };
    });
