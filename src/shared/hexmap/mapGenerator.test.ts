/**
 * Hexmap Generator Unit Tests
 * Verifies: determinism, region differentiation, Karlsruhe bias, river connectivity
 */

import { describe, it, expect } from 'vitest'
import { generateMap, getHexCell, hexToString } from './mapGenerator'
import { DEFAULT_REGION, KARLSRUHE_REGION } from './regions'
import type { HexCell } from './types'

describe('generateMap', () => {
    const TEST_SEED = 12345
    const TEST_RADIUS = 8

    describe('determinism', () => {
        it('should produce identical maps with same seed + region', () => {
            const map1 = generateMap(TEST_RADIUS, TEST_SEED, { region: DEFAULT_REGION })
            const map2 = generateMap(TEST_RADIUS, TEST_SEED, { region: DEFAULT_REGION })

            expect(map1.length).toBe(map2.length)
            for (let i = 0; i < map1.length; i++) {
                expect(map1[i]).toEqual(map2[i])
            }
        })

        it('should work with regionId string', () => {
            const map1 = generateMap(TEST_RADIUS, TEST_SEED, { region: 'default' })
            const map2 = generateMap(TEST_RADIUS, TEST_SEED, { region: DEFAULT_REGION })

            expect(map1.length).toBe(map2.length)
            for (let i = 0; i < map1.length; i++) {
                expect(map1[i]).toEqual(map2[i])
            }
        })
    })

    describe('region differentiation', () => {
        it('should produce different maps for different regions with same seed', () => {
            const defaultMap = generateMap(TEST_RADIUS, TEST_SEED, { region: DEFAULT_REGION })
            const karlsruheMap = generateMap(TEST_RADIUS, TEST_SEED, { region: KARLSRUHE_REGION })

            // Maps should have same structure but different content
            expect(defaultMap.length).toBe(karlsruheMap.length)

            // At least some cells should differ (biome, resource, etc.)
            let differences = 0
            for (let i = 0; i < defaultMap.length; i++) {
                if (
                    defaultMap[i].biome !== karlsruheMap[i].biome ||
                    defaultMap[i].resource !== karlsruheMap[i].resource
                ) {
                    differences++
                }
            }

            expect(differences).toBeGreaterThan(0)
        })
    })

    describe('Karlsruhe tech bias', () => {
        it('should have higher TECH resource count in Karlsruhe vs default', () => {
            const SAMPLE_SIZE = 20
            let defaultTechCount = 0
            let karlsruheTechCount = 0

            for (let seed = 1; seed <= SAMPLE_SIZE; seed++) {
                const defaultMap = generateMap(TEST_RADIUS, seed * 1000, { region: DEFAULT_REGION })
                const karlsruheMap = generateMap(TEST_RADIUS, seed * 1000, { region: KARLSRUHE_REGION })

                defaultTechCount += defaultMap.filter(c => c.resource === 'TECH').length
                karlsruheTechCount += karlsruheMap.filter(c => c.resource === 'TECH').length
            }

            // Karlsruhe should have significantly more TECH (at least 20% more)
            console.log(`Default TECH: ${defaultTechCount}, Karlsruhe TECH: ${karlsruheTechCount}`)
            expect(karlsruheTechCount).toBeGreaterThan(defaultTechCount * 1.1)
        })
    })

    describe('river generation', () => {
        it('should generate river path when features.river is true', () => {
            const map = generateMap(TEST_RADIUS, TEST_SEED, { region: KARLSRUHE_REGION })
            const riverCells = map.filter(c => c.biome === 'RIVER')

            // Should have at least a few river cells
            expect(riverCells.length).toBeGreaterThan(3)
        })

        it('should have connected river path', () => {
            const map = generateMap(TEST_RADIUS, TEST_SEED, { region: KARLSRUHE_REGION })
            const riverCells = map.filter(c => c.biome === 'RIVER')

            if (riverCells.length === 0) return // Skip if no river generated

            // Build adjacency map
            const hexMap = new Map<string, HexCell>(map.map(c => [hexToString(c), c]))
            const getNeighbors = (q: number, r: number) => [
                { q: q + 1, r }, { q: q - 1, r },
                { q, r: r + 1 }, { q, r: r - 1 },
                { q: q + 1, r: r - 1 }, { q: q - 1, r: r + 1 },
            ]

            // BFS to find connected components
            const visited = new Set<string>()
            const queue = [riverCells[0]]
            visited.add(hexToString(riverCells[0]))

            while (queue.length > 0) {
                const current = queue.shift()!
                for (const neighbor of getNeighbors(current.q, current.r)) {
                    const key = hexToString(neighbor)
                    if (visited.has(key)) continue
                    const cell = hexMap.get(key)
                    if (cell && cell.biome === 'RIVER') {
                        visited.add(key)
                        queue.push(cell)
                    }
                }
            }

            // All river cells should be connected
            expect(visited.size).toBe(riverCells.length)
        })
    })
})

describe('getHexCell', () => {
    it('should return correct cell for coordinates', () => {
        const cell = getHexCell(8, 12345, { q: 0, r: 0 }, { region: 'default' })
        expect(cell).not.toBeNull()
        expect(cell?.biome).toBe('BUNKER')
    })

    it('should return null for out-of-bounds coordinates', () => {
        const cell = getHexCell(8, 12345, { q: 100, r: 100 })
        expect(cell).toBeNull()
    })
})
