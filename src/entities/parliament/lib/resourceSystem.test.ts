import { describe, it, expect } from 'vitest'
import { calculateMaxResources, calculateMaxTeamSP } from './statCalculators'
import {
    consumeResource,
    restoreResource,
    handleTurnStart,
    checkLimitBreak,
    migratePlayerResources,
    calculateFocusRestore
} from './resourceManager'
import type { PlayerProgress } from '@/shared/types/player'
import type { CombatantResources } from '@/shared/types/combat'

describe('Resource System', () => {

    describe('calculateMaxResources', () => {
        it('should return base values when skills are empty', () => {
            const stats = calculateMaxResources({})
            expect(stats.hp).toBe(50) // Base 50
            expect(stats.ap).toBe(2)  // Base 2
            expect(stats.mp).toBe(20) // Base 20
            expect(stats.wp).toBe(20) // Base 20
            expect(stats.pp).toBe(100)// Base 100
        })

        it('should clamp AP between 2 and 10', () => {
            // Reaction + Coordination = 400 => AP = 2 + 10 = 12 -> Clamped 10
            const highSkills = { reaction: 200, coordination: 200 }
            expect(calculateMaxResources(highSkills).ap).toBe(10)

            // Reaction + Coordination = 0 => AP = 2 -> Clamped 2 (already min)
            const lowSkills = { reaction: 0, coordination: 0 }
            expect(calculateMaxResources(lowSkills).ap).toBe(2)
        })

        it('should scale HP correctly', () => {
            // Force*0.5 + Resilience*1.0 + Endurance*0.5
            // 10*0.5 + 10*1.0 + 10*0.5 = 5 + 10 + 5 = 20 bonus -> Total 70
            const skills = { force: 10, resilience: 10, endurance: 10 }
            expect(calculateMaxResources(skills).hp).toBe(70)
        })

        it('should floor scaling values', () => {
            // Force 1 => 0.5 -> 0 bonus
            expect(calculateMaxResources({ force: 1 }).hp).toBe(50)
            // Force 2 => 1.0 -> 1 bonus
            expect(calculateMaxResources({ force: 2 }).hp).toBe(51)
        })
    })

    describe('calculateMaxTeamSP', () => {
        it('should sum contributions from squad', () => {
            const member1 = { empathy: 10, solidarity: 10, honor: 10 } // Sum 30 -> 3 SP
            const member2 = { empathy: 5, solidarity: 5, honor: 0 }    // Sum 10 -> 1 SP

            // Total 4
            expect(calculateMaxTeamSP([member1, member2])).toBe(4)
        })

        it('should return minimum 1 even for empty skills', () => {
            expect(calculateMaxTeamSP([{}])).toBe(1)
        })
    })

    describe('resourceManager', () => {
        const baseResources: CombatantResources = {
            hp: 50, maxHp: 50,
            ap: 2, maxAp: 5,
            mp: 20, maxMp: 20,
            wp: 20, maxWp: 20,
            pp: 0, maxPp: 100
        }

        it('consumeResource should subtract and validate min', () => {
            expect(consumeResource(10, 5)).toBe(5)
            expect(() => consumeResource(10, 11)).toThrow('Insufficient resource')
        })

        it('restoreResource should clamp to max', () => {
            expect(restoreResource(10, 5, 20)).toBe(15)
            expect(restoreResource(18, 5, 20)).toBe(20)
        })

        it('handleTurnStart should reset AP to max', () => {
            const next = handleTurnStart({ ...baseResources, ap: 0 })
            expect(next.ap).toBe(5)
        })

        it('checkLimitBreak should trigger at 100 PP', () => {
            expect(checkLimitBreak({ ...baseResources, pp: 99 })).toBe(false)
            expect(checkLimitBreak({ ...baseResources, pp: 100 })).toBe(true)
        })

        it('calculateFocusRestore uses Logic formula', () => {
            // 10 + floor(Logic * 0.2)
            expect(calculateFocusRestore(10)).toBe(12) // 10 + 2
            expect(calculateFocusRestore(0)).toBe(10)
        })
    })

    describe('migratePlayerResources', () => {
        it('should migrate legacy stamina/morale correctly', () => {
            const legacyProgress = {
                level: 1,
                // Old fields (mimicking loosely typed object)
                stamina: 50,
                maxStamina: 100, // 50%
                morale: 20,
                maxMorale: 100,  // 20%

                skills: { force: 10, resilience: 10, endurance: 10 }, // New HP Max = 70
                // New WP Max = 20 (base)

                flags: {},
                inventory: [],
                visitedScenes: [],
                completedQuestIds: [],
                version: 0
            } as any as PlayerProgress

            const migrated = migratePlayerResources(legacyProgress)

            expect(migrated.version).toBe(1)
            // HP: 50% of 70 = 35
            expect(migrated.currentResources?.hp).toBe(35)
            // WP: 20% of 20 = 4
            expect(migrated.currentResources?.wp).toBe(4)
            // MP: Full (20 base)
            expect(migrated.currentResources?.mp).toBe(20)
        })

        it('should handle missing legacy values gracefully', () => {
            const legacyProgress = {
                level: 1,
                skills: {}, // MaxHP 50
                // No stamina/morale fields
                flags: {},
                inventory: [],
                visitedScenes: [],
                completedQuestIds: [],
                version: 0
            } as any as PlayerProgress

            const migrated = migratePlayerResources(legacyProgress)

            // Default 100% of New Max if old unavailable? 
            // Logic: hpPercent = maxStaminaLegacy > 0 ? old / max : 1. 
            // Default maxStaminaLegacy is 100. Default oldStamina is 0.
            // So 0 / 100 = 0%.

            expect(migrated.currentResources?.hp).toBe(0)
        })
    })
})
