import { Side } from '../model/types'
import type { Combatant } from '../model/types'
import { createPlayer, createNPC, finalizeSession } from '../model/scenarios'


// --- Factories ---

function createTutorialScout(id: string, rank: number, initiativeBonus: number = 0): Combatant {
    return {
        id,
        name: 'Biomorph Scout',
        side: Side.ENEMY,
        rank,
        resources: {
            hp: 25, maxHp: 25,
            ap: 1, maxAp: 1,
            mp: 0, maxMp: 0,
            stamina: 90, maxStamina: 90,
            stagger: 0, maxStagger: 60,
            pp: 0, maxPp: 100
        },
        equipment: [],
        bonusAp: 0,
        initiative: 10 + initiativeBonus,
        armor: 1,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 0,
        voices: {
            coordination: 10,
            force: 10,
            reaction: 15, // Fast
            perception: 15,
            endurance: 10,
            resilience: 5,
            knowledge: 0,
            azart: 10
        }
    }
}

// ... existing factories ...

// Tutorial 2: Two Scouts (Aggressive - Enemy First)
export const tutorial_scouts_duo_aggro = (config: { playerEquipment?: string[] } | undefined) => {
    const players = [
        createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'player_knife']),
        createNPC('npc_lena', 'Lena Richter', 2, ['scalpel', 'knife', 'field_medkit']),
    ]

    const enemies = [
        createTutorialScout('scout_1', 1, 20), // High initiative bonus to ensure they go first
        createTutorialScout('scout_2', 1, 15),
    ]

    return finalizeSession(players, enemies)
}

// Tutorial 3: Two Scouts (Surprise - Player First)
export const tutorial_scouts_duo_surprise = (config: { playerEquipment?: string[] } | undefined) => {
    const players = [
        createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'player_knife']),
        createNPC('npc_lena', 'Lena Richter', 2, ['scalpel', 'knife', 'field_medkit']),
    ]

    const enemies = [
        createTutorialScout('scout_1', 1, -10), // Penalty to initiative
        createTutorialScout('scout_2', 1, -10),
    ]

    // Bonus AP for player in surprise round? Or just initiative.
    // For now, standard initialization, rely on initiative.

    return finalizeSession(players, enemies)
}


function createTutorialScavenger(id: string, rank: number): Combatant {
    return {
        id,
        name: 'Weakened Scavenger', // Narrative: "Starving Scavenger"
        side: Side.ENEMY,
        rank,
        resources: {
            hp: 20, maxHp: 20, // Reduced from 45 
            ap: 1, maxAp: 1,
            mp: 0, maxMp: 0,
            stamina: 80, maxStamina: 80,
            stagger: 0, maxStagger: 50, // Easier to stagger 
            pp: 0, maxPp: 100
        },
        equipment: [],
        bonusAp: 0,
        initiative: 5, // Slower
        armor: 1, // Reduced Armor
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 0,
        voices: {
            coordination: 5,
            force: 10,
            reaction: 10,
            perception: 5,
            endurance: 10,
            resilience: 5,
            knowledge: 0,
            azart: 5
        }
    }
}

function createExecutionerBoss(id: string): Combatant {
    return {
        id,
        name: 'The Executioner',
        side: Side.ENEMY,
        rank: 1,
        resources: {
            hp: 250, maxHp: 250, // Reduced from 300
            ap: 2, maxAp: 2,
            mp: 0, maxMp: 0,
            stamina: 100, maxStamina: 100,
            stagger: 0, maxStagger: 200, // Hard to stagger
            pp: 0, maxPp: 100
        },
        equipment: [],
        bonusAp: 0,
        initiative: 10, // Reduced from 20 (Easier for Conductor to hit)
        armor: 4, // Slightly reduced from 5
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 0,
        voices: {
            coordination: 20,
            force: 30,
            reaction: 15,
            perception: 10,
            endurance: 40,
            resilience: 20,
            knowledge: 10,
            azart: 0
        }
    }
}

// --- Scenarios ---

// Tutorial 1: Player + Lena + Conductor vs Starving Scavengers
export const prologue_tutorial_1 = (config: { playerEquipment?: string[] } | undefined) => {
    const players = [
        createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'knife']),
        createNPC('npc_lena', 'Lena Richter', 2, ['scalpel', 'pistol_pm', 'knife']),
        createNPC('npc_cond', 'Conductor', 3, ['rifle_ak74_scoped']),
    ]

    const enemies = [
        createTutorialScavenger('e1', 1),
        createTutorialScavenger('e2', 1),
        createTutorialScavenger('e3', 2), // Rank 2
    ]

    return finalizeSession(players, enemies)
}

// Boss Fight: 4 vs Executioner (Original simplified version)
export const boss_train_prologue = (config: { playerEquipment?: string[] } | undefined) => {
    const players = [
        createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'player_knife']),
        createNPC('npc_lena', 'Lena Richter', 2, ['scalpel', 'knife', 'field_medkit']),
        createNPC('npc_otto', 'Otto Klein', 3, ['knife', 'grenade']),
        createNPC('npc_cond', 'Conductor', 4, ['rifle_ak74_scoped']), // Narrative: Will die
    ]

    const enemies = [
        createExecutionerBoss('boss')
    ]

    return finalizeSession(players, enemies)
}

// Stage 4 Boss: Augmented Executioner with Allies/Support logic
export const boss_executioner_prologue = (config: { playerEquipment?: string[] } | undefined) => {
    const players = [
        createPlayer('p1', 'Player', 1, config?.playerEquipment ?? ['glock_19', 'player_knife']),
        createNPC('npc_otto', 'Otto Klein', 2, ['knife', 'beretta_m9']),
        createNPC('npc_cond', 'Conductor', 3, ['revolver_38']),
    ]

    // Lena and Bruno are "support" in dialogue, but for combat mechanics 
    // we might just add HP/Buffs or keep them aside if the system doesn't support passive NPCs yet.
    // For now, we follow the user's "allies" list.

    const enemies = [
        createExecutionerBoss('boss_executioner')
    ]

    // Tune boss for this specific encounter if needed
    enemies[0].resources.hp = 250;
    enemies[0].resources.maxHp = 250;
    enemies[0].voices.reaction = 10; // Reduced evasion

    return finalizeSession(players, enemies)
}
