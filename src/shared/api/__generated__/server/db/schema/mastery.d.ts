/**
 * Weapon Mastery Schema
 * =====================================================
 * Tracks player's mastery level for each weapon type.
 * Mastery is per weapon TYPE (pistol, melee_blunt, etc.), not per item instance.
 * =====================================================
 */
/**
 * Weapon types that can have mastery progress.
 * These should match tags from item templates and weapon types from combat system.
 */
export type WeaponMasteryType = 'pistol' | 'shotgun' | 'rifle' | 'sniper' | 'melee_knife' | 'melee_blunt' | 'melee_spear' | 'fist';
/**
 * Combat card IDs that can be unlocked through mastery.
 */
export interface MasteryUnlock {
    cardId: string;
    requiredLevel: number;
    unlockedAt?: number;
}
/**
 * Weapon Mastery Table
 * Stores per-player, per-weapon-type progression.
 */
export declare const weaponMastery: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "weapon_mastery";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        playerId: import("drizzle-orm/pg-core").PgColumn<{
            name: "player_id";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        weaponType: import("drizzle-orm/pg-core").PgColumn<{
            name: "weapon_type";
            tableName: "weapon_mastery";
            dataType: "string";
            columnType: "PgText";
            data: WeaponMasteryType;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: WeaponMasteryType;
        }>;
        level: import("drizzle-orm/pg-core").PgColumn<{
            name: "level";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        xp: import("drizzle-orm/pg-core").PgColumn<{
            name: "xp";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        xpToNextLevel: import("drizzle-orm/pg-core").PgColumn<{
            name: "xp_to_next_level";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        unlockedCards: import("drizzle-orm/pg-core").PgColumn<{
            name: "unlocked_cards";
            tableName: "weapon_mastery";
            dataType: "json";
            columnType: "PgJsonb";
            data: MasteryUnlock[];
            driverParam: unknown;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: MasteryUnlock[];
        }>;
        totalXpEarned: import("drizzle-orm/pg-core").PgColumn<{
            name: "total_xp_earned";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        totalKills: import("drizzle-orm/pg-core").PgColumn<{
            name: "total_kills";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgBigInt53";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "weapon_mastery";
            dataType: "number";
            columnType: "PgBigInt53";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const weaponMasteryRelations: import("drizzle-orm").Relations<"weapon_mastery", {
    player: import("drizzle-orm").One<"players", true>;
}>;
/**
 * XP Thresholds for each mastery level
 * Level 1 → 2: 100 XP
 * Level 2 → 3: 250 XP
 * etc.
 */
export declare const MASTERY_XP_THRESHOLDS: Record<number, number>;
/**
 * Cards unlocked at each mastery level per weapon type
 */
export declare const MASTERY_CARD_UNLOCKS: Record<WeaponMasteryType, Array<{
    level: number;
    cardId: string;
}>>;
/**
 * Calculate XP required for a specific level
 */
export declare function getXpForLevel(level: number): number;
/**
 * Get all cards that should be unlocked at a given level
 */
export declare function getUnlockedCardsForLevel(weaponType: WeaponMasteryType, level: number): string[];
