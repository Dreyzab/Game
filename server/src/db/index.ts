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
};

let client;

if (cloudSqlInstance && connectionString) {
    console.log(`[DB] Cloud Run environment. Connecting via Unix socket: /cloudsql/${cloudSqlInstance}`);
    // postgres-js: passing host in options overrides the hostname in the connection string
    client = postgres(connectionString, {
        ...sqlOptions,
        host: `/cloudsql/${cloudSqlInstance}`,
    });
} else {
    console.log('[DB] Connecting via TCP');
    client = postgres(connectionString || 'postgres://postgres:postgres@localhost:5432/grezwanderer', sqlOptions);
}

export const db = drizzle(client, { schema });
