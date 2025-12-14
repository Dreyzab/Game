/**
 * Weapon Mastery Schema
 * =====================================================
 * Tracks player's mastery level for each weapon type.
 * Mastery is per weapon TYPE (pistol, melee_blunt, etc.), not per item instance.
 * =====================================================
 */

import { pgTable, serial, text, integer, jsonb, bigint, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { players } from './players'

/**
 * Weapon types that can have mastery progress.
 * These should match tags from item templates and weapon types from combat system.
 */
export type WeaponMasteryType =
    | 'pistol'
    | 'shotgun'
    | 'rifle'
    | 'sniper'
    | 'melee_knife'
    | 'melee_blunt'
    | 'melee_spear'
    | 'fist'

/**
 * Combat card IDs that can be unlocked through mastery.
 */
export interface MasteryUnlock {
    cardId: string
    requiredLevel: number
    unlockedAt?: number // timestamp when unlocked
}

/**
 * Weapon Mastery Table
 * Stores per-player, per-weapon-type progression.
 */
export const weaponMastery = pgTable('weapon_mastery', {
    id: serial('id').primaryKey(),

    playerId: integer('player_id').references(() => players.id).notNull(),

    /** Weapon type from WeaponMasteryType */
    weaponType: text('weapon_type').$type<WeaponMasteryType>().notNull(),

    /** Current mastery level (1-10) */
    level: integer('level').default(1).notNull(),

    /** Current XP towards next level */
    xp: integer('xp').default(0).notNull(),

    /** XP required for next level (calculated or cached) */
    xpToNextLevel: integer('xp_to_next_level').default(100).notNull(),

    /** Card IDs unlocked through this mastery */
    unlockedCards: jsonb('unlocked_cards').$type<MasteryUnlock[]>().default([]),

    /** Total XP ever earned (for statistics) */
    totalXpEarned: integer('total_xp_earned').default(0).notNull(),

    /** Total enemies killed with this weapon type */
    totalKills: integer('total_kills').default(0).notNull(),

    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
}, (table) => ({
    // Each player can only have one mastery record per weapon type
    playerWeaponUnique: unique().on(table.playerId, table.weaponType),
    // Fast lookup by player
    playerIdx: index('mastery_by_player').on(table.playerId),
}))

export const weaponMasteryRelations = relations(weaponMastery, ({ one }) => ({
    player: one(players, {
        fields: [weaponMastery.playerId],
        references: [players.id],
    }),
}))

/**
 * XP Thresholds for each mastery level
 * Level 1 → 2: 100 XP
 * Level 2 → 3: 250 XP
 * etc.
 */
export const MASTERY_XP_THRESHOLDS: Record<number, number> = {
    1: 100,
    2: 250,
    3: 500,
    4: 1000,
    5: 1750,
    6: 2750,
    7: 4000,
    8: 5500,
    9: 7500,
    10: Infinity, // Max level
}

/**
 * Cards unlocked at each mastery level per weapon type
 */
export const MASTERY_CARD_UNLOCKS: Record<WeaponMasteryType, Array<{ level: number; cardId: string }>> = {
    pistol: [
        { level: 1, cardId: 'snap_shot' },
        { level: 3, cardId: 'double_tap' },
        { level: 5, cardId: 'pistol_whip' },
    ],
    shotgun: [
        { level: 1, cardId: 'buckshot' },
        { level: 3, cardId: 'muzzle_thump' },
        { level: 5, cardId: 'room_clearer' },
    ],
    rifle: [
        { level: 1, cardId: 'aimed_shot' },
        { level: 3, cardId: 'suppressive_fire' },
        { level: 5, cardId: 'stock_bash' },
    ],
    sniper: [
        { level: 1, cardId: 'steady_aim' },
        { level: 3, cardId: 'headshot' },
        { level: 5, cardId: 'overwatch' },
    ],
    melee_knife: [
        { level: 1, cardId: 'slash' },
        { level: 3, cardId: 'hamstring' },
        { level: 5, cardId: 'execute' },
    ],
    melee_blunt: [
        { level: 1, cardId: 'wild_swing' },
        { level: 3, cardId: 'skull_cracker' },
        { level: 5, cardId: 'heavy_swing' },
    ],
    melee_spear: [
        { level: 1, cardId: 'thrust' },
        { level: 3, cardId: 'spear_thrust' },
        { level: 5, cardId: 'impale' },
    ],
    fist: [
        { level: 1, cardId: 'jab' },
        { level: 3, cardId: 'haymaker' },
        { level: 5, cardId: 'ground_pound' },
    ],
}

/**
 * Calculate XP required for a specific level
 */
export function getXpForLevel(level: number): number {
    return MASTERY_XP_THRESHOLDS[level] ?? Infinity
}

/**
 * Get all cards that should be unlocked at a given level
 */
export function getUnlockedCardsForLevel(weaponType: WeaponMasteryType, level: number): string[] {
    const unlocks = MASTERY_CARD_UNLOCKS[weaponType] ?? []
    return unlocks
        .filter(u => u.level <= level)
        .map(u => u.cardId)
}
