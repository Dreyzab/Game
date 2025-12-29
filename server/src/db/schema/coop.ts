import { pgTable, serial, text, integer, boolean, bigint, timestamp, index, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { players } from './players';

// Coop Sessions - Manages the game lobby and current state
export const coopSessions = pgTable('coop_sessions', {
    id: serial('id').primaryKey(),
    hostId: integer('host_id').references(() => players.id).notNull(),
    inviteCode: text('invite_code').unique().notNull(), // Short code for joining
    status: text('status').default('waiting'), // 'waiting', 'active', 'finished'
    currentScene: text('current_scene').default('prologue_start'), // Syncs narrative
    flags: json('flags').$type<Record<string, any>>().default({}), // Session flags affecting narrative

    // Config
    maxPlayers: integer('max_players').default(4),

    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    startedAt: bigint('started_at', { mode: 'number' }),
    endedAt: bigint('ended_at', { mode: 'number' }),
}, (table) => ({
    hostIdx: index('coop_host_idx').on(table.hostId),
    codeIdx: index('coop_code_idx').on(table.inviteCode),
}));

export const coopSessionsRelations = relations(coopSessions, ({ one, many }) => ({
    host: one(players, {
        fields: [coopSessions.hostId],
        references: [players.id],
    }),
    participants: many(coopParticipants),
    votes: many(coopVotes),
}));

// Coop Participants - Players joined in a session
export const coopParticipants = pgTable('coop_participants', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => coopSessions.id, { onDelete: 'cascade' }).notNull(),
    playerId: integer('player_id').references(() => players.id).notNull(),

    role: text('role'), // 'leader', 'medic', 'scout', etc.
    isReady: boolean('is_ready').default(false),
    // Per-player reading/progress cursor (used to allow async reading between checkpoints)
    currentScene: text('current_scene'),
    joinedAt: bigint('joined_at', { mode: 'number' }).notNull(),
}, (table) => ({
    sessionIdx: index('part_session_idx').on(table.sessionId),
    playerIdx: index('part_player_idx').on(table.playerId),
}));

export const coopParticipantsRelations = relations(coopParticipants, ({ one }) => ({
    session: one(coopSessions, {
        fields: [coopParticipants.sessionId],
        references: [coopSessions.id],
    }),
    player: one(players, {
        fields: [coopParticipants.playerId],
        references: [players.id],
    }),
}));

// Coop Votes - Real-time voting for narrative choices
export const coopVotes = pgTable('coop_votes', {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => coopSessions.id, { onDelete: 'cascade' }).notNull(),
    sceneId: text('scene_id').notNull(),
    choiceId: text('choice_id').notNull(),
    voterId: integer('voter_id').references(() => players.id).notNull(),

    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
}, (table) => ({
    sessionSceneIdx: index('vote_session_scene_idx').on(table.sessionId, table.sceneId),
}));

export const coopVotesRelations = relations(coopVotes, ({ one }) => ({
    session: one(coopSessions, {
        fields: [coopVotes.sessionId],
        references: [coopSessions.id],
    }),
    voter: one(players, {
        fields: [coopVotes.voterId],
        references: [players.id],
    }),
}));
