import { pgTable, serial, text, integer, jsonb, bigint, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Players table - Identity and Meta
export const players = pgTable('players', {
    id: serial('id').primaryKey(),
    userId: text('user_id').unique(), // External Auth ID (Clerk)
    deviceId: text('device_id').unique(), // For guests
    name: text('name').notNull(),
    fame: integer('fame').default(0),
    passwordHash: text('password_hash'),
    passwordSalt: text('password_salt'),

    // Multiplayer Status
    factionId: text('faction_id'),
    squadId: text('squad_id'), // ToDo: Link to Squads table

    // Location (PostGIS could be used later, using JSON for now to match)
    location: jsonb('location').$type<{ lat: number; lng: number }>(),
    lastSeen: bigint('last_seen', { mode: 'number' }),
    status: text('status'), // 'idle', 'in_combat', 'trading'

    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
    locale: text('locale').default('ru'),
}, (table) => ({
    userIdIdx: index('by_user_id').on(table.userId),
    deviceIdIdx: index('by_device_id').on(table.deviceId),
}));

export const playersRelations = relations(players, ({ one }) => ({
    progress: one(gameProgress, {
        fields: [players.id],
        references: [gameProgress.playerId],
    }),
}));

// Game Progress - Character State
export const gameProgress = pgTable('game_progress', {
    id: serial('id').primaryKey(),
    playerId: integer('player_id').references(() => players.id, { onDelete: 'cascade' }).notNull(),

    // VN State
    currentScene: text('current_scene').default('prologue_coupe_start'),
    visitedScenes: jsonb('visited_scenes').$type<string[]>().default([]),
    flags: jsonb('flags').$type<Record<string, any>>().default({}),
    gameMode: text('game_mode').notNull().default('survival'),

    // Stats
    level: integer('level').default(1),
    xp: integer('xp').default(0),
    skillPoints: integer('skill_points').default(0),
    skills: jsonb('skills').$type<Record<string, number>>().default({}),
    subclasses: jsonb('subclasses').$type<string[]>().default([]),


    // Economy
    gold: integer('gold').default(0),
    reputation: jsonb('reputation').$type<Record<string, number>>().default({}),

    // Survival / Combat Stats
    hp: integer('hp'),
    maxHp: integer('max_hp'),
    morale: integer('morale'),
    maxMorale: integer('max_morale'),
    stamina: integer('stamina'),
    maxStamina: integer('max_stamina'),

    phase: integer('phase').default(1),
    stateVersion: integer('state_version').default(1),

    // Detective Mode State (Cloud Sync)
    detectiveState: jsonb('detective_state').$type<{
        entries: Array<{
            id: string
            type: string
            title: string
            description: string
            image?: string
            unlockedAt: number
            isRead: boolean
        }>
        evidence: Array<{
            id: string
            label: string
            description: string
            icon?: string
            source: string
            timestamp: number
        }>
        pointStates: Record<string, string>
        flags: Record<string, boolean>
        detectiveName: string | null
        lastSyncedAt: number
    }>().default({
        entries: [],
        evidence: [],
        pointStates: {},
        flags: {},
        detectiveName: null,
        lastSyncedAt: 0,
    }),

    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const gameProgressRelations = relations(gameProgress, ({ one }) => ({
    player: one(players, {
        fields: [gameProgress.playerId],
        references: [players.id],
    }),
}));
