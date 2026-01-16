/**
 * Survival Sessions - PostgreSQL persistence for survival mode
 * Stores session state as JSONB with hot-cache + write-through pattern
 */

import { pgTable, text, jsonb, integer, bigint, timestamp, index } from 'drizzle-orm/pg-core';
import type { SurvivalState } from '../../shared/types/survival';

/**
 * Survival sessions table
 * - state: Full SurvivalState as JSONB (hot-cached in memory, persisted here)
 * - version: Monotonic counter for optimistic concurrency
 * - expiresAt: 24h after last activity, used for TTL cleanup
 */
export const survivalSessions = pgTable('survival_sessions', {
    sessionId: text('session_id').primaryKey(),
    state: jsonb('state').notNull().$type<SurvivalState>(),
    status: text('status').notNull().default('lobby'), // 'lobby' | 'active' | 'paused' | 'ended'
    version: integer('version').notNull().default(0),
    lastRealTickAt: bigint('last_real_tick_at', { mode: 'number' }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
}, (table) => ({
    statusIdx: index('survival_sessions_status_idx').on(table.status),
    expiresAtIdx: index('survival_sessions_expires_at_idx').on(table.expiresAt),
}));

export type SurvivalSessionRow = typeof survivalSessions.$inferSelect;
export type NewSurvivalSession = typeof survivalSessions.$inferInsert;
