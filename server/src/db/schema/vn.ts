import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, text, jsonb, bigint, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { players } from './players';

export const sceneLogs = pgTable('scene_logs', {
    id: serial('id').primaryKey(),

    playerId: integer('player_id').references(() => players.id),
    userId: text('user_id'),
    deviceId: text('device_id'),

    sceneId: text('scene_id').notNull(),
    choices: jsonb('choices').$type<any[]>(),
    payload: jsonb('payload').$type<Record<string, any>>(),

    startedAt: bigint('started_at', { mode: 'number' }),
    finishedAt: bigint('finished_at', { mode: 'number' }),
    createdAt: bigint('created_at', { mode: 'number' }),
}, (table) => ({
    playerIdx: index('scene_logs_player_idx').on(table.playerId),
    userIdx: index('scene_logs_user_idx').on(table.userId),
    sceneIdx: index('scene_logs_scene_idx').on(table.sceneId),
    sceneCommitUnique: uniqueIndex('scene_logs_scene_commit_unq')
        .on(table.playerId, table.sceneId)
        .where(sql`(${table.payload} ->> 'type') = 'scene_commit'`),
}));

// VN Sessions (for batch commit architecture)
export const vnSessions = pgTable('vn_sessions', {
    id: text('id').primaryKey(), // UUID
    playerId: integer('player_id').references(() => players.id).notNull(),

    sceneId: text('scene_id').notNull(),
    seed: bigint('seed', { mode: 'number' }).notNull(), // RNG seed for deterministic battle
    stateVersion: integer('state_version').notNull(),
    snapshotHash: text('snapshot_hash').notNull(),
    allowedOps: jsonb('allowed_ops').$type<string[]>(),

    initialState: jsonb('initial_state').$type<Record<string, any>>(),

    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
    committedAt: bigint('committed_at', { mode: 'number' }),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => ({
    playerIdx: index('vn_sessions_player_idx').on(table.playerId),
    expiresIdx: index('vn_sessions_expires_idx').on(table.expiresAt),
}));

// VN Commits (idempotency via nonce)
export const vnCommits = pgTable('vn_commits', {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').references(() => vnSessions.id).notNull(),
    commitNonce: text('commit_nonce').unique().notNull(), // UUID

    result: jsonb('result').$type<Record<string, any>>(),

    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => ({
    sessionIdx: index('vn_commits_session_idx').on(table.sessionId),
}));
