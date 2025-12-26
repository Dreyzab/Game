import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('[DB] DATABASE_URL is not set. Using fallback connection.');
} else {
    // Mask sensitive part of connection string
    const masked = connectionString.replace(/:\/\/.*@/, '://***:***@');
    console.log(`[DB] Connecting to: ${masked}`);
}

const client = postgres(connectionString || 'postgres://postgres:postgres@localhost:5432/grezwanderer', {
    onnotice: (notice) => console.log('[DB PG NOTICE]', notice),
});
export const db = drizzle(client, { schema });
