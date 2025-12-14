import { pgTable, serial, text, integer, jsonb, bigint, boolean, index, customType } from 'drizzle-orm/pg-core';

// Helper for Real/Double
const real = customType<{ data: number }>({
    dataType() {
        return 'real';
    },
});

// Quests (Definitions)
export const quests = pgTable('quests', {
    id: text('id').primaryKey(), // "tutorial_start"
    title: text('title').notNull(),
    description: text('description').notNull(),
    phase: integer('phase').default(1),
    isActive: boolean('is_active').default(true),

    // JSON Blobs for complex structures
    prerequisites: jsonb('prerequisites').$type<string[]>(),
    rewards: jsonb('rewards').$type<{ fame: number; items?: string[]; flags?: string[] }>(),
    steps: jsonb('steps').$type<any[]>(),

    createdAt: bigint('created_at', { mode: 'number' }),
});

// Quest Progress
export const questProgress = pgTable('quest_progress', {
    id: serial('id').primaryKey(),
    userId: text('user_id'), // Link to Auth ID

    playerId: integer('player_id').notNull(),

    questId: text('quest_id').references(() => quests.id).notNull(),
    currentStep: text('current_step'),
    status: text('status').$type<'active' | 'completed' | 'failed'>(),

    startedAt: bigint('started_at', { mode: 'number' }),
    completedAt: bigint('completed_at', { mode: 'number' }),

    progress: jsonb('progress'), // dynamic step data
}, (table) => ({
    playerIdx: index('qp_player_idx').on(table.playerId),
}));

// Map Points
export const mapPoints = pgTable('map_points', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),

    lat: real('lat').notNull(),
    lng: real('lng').notNull(),

    type: text('type'), // 'poi', 'npc'
    qrCode: text('qr_code'),

    phase: integer('phase'),
    isActive: boolean('is_active').default(true),

    metadata: jsonb('metadata'),
});

// Point Discoveries
export const pointDiscoveries = pgTable('point_discoveries', {
    id: serial('id').primaryKey(),
    userId: text('user_id'),
    deviceId: text('device_id'),

    pointKey: text('point_key').references(() => mapPoints.id).notNull(),

    discoveredAt: bigint('discovered_at', { mode: 'number' }),
    researchedAt: bigint('researched_at', { mode: 'number' }),
    updatedAt: bigint('updated_at', { mode: 'number' }),
}, (table) => ({
    userPointIdx: index('pd_user_point_idx').on(table.userId, table.pointKey),
    devicePointIdx: index('pd_device_point_idx').on(table.deviceId, table.pointKey),
}));

// Zones (Capture Points)
export const zones = pgTable('zones', {
    id: serial('id').primaryKey(),

    name: text('name').notNull(),
    center: jsonb('center').$type<{ lat: number; lng: number }>().notNull(),
    radius: integer('radius').notNull(),

    ownerFactionId: text('owner_faction_id'),
    status: text('status').$type<'peace' | 'contested' | 'locked'>().default('peace'),
    health: integer('health').default(100),

    lastCapturedAt: bigint('last_captured_at', { mode: 'number' }),
});

// Safe/Danger Zones (Polygons)
export const safeZones = pgTable('safe_zones', {
    id: serial('id').primaryKey(),
    title: text('title'),
    // Владелец области (фракция карты: fjr, ordnung, artisans, synthesis, anarchists, traders, merchants, old_believers, farmers, neutral)
    faction: text('faction'),
    polygon: jsonb('polygon').$type<Array<{ lat: number; lng: number }>>().notNull(),
    isActive: boolean('is_active').default(true),
});

export const dangerZones = pgTable('danger_zones', {
    id: serial('id').primaryKey(),
    title: text('title'),
    dangerLevel: text('danger_level').default('low'), // low, medium, high
    polygon: jsonb('polygon').$type<Array<{ lat: number; lng: number }>>().notNull(),
    isActive: boolean('is_active').default(true),
});
