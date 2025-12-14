import { pgTable, text, integer, uuid, jsonb, boolean, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 3. BEHAVIOR TREES
export const behaviorTrees = pgTable('behavior_trees', {
    id: text('id').primaryKey(), // String ID like 'scorpion_rush'
    tree: jsonb('tree').notNull(), // The actual JSON structure
});

// 1. NPC TEMPLATES (Updated to link optionally)
export const npcTemplates = pgTable('npc_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    faction: text('faction', { enum: ['FJR', 'SCAVENGER', 'ANARCHIST', 'ECHO'] }).notNull(),
    archetype: text('archetype', { enum: ['GRUNT', 'ELITE', 'BOSS', 'SPECIAL'] }).notNull(),

    // Base Attributes
    baseForce: integer('base_force').default(5),
    baseEndurance: integer('base_endurance').default(5),
    baseReflex: integer('base_reflex').default(5),
    baseLogic: integer('base_logic').default(5),
    basePsyche: integer('base_psyche').default(5),
    baseAuthority: integer('base_authority').default(5),

    // Resources
    maxHp: integer('max_hp').notNull(),
    maxStamina: integer('max_stamina').notNull(),
    maxMorale: integer('max_morale').notNull(),

    // AI Configuration
    aiBehaviorTreeId: text('ai_behavior_tree_id').references(() => behaviorTrees.id),
    aggroLogic: text('aggro_logic').default('CLOSEST'),

    // Size and Rank
    size: integer('size').default(1),
    preferredRank: integer('preferred_rank').notNull(),

    // Loot and Equipment
    lootTableId: uuid('loot_table_id'),
    defaultWeaponId: uuid('default_weapon_id'),
});


// 2. NPC INSTANCES
export const npcInstances = pgTable('npc_instances', {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id').references(() => npcTemplates.id),
    // NOTE: battles.id is a serial int. We store it as text to avoid UUID mismatches.
    combatSessionId: text('combat_session_id'),

    // Dynamic State
    currentHp: integer('current_hp').notNull(),
    currentStamina: integer('current_stamina').notNull(),
    currentMorale: integer('current_morale').notNull(),

    // Positioning
    currentRank: integer('current_rank').notNull(),
    side: text('side').default('ENEMY'),
    isRooted: boolean('is_rooted').default(false),
    isStunned: boolean('is_stunned').default(false),

    // Status Effects
    statusEffects: jsonb('status_effects').default(sql`'[]'::jsonb`),

    // Equipment State (Entropy)
    weaponCondition: integer('weapon_condition').default(100),
    weaponHeat: integer('weapon_heat').default(0),
    ammoCount: integer('ammo_count').default(10),
});
