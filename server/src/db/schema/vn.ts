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








