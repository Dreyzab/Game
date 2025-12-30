import { describe, expect, test } from 'bun:test'
import {
  calculateContributionScore,
  computeAutoStagesFromGraph,
  computeBuffMultiplier,
  computeStatusMultiplier,
  computeTargetTotal,
  getClassMultiplier,
  tryConsumeInventory,
} from '../../src/lib/coopScore'

describe('coopScore', () => {
  test('computeTargetTotal scales by stages and players', () => {
    expect(
      computeTargetTotal({ baseStageAvg: 10, stages: 3, players: 4, difficultyFactor: 1.0 })
    ).toBe(120)
  })

  test('calculateContributionScore applies formula', () => {
    const res = calculateContributionScore({
      baseScore: 10,
      classMult: 1.5,
      buffMult: 0.8,
      artifactBonus: 5,
    })
    expect(res.finalScore).toBe(17)
  })

  test('computeBuffMultiplier supports global and tag modifiers', () => {
    expect(computeBuffMultiplier({ focus: 1.2, 'tag:visual': 0.5 }, ['visual'])).toBeCloseTo(0.6)
    expect(computeBuffMultiplier({ focus: 1.2, 'tag:visual': 0.5 }, ['logic'])).toBeCloseTo(1.2)
  })

  test('getClassMultiplier uses overrides and role-locked fallback', () => {
    expect(getClassMultiplier({ id: 'x', text: 'x', classMultipliers: { vorschlag: 1.5 } }, 'vorschlag')).toBe(1.5)
    expect(getClassMultiplier({ id: 'x', text: 'x', requiredRole: 'ghost' }, 'ghost')).toBe(1.5)
    expect(getClassMultiplier({ id: 'x', text: 'x' }, 'ghost')).toBe(1.0)
  })

  test('getClassMultiplier falls back to tag-based multipliers', () => {
    expect(getClassMultiplier({ id: 'x', text: 'x', scoreTags: ['tech'] }, 'vorschlag')).toBe(1.5)
    expect(getClassMultiplier({ id: 'x', text: 'x', scoreTags: ['tech'] }, 'ghost')).toBe(0.8)
    expect(getClassMultiplier({ id: 'x', text: 'x', scoreTags: ['tech'] }, 'shustrya')).toBe(0.5)
  })

  test('computeStatusMultiplier applies status entity mods by tag', () => {
    expect(computeStatusMultiplier({ dust_cloud: 2 }, ['visual'])).toBeCloseTo(0.8)
    expect(computeStatusMultiplier({ dust_cloud: 2 }, ['logic'])).toBeCloseTo(1.0)
    expect(computeStatusMultiplier({ blind: 1 }, ['visual'])).toBeCloseTo(0.0)
  })

  test('computeAutoStagesFromGraph counts reachable scored nodes', () => {
    const nodes: Record<string, any> = {
      a: {
        id: 'a',
        title: '',
        description: '',
        interactionType: 'sync',
        choices: [{ id: 'c1', text: 'go', nextNodeId: 'b', baseScore: 10 }],
      },
      b: {
        id: 'b',
        title: '',
        description: '',
        interactionType: 'sync',
        choices: [{ id: 'c2', text: 'go', nextNodeId: 'c', baseScore: 0 }],
      },
      c: {
        id: 'c',
        title: '',
        description: '',
        interactionType: 'sync',
        choices: [{ id: 'c3', text: 'end', action: 'return', baseScore: 5 }],
      },
    }

    expect(
      computeAutoStagesFromGraph({
        entryNodeId: 'a',
        getNode: (id) => nodes[id],
        getGraphId: () => 'sidequests',
      })
    ).toBe(2)
  })

  test('tryConsumeInventory decrements and deletes empty stacks', () => {
    const inv: Record<string, number> = { pills: 2 }

    expect(tryConsumeInventory(inv, 'pills', 1)).toBe(true)
    expect(inv.pills).toBe(1)

    expect(tryConsumeInventory(inv, 'pills', 1)).toBe(true)
    expect('pills' in inv).toBe(false)

    expect(tryConsumeInventory(inv, 'pills', 1)).toBe(false)
  })
})
