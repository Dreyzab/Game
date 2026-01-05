import { describe, it, expect } from 'vitest'
import { calculateJamChance } from './combat'

describe('calculateJamChance', () => {
    it('should return 0 for perfect condition and no heat', () => {
        const chance = calculateJamChance(100, 0, 0)
        expect(chance).toBe(0)
    })

    it('should increase chance as condition decreases', () => {
        // (100 - 50) * 0.2 = 10
        const chance = calculateJamChance(50, 0, 0)
        expect(chance).toBe(10)
    })

    it('should increase chance as heat increases', () => {
        // (100 - 100) * 0.2 + (50 * 0.1) = 5
        const chance = calculateJamChance(100, 50, 0)
        expect(chance).toBe(5)
    })

    it('should decrease chance with knowledge skill', () => {
        // (100 - 50) * 0.2 + (50 * 0.1) - (10 * 0.5) = 10 + 5 - 5 = 10
        const chance = calculateJamChance(50, 50, 10)
        expect(chance).toBe(10)
    })

    it('should cap chance at 100', () => {
        const chance = calculateJamChance(0, 1000, 0)
        expect(chance).toBe(100)
    })

    it('should cap chance at 0', () => {
        const chance = calculateJamChance(100, 0, 100)
        expect(chance).toBe(0)
    })

    it('should handle complex scenario', () => {
        // Condition 70, Heat 80, Knowledge 5
        // (100 - 70) * 0.2 + (80 * 0.1) - (5 * 0.5)
        // 30 * 0.2 + 8 - 2.5
        // 6 + 8 - 2.5 = 11.5
        const chance = calculateJamChance(70, 80, 5)
        expect(chance).toBe(11.5)
    })
})
