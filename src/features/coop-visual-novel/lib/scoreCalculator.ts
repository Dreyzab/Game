import { COOP_STATUSES, ROLE_TAG_MULTS } from '@/shared/data/coopScoreConfig'
import type { CoopQuestChoice, CoopRoleId } from '@/shared/types/coop'

export type CoopScoreModifiers = Record<string, number>
export type CoopStatusTurns = Record<string, number>

export function computeClassMult(choice: CoopQuestChoice, role?: CoopRoleId): number {
  if (!role) return 1.0

  const override = choice?.classMultipliers?.[role]
  if (typeof override === 'number' && Number.isFinite(override)) return override

  let tagMax: number | null = null
  const tags = Array.isArray(choice?.scoreTags) ? choice.scoreTags : []
  const roleTable = (ROLE_TAG_MULTS as Record<string, Record<string, number>>)[role]

  if (roleTable) {
    for (const tag of tags) {
      const mult = roleTable?.[tag]
      if (typeof mult === 'number' && Number.isFinite(mult)) {
        tagMax = tagMax === null ? mult : Math.max(tagMax, mult)
      }
    }
  }

  const resolved = tagMax ?? 1.0
  if (choice?.requiredRole && choice.requiredRole === role) return Math.max(1.5, resolved)
  return resolved
}

export function computeBuffMult(mods: CoopScoreModifiers, tags?: string[]): number {
  const tagSet = new Set((tags ?? []).filter((t) => typeof t === 'string' && t.length > 0))
  let mult = 1.0

  for (const [id, raw] of Object.entries(mods)) {
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0
    if (id.startsWith('tag:')) {
      const tag = id.slice('tag:'.length)
      if (!tagSet.has(tag)) continue
    }
    mult *= value
  }

  return mult
}

export function mergeStatusTurns(base: CoopStatusTurns, extra: CoopStatusTurns): CoopStatusTurns {
  const out: CoopStatusTurns = { ...(base ?? {}) }
  for (const [statusId, rawTurns] of Object.entries(extra ?? {})) {
    const turns = Math.max(0, Math.floor(Number(rawTurns)))
    if (!statusId || !Number.isFinite(turns) || turns <= 0) continue
    out[statusId] = Math.max(out[statusId] ?? 0, turns)
  }
  return out
}

export function computeStatusMult(statusTurns: CoopStatusTurns, tags?: string[]): number {
  const tagSet = new Set((tags ?? []).filter((t) => typeof t === 'string' && t.length > 0))
  let mult = 1.0

  for (const [statusId, rawTurns] of Object.entries(statusTurns)) {
    const turns = Math.max(0, Math.floor(Number(rawTurns)))
    if (!statusId || !Number.isFinite(turns) || turns <= 0) continue

    const def = (COOP_STATUSES as Record<string, { mods?: Record<string, number> }>)[statusId]
    const mods = def?.mods
    if (!mods) continue

    for (const [id, raw] of Object.entries(mods)) {
      const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0
      if (id.startsWith('tag:')) {
        const tag = id.slice('tag:'.length)
        if (!tagSet.has(tag)) continue
      }
      mult *= value
    }
  }

  return mult
}

export interface ScoreParams {
  choice: CoopQuestChoice
  role?: CoopRoleId
  modifiers?: CoopScoreModifiers
  playerModifiers?: CoopScoreModifiers
  statuses?: CoopStatusTurns
  playerStatuses?: CoopStatusTurns
  inventory?: Record<string, number>
}

export interface EstimatedScore {
  baseScore: number
  itemBonus: number
  classMult: number
  buffMult: number
  statusMult: number
  estimated: number
  mergedStatuses: CoopStatusTurns
  appliedGlobalMods: Array<[string, number]>
  appliedPlayerMods: Array<[string, number]>
  appliedStatuses: Array<{ statusId: string; turns: number }>
}

export function computeEstimatedScore(params: ScoreParams): EstimatedScore {
  const modifiers = params.modifiers ?? {}
  const playerModifiers = params.playerModifiers ?? {}
  const globalStatuses = params.statuses ?? {}
  const playerStatuses = params.playerStatuses ?? {}
  const inventory = params.inventory ?? {}

  const choice = params.choice
  const tags = Array.isArray(choice?.scoreTags) ? choice.scoreTags : []

  const baseScore =
    typeof choice?.baseScore === 'number' && Number.isFinite(choice.baseScore) ? choice.baseScore : 0

  const classMult = computeClassMult(choice, params.role)
  const buffMult = computeBuffMult(modifiers, tags) * computeBuffMult(playerModifiers, tags)

  const mergedStatuses = mergeStatusTurns(globalStatuses, playerStatuses)
  const statusMult = computeStatusMult(mergedStatuses, tags)

  let itemBonus = 0
  if (choice?.consumableCost && typeof choice.itemBonus === 'number' && Number.isFinite(choice.itemBonus)) {
    const templateId = String(choice.consumableCost.templateId ?? '')
    const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)))
    const have = Number(inventory?.[templateId] ?? 0)
    if (have >= amount) itemBonus = choice.itemBonus
  }

  const estimated =
    baseScore || itemBonus ? Math.round(baseScore * classMult * buffMult * statusMult + itemBonus) : 0

  const appliedGlobalMods = Object.entries(modifiers)
    .filter(([id]) => {
      if (!id.startsWith('tag:')) return true
      const tag = id.slice('tag:'.length)
      return tags.includes(tag)
    })
    .map(([id, raw]) => [id, typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0] as [string, number])

  const appliedPlayerMods = Object.entries(playerModifiers)
    .filter(([id]) => {
      if (!id.startsWith('tag:')) return true
      const tag = id.slice('tag:'.length)
      return tags.includes(tag)
    })
    .map(([id, raw]) => [id, typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0] as [string, number])

  const appliedStatuses = Object.entries(mergedStatuses)
    .filter(([statusId, rawTurns]) => {
      const turns = Math.max(0, Math.floor(Number(rawTurns)))
      if (!statusId || !Number.isFinite(turns) || turns <= 0) return false

      const def = (COOP_STATUSES as Record<string, { mods?: Record<string, number> }>)[statusId]
      const mods = def?.mods
      if (!mods) return true
      for (const modId of Object.keys(mods)) {
        if (!modId.startsWith('tag:')) return true
        const tag = modId.slice('tag:'.length)
        if (tags.includes(tag)) return true
      }
      return false
    })
    .map(([statusId, turns]) => ({ statusId, turns: Math.max(0, Math.floor(Number(turns))) }))

  return {
    baseScore,
    itemBonus,
    classMult,
    buffMult,
    statusMult,
    estimated,
    mergedStatuses,
    appliedGlobalMods,
    appliedPlayerMods,
    appliedStatuses,
  }
}
