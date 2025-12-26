import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('[DB] DATABASE_URL is not set. Using fallback connection.');
} else {
    const masked = connectionString.replace(/:\/\/.*@/, '://***:***@');
    console.log(`[DB] Connecting to: ${masked}`);
}

const sqlOptions: any = {
    onnotice: (notice: any) => console.log('[DB PG NOTICE]', notice),
};

const cloudSqlInstance = process.env.CLOUD_SQL_CONNECTION_NAME;
let effectiveConnectionString = connectionString || 'postgres://postgres:postgres@localhost:5432/grezwanderer';

// If in Cloud Run and we have an instance name, force path to Unix socket
if (cloudSqlInstance && effectiveConnectionString.startsWith('postgres')) {
    try {
        const url = new URL(effectiveConnectionString);
        url.searchParams.set('host', `/cloudsql/${cloudSqlInstance}`);
        effectiveConnectionString = url.toString();
        // postgres-js uses host param for socket path if it starts with /
        console.log(`[DB] Cloud Run environment detected. Using Cloud SQL socket: /cloudsql/${cloudSqlInstance}`);
    } catch (e) {
        console.error('[DB] Failed to parse DATABASE_URL for socket injection', e);
    }
}

const client = postgres(effectiveConnectionString, sqlOptions);
export const db = drizzle(client, { schema });
