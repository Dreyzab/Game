import type { CoopQuestChoice, CoopQuestNode, CoopRoleId } from '../shared/types/coop'
import { COOP_STATUSES, ROLE_TAG_MULTS } from '../shared/coopScoreConfig'

export interface CoopSideQuestMeta {
  stages: number
  baseStageAvg?: number
  difficultyFactor?: number
}

export const DEFAULT_BASE_STAGE_AVG = 10
export const DEFAULT_DIFFICULTY_FACTOR = 1.0

/**
 * Tunable per-side-quest metadata for target scaling.
 * Keep conservative defaults so old content remains playable.
 */
export const COOP_SIDE_QUEST_META: Record<string, CoopSideQuestMeta> = {
  fog_song: { stages: 2 },
  drone_shards: { stages: 1 },
  catacombs_shadows: { stages: 1, difficultyFactor: 1.1 },
  mushroom_threat: { stages: 1, difficultyFactor: 1.05 },
  forgotten_bunker: { stages: 1, difficultyFactor: 1.15 },
  signal_cache: { stages: 1 },
}

export function getSideQuestMeta(questId: string | undefined): CoopSideQuestMeta {
  if (!questId) return { stages: 3 }
  return COOP_SIDE_QUEST_META[questId] ?? { stages: 3 }
}

export function computeTargetTotal(params: {
  baseStageAvg?: number
  stages: number
  players: number
  difficultyFactor?: number
}): number {
  const baseStageAvg =
    typeof params.baseStageAvg === 'number' && Number.isFinite(params.baseStageAvg)
      ? params.baseStageAvg
      : DEFAULT_BASE_STAGE_AVG

  const difficultyFactor =
    typeof params.difficultyFactor === 'number' && Number.isFinite(params.difficultyFactor)
      ? params.difficultyFactor
      : DEFAULT_DIFFICULTY_FACTOR

  const stages = Math.max(1, Math.floor(params.stages))
  const players = Math.max(1, Math.floor(params.players))

  return Math.round(baseStageAvg * stages * players * difficultyFactor)
}

export function computeAutoStagesFromGraph(params: {
  entryNodeId: string
  getNode: (nodeId: string) => CoopQuestNode | undefined
  getGraphId?: (nodeId: string) => string | undefined
}): number {
  const entryNodeId = params.entryNodeId
  if (!entryNodeId) return 1

  const startGraphId = params.getGraphId?.(entryNodeId)
  const visited = new Set<string>()
  const queue: string[] = [entryNodeId]

  let stages = 0

  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (!nodeId) continue
    if (visited.has(nodeId)) continue
    visited.add(nodeId)

    if (startGraphId && params.getGraphId && params.getGraphId(nodeId) !== startGraphId) {
      continue
    }

    const node = params.getNode(nodeId)
    if (!node) continue

    const isStageNode = (node.choices ?? []).some((c) => {
      const base = typeof c.baseScore === 'number' && Number.isFinite(c.baseScore) ? c.baseScore : 0
      return base > 0
    })
    if (isStageNode) stages += 1

    for (const choice of node.choices ?? []) {
      const action = (choice as any).action as string | undefined
      if (action === 'return') continue
      const next = (choice as any).nextNodeId as string | undefined
      if (!next || visited.has(next)) continue
      if (startGraphId && params.getGraphId && params.getGraphId(next) !== startGraphId) continue
      queue.push(next)
    }
  }

  return Math.max(1, stages)
}

export interface CoopScoreBreakdown {
  baseScore: number
  classMult: number
  buffMult: number
  statusMult: number
  itemBonus: number
  artifactBonus: number
  finalScore: number
}

export function getClassMultiplier(choice: CoopQuestChoice, role?: CoopRoleId | null): number {
  if (!role) return 1.0
  const override = choice.classMultipliers?.[role]
  if (typeof override === 'number' && Number.isFinite(override)) return override

  let tagMax: number | null = null
  const tags = Array.isArray(choice.scoreTags) ? choice.scoreTags : []
  const roleTable = (ROLE_TAG_MULTS as any)?.[role] as Record<string, number> | undefined
  if (roleTable) {
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.length === 0) continue
      const mult = roleTable[tag]
      if (typeof mult === 'number' && Number.isFinite(mult)) {
        tagMax = tagMax === null ? mult : Math.max(tagMax, mult)
      }
    }
  }

  // If the choice is role-locked, treat it as a primary-role action (at least).
  const resolved = tagMax ?? 1.0
  if (choice.requiredRole && choice.requiredRole === role) return Math.max(1.5, resolved)
  return resolved
}

/**
 * Score modifiers are stored as multipliers.
 * Convention:
 * - `foo`: global multiplier (applies to all actions)
 * - `tag:visual`: applies only if `choiceTags` contains "visual"
 */
export function computeBuffMultiplier(
  modifiers: Record<string, number> | undefined,
  choiceTags: string[] | undefined
): number {
  if (!modifiers) return 1.0

  const tags = new Set((choiceTags ?? []).filter((t) => typeof t === 'string' && t.length > 0))
  let mult = 1.0

  for (const [id, raw] of Object.entries(modifiers)) {
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0
    if (id.startsWith('tag:')) {
      const tag = id.slice('tag:'.length)
      if (!tags.has(tag)) continue
    }
    mult *= value
  }

  return mult
}

export function computeStatusMultiplier(
  statusTurns: Record<string, number> | undefined,
  choiceTags: string[] | undefined
): number {
  if (!statusTurns) return 1.0

  const tags = new Set((choiceTags ?? []).filter((t) => typeof t === 'string' && t.length > 0))
  let mult = 1.0

  for (const [statusId, rawTurns] of Object.entries(statusTurns)) {
    const turns = typeof rawTurns === 'number' && Number.isFinite(rawTurns) ? rawTurns : 0
    if (turns <= 0) continue

    const def = (COOP_STATUSES as any)?.[statusId] as { mods?: Record<string, number> } | undefined
    const mods = def?.mods
    if (!mods) continue

    for (const [id, raw] of Object.entries(mods)) {
      const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0
      if (id.startsWith('tag:')) {
        const tag = id.slice('tag:'.length)
        if (!tags.has(tag)) continue
      }
      mult *= value
    }
  }

  return mult
}

export function calculateContributionScore(params: {
  baseScore: number
  classMult?: number
  buffMult?: number
  statusMult?: number
  itemBonus?: number
  artifactBonus?: number
}): CoopScoreBreakdown {
  const baseScore =
    typeof params.baseScore === 'number' && Number.isFinite(params.baseScore)
      ? params.baseScore
      : 0

  const classMult =
    typeof params.classMult === 'number' && Number.isFinite(params.classMult)
      ? params.classMult
      : 1.0

  const buffMult =
    typeof params.buffMult === 'number' && Number.isFinite(params.buffMult)
      ? params.buffMult
      : 1.0

  const statusMult =
    typeof params.statusMult === 'number' && Number.isFinite(params.statusMult)
      ? params.statusMult
      : 1.0

  const itemBonus =
    typeof params.itemBonus === 'number' && Number.isFinite(params.itemBonus)
      ? params.itemBonus
      : 0

  const artifactBonus =
    typeof params.artifactBonus === 'number' && Number.isFinite(params.artifactBonus)
      ? params.artifactBonus
      : 0

  const finalScore = Math.round(baseScore * classMult * buffMult * statusMult + itemBonus + artifactBonus)

  return {
    baseScore,
    classMult,
    buffMult,
    statusMult,
    itemBonus,
    artifactBonus,
    finalScore,
  }
}

export function tryConsumeInventory(
  inventory: Record<string, number>,
  templateId: string,
  amount: number
): boolean {
  if (!inventory || typeof inventory !== 'object') return false
  if (!templateId) return false
  const need = Math.max(1, Math.floor(amount))
  const have = typeof inventory[templateId] === 'number' ? inventory[templateId] : 0
  if (!Number.isFinite(have) || have < need) return false

  const next = have - need
  if (next > 0) inventory[templateId] = next
  else delete inventory[templateId]
  return true
}
