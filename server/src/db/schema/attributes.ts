import { pgTable, text, integer, uuid } from 'drizzle-orm/pg-core';

// 24 Voices (Attributes)
export const voiceAttributes = pgTable('voice_attributes', {
    id: uuid('id').defaultRandom().primaryKey(),
    playerId: integer('player_id').notNull(), // Matching players.id type (integer)

    // I: SOMATIC
    voiceMight: integer('voice_might').default(0),
    voicePainThreshold: integer('voice_pain_threshold').default(0),
    voiceEndurance: integer('voice_endurance').default(0),
    voicePhysicalInstrument: integer('voice_physical_instrument').default(0),
    voiceElectrochemistry: integer('voice_electrochemistry').default(0),
    voiceShivers: integer('voice_shivers').default(0),

    // II: MOTORICS
    voiceCoordination: integer('voice_coordination').default(0),
    voiceReflexes: integer('voice_reflexes').default(0),
    voiceSavoirFaire: integer('voice_savoir_faire').default(0),
    voicePerception: integer('voice_perception').default(0),
    voiceSpeed: integer('voice_speed').default(0), // Custom?
    voiceComposure: integer('voice_composure').default(0),

    // III: PSYCHE
    voiceAuthority: integer('voice_authority').default(0),
    voiceInlandEmpire: integer('voice_inland_empire').default(0),
    voiceEmpathy: integer('voice_empathy').default(0),
    voiceEspritDeCorps: integer('voice_esprit_de_corps').default(0),
    voiceVolition: integer('voice_volition').default(0),
    voiceCope: integer('voice_cope').default(0), // Custom?

    // IV: INTELLECT
    voiceLogic: integer('voice_logic').default(0),
    voiceRhetoric: integer('voice_rhetoric').default(0),
    voiceDrama: integer('voice_drama').default(0),
    voiceEncyclopedia: integer('voice_encyclopedia').default(0),
    voiceVisualCalculus: integer('voice_visual_calculus').default(0),
    voiceConceptualization: integer('voice_conceptualization').default(0),
});

// Card Synthesis Rules
export const cardSynthesisRules = pgTable('card_synthesis_rules', {
    id: uuid('id').defaultRandom().primaryKey(),
    voiceName: text('voice_name').notNull(),
    weaponType: text('weapon_type').notNull(),

    // Modifiers
    damageMultiplier: integer('damage_multiplier').default(100),
    addedEffect: text('added_effect'),
    addedTag: text('added_tag'),
    apCostModifier: integer('ap_cost_modifier').default(0),
});
