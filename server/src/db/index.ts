import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('DATABASE_URL is not set. Database connection will fail.');
}

const client = postgres(connectionString || 'postgres://postgres:postgres@localhost:5432/grezwanderer');
export const db = drizzle(client, { schema });
