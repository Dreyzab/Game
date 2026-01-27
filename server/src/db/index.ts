import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
const cloudSqlInstance = process.env.CLOUD_SQL_CONNECTION_NAME;

if (!connectionString) {
    console.warn('[DB] DATABASE_URL is not set. Using fallback.');
}

const sqlOptions: any = {
    onnotice: (notice: any) => console.log('[DB PG NOTICE]', notice),
    connect_timeout: 10,
};

console.log('[DB] Initializing database client...');
let client;

if (cloudSqlInstance && connectionString) {
    console.log(`[DB] Cloud Run environment. Connecting via Unix socket: /cloudsql/${cloudSqlInstance}`);

    // Parse connection string to get credentials
    try {
        const url = new URL(connectionString);
        const dbName = url.pathname.split('/')[1];
        console.log(
            `[DB] Using DATABASE_URL credentials: user=${url.username || '(empty)'} db=${dbName || '(empty)'} password=${url.password ? '***set***' : '(empty)'
            }`
        );
        client = postgres({
            host: `/cloudsql/${cloudSqlInstance}`,
            user: url.username,
            password: url.password || undefined,
            database: dbName,
            ...sqlOptions,
        });
    } catch (e) {
        console.error('[DB] Failed to parse DATABASE_URL for socket connection. Falling back to override.', e);
        // Fallback: postgres-js should prefer host in options even if connectionString has another host
        client = postgres(connectionString, {
            host: `/cloudsql/${cloudSqlInstance}`,
            ...sqlOptions,
        });
    }
} else {
    console.log('[DB] Connecting via TCP');
    client = postgres(connectionString || 'postgres://postgres:postgres@localhost:5432/grezwanderer', sqlOptions);
}

export const db = drizzle(client, { schema });
