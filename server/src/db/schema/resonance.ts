import { pgTable, serial, text, integer, jsonb, bigint, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Кооператив «Резонанс» — сущности сессий, игроков и событий.
 * Хранение — облегчённый слой под будущую миграцию из in-memory.
 */

export const resonanceSessions = pgTable('resonance_sessions', {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(),
    episodeId: text('episode_id').notNull(), // например, divergent_realities
    sceneId: text('scene_id').notNull(), // текущий ключ сцены
    status: text('status').$type<'lobby' | 'active' | 'paused' | 'finished'>().default('lobby'),
    strain: integer('strain').default(0),
    trust: integer('trust').default(0),
    brake: boolean('brake').default(false),
    alert: integer('alert').default(0), // уровень тревоги 0-3
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
    updatedAt: bigint('updated_at', { mode: 'number' }).default(Date.now()),
});

export const resonancePlayers = pgTable('resonance_players', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id'),
    deviceId: text('device_id'),
    name: text('name').notNull(),
    archetype: text('archetype').$type<'skeptic' | 'empath' | 'guardian' | 'visionary'>(),
    rank: integer('rank').default(3), // 1..4 социальные позиции
    conviction: integer('conviction').default(3), // ресурс для прерываний
    isHost: boolean('is_host').default(false),
    statuses: jsonb('statuses').$type<string[]>().default([]),
    joinedAt: bigint('joined_at', { mode: 'number' }).default(Date.now()),
    updatedAt: bigint('updated_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_players_session_idx').on(table.sessionId),
    deviceIdx: index('res_players_device_idx').on(table.deviceId),
}));

export const resonanceScenes = pgTable('resonance_scenes', {
    id: serial('id').primaryKey(),
    episodeId: text('episode_id').notNull(),
    key: text('scene_key').notNull(),
    type: text('type').$type<'narrative' | 'vote' | 'qte' | 'combat'>().notNull(),
    config: jsonb('config').$type<Record<string, any>>(),
}, (table) => ({
    episodeIdx: index('res_scenes_episode_idx').on(table.episodeId),
    uniqueScene: index('res_scenes_episode_key_idx').on(table.episodeId, table.key),
}));

export const resonanceVotes = pgTable('resonance_votes', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    sceneKey: text('scene_key').notNull(),
    playerId: integer('player_id').references(() => resonancePlayers.id, { onDelete: 'cascade' }).notNull(),
    optionId: text('option_id').notNull(),
    weight: integer('weight').default(1),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionSceneIdx: index('res_votes_session_scene_idx').on(table.sessionId, table.sceneKey),
}));

export const resonanceInterrupts = pgTable('resonance_interrupts', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    sceneKey: text('scene_key').notNull(),
    playerId: integer('player_id').references(() => resonancePlayers.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // e.g. rebellion, brake
    cost: integer('cost').default(0),
    payload: jsonb('payload').$type<Record<string, any>>(),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
});

export const resonanceStrainLog = pgTable('resonance_strain_log', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_strain_session_idx').on(table.sessionId),
}));

export const resonanceProxemicLog = pgTable('resonance_proxemic_log', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    playerId: integer('player_id').references(() => resonancePlayers.id, { onDelete: 'cascade' }),
    proximityHint: text('proximity_hint'),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_prox_session_idx').on(table.sessionId),
}));

export const resonanceKudos = pgTable('resonance_kudos', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    fromPlayer: integer('from_player').references(() => resonancePlayers.id, { onDelete: 'cascade' }),
    toPlayer: integer('to_player').references(() => resonancePlayers.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(), // e.g. argue, cover, clutch
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_kudos_session_idx').on(table.sessionId),
}));

export const resonanceInjections = pgTable('resonance_injections', {
    id: serial('id').primaryKey(),
    sceneKey: text('scene_key').notNull(),
    archetype: text('archetype').$type<'skeptic' | 'empath' | 'guardian' | 'visionary'>().notNull(),
    payload: jsonb('payload').$type<Record<string, any>>().notNull(),
});

// Items dictionary
export const resonanceItems = pgTable('resonance_items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slot: text('slot').notNull(), // main/support/util/rare
    charges: integer('charges'),
    cooldownScenes: integer('cooldown_scenes'),
    data: jsonb('data').$type<Record<string, any>>(),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
});

// Items per player per session
export const resonancePlayerItems = pgTable('resonance_player_items', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    playerId: integer('player_id').references(() => resonancePlayers.id, { onDelete: 'cascade' }).notNull(),
    itemId: text('item_id').references(() => resonanceItems.id).notNull(),
    state: jsonb('state').$type<Record<string, any>>(),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_player_items_session_idx').on(table.sessionId),
    playerIdx: index('res_player_items_player_idx').on(table.playerId),
    sessionPlayerItemIdx: index('res_player_items_unique').on(table.sessionId, table.playerId, table.itemId),
}));

// Checks log
export const resonanceChecksLog = pgTable('resonance_checks_log', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    sceneKey: text('scene_key').notNull(),
    playerId: integer('player_id').references(() => resonancePlayers.id, { onDelete: 'cascade' }),
    skill: text('skill').notNull(),
    dc: integer('dc').notNull(),
    result: text('result').$type<'success' | 'fail' | 'partial'>().notNull(),
    roll: integer('roll'),
    position: integer('position'),
    strainDelta: integer('strain_delta'),
    trustDelta: integer('trust_delta'),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_checks_session_idx').on(table.sessionId),
    sceneIdx: index('res_checks_scene_idx').on(table.sceneKey),
}));

// Item uses log
export const resonanceItemUses = pgTable('resonance_item_uses', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => resonanceSessions.id, { onDelete: 'cascade' }).notNull(),
    playerId: integer('player_id').references(() => resonancePlayers.id, { onDelete: 'cascade' }),
    itemId: text('item_id').references(() => resonanceItems.id),
    effect: jsonb('effect').$type<Record<string, any>>(),
    createdAt: bigint('created_at', { mode: 'number' }).default(Date.now()),
}, (table) => ({
    sessionIdx: index('res_item_use_session_idx').on(table.sessionId),
}));

export const resonanceSessionsRelations = relations(resonanceSessions, ({ many }) => ({
    players: many(resonancePlayers),
    votes: many(resonanceVotes),
    interrupts: many(resonanceInterrupts),
    strainLog: many(resonanceStrainLog),
    kudos: many(resonanceKudos),
    itemUses: many(resonanceItemUses),
    checks: many(resonanceChecksLog),
    playerItems: many(resonancePlayerItems),
}));

export const resonancePlayersRelations = relations(resonancePlayers, ({ one }) => ({
    session: one(resonanceSessions, {
        fields: [resonancePlayers.sessionId],
        references: [resonanceSessions.id],
    }),
}));

export const resonanceItemsRelations = relations(resonanceItems, ({ many }) => ({
    uses: many(resonanceItemUses),
}));

