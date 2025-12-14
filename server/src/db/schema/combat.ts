import { pgTable, serial, text, integer, jsonb, bigint, boolean, index } from 'drizzle-orm/pg-core';
import { players } from './players';

export const battles = pgTable('battles', {
    id: serial('id').primaryKey(),
    hostId: integer('host_id').references(() => players.id),
    status: text('status').$type<'waiting' | 'active' | 'finished'>().default('waiting'),
    phase: text('phase').$type<'initiative' | 'player_turn' | 'enemy_turn' | 'resolution' | 'victory' | 'defeat' | 'flee'>().default('player_turn'),
    isActive: boolean('is_active').default(true),
    winnerId: text('winner_id'),

    // Turn Logic
    currentTurnActorId: text('current_turn_actor_id'), // can be "player_123" or "enemy_1"
    turnOrder: jsonb('turn_order').$type<string[]>(), // IDs of all actors
    currentActorIndex: integer('current_actor_index').default(0),
    round: integer('round').default(1),

    // Enemy Encounters (Simplification: Store enemies in battle JSON for now)
    enemies: jsonb('enemies').$type<any[]>(),

    // Logs
    logs: jsonb('logs').$type<{ message: string; timestamp: number; actorId: string }[]>().default([]),

    createdAt: bigint('created_at', { mode: 'number' }),
    updatedAt: bigint('updated_at', { mode: 'number' }),
});

export const battleParticipants = pgTable('battle_participants', {
    id: serial('id').primaryKey(),
    battleId: integer('battle_id').references(() => battles.id).notNull(),
    playerId: integer('player_id').references(() => players.id).notNull(),

    rank: integer('rank').notNull(), // 1-4
    classId: text('class_id'),

    // Combat Stats
    hp: integer('hp').default(100),
    maxHp: integer('max_hp').default(100),
    energy: integer('energy').default(10),
    maxEnergy: integer('max_energy').default(10),

    // Card System
    hand: jsonb('hand').$type<any[]>(),
    deck: jsonb('deck').$type<any[]>(),
    discard: jsonb('discard').$type<any[]>(),
    effects: jsonb('effects').$type<any[]>(),

    joinedAt: bigint('joined_at', { mode: 'number' }),
}, (table) => ({
    battleIdx: index('bp_battle_idx').on(table.battleId),
    playerIdx: index('bp_player_idx').on(table.playerId),
}));
