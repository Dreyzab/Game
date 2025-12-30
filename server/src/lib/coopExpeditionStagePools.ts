import type { CoopExpeditionDeadlineEvent } from '../shared/types/coop'

export type CoopExpeditionStagePoolId = 'rift'

export type CoopExpeditionMissionKind = 'sidequest' | 'node'

export interface CoopExpeditionMissionTemplateBase {
  id: string
  title: string
  weight?: number
  timeCost?: number
  baseThreat?: number
}

export interface CoopExpeditionSideQuestTemplate extends CoopExpeditionMissionTemplateBase {
  kind: 'sidequest'
  questId: string
  entryNodeId: string
}

export interface CoopExpeditionNodeTemplate extends CoopExpeditionMissionTemplateBase {
  kind: 'node'
  nodeId: string
}

export type CoopExpeditionMissionTemplate = CoopExpeditionSideQuestTemplate | CoopExpeditionNodeTemplate

export interface CoopExpeditionMissionModifier {
  id: string
  label: string
  weight?: number
  scoreModifiers?: Record<string, number>
  applyStatuses?: Record<string, number>
}

export interface CoopExpeditionStageDefinition {
  id: string
  /** Which node presents the stage missions (usually a hub). */
  hubNodeId: string
  /** Choice ids (slots) in the hub node that represent missions. */
  missionChoiceIds: string[]
  /** How many random missions to generate for this stage (unique missions fill first). */
  randomMissionCount: number
  /** Pre-authored, stage-specific missions (usually unique side quests). */
  uniqueMissions?: CoopExpeditionMissionTemplate[]
  /** Random mission pool for this stage. */
  randomMissions: CoopExpeditionMissionTemplate[]
  /** Deadline event pool (timer expiry) for this stage. */
  deadlineEvents?: CoopExpeditionDeadlineEvent[]
  /** Threat range for generated missions. */
  threatRange?: { min: number; max: number }
  /** Stage modifier pool; each mission gets one modifier. */
  modifiers?: CoopExpeditionMissionModifier[]
}

export interface CoopExpeditionStagePool {
  id: CoopExpeditionStagePoolId
  stages: CoopExpeditionStageDefinition[]
  defaultThreatRange: { min: number; max: number }
  defaultModifiers: CoopExpeditionMissionModifier[]
}

export interface CoopGeneratedMissionInstance {
  kind: CoopExpeditionMissionKind
  title: string
  timeCost: number
  threatLevel: number
  modifierId: string
  modifierLabel: string
  isUnique?: boolean
  questId?: string
  entryNodeId?: string
  nodeId?: string
  scoreModifiers?: Record<string, number>
  applyStatuses?: Record<string, number>
}

export interface CoopGeneratedStageState {
  poolId: CoopExpeditionStagePoolId
  stageIndex: number
  stageId: string
  hubNodeId: string
  missionsByChoiceId: Record<string, CoopGeneratedMissionInstance>
  deadlineEvents: CoopExpeditionDeadlineEvent[]
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : Number(value)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function pickWeighted<T extends { weight?: number }>(items: readonly T[]): T | null {
  if (!items || items.length === 0) return null
  const weighted = items
    .map((item) => {
      const wRaw = typeof item.weight === 'number' && Number.isFinite(item.weight) ? item.weight : 1
      const weight = wRaw > 0 ? wRaw : 1
      return { item, weight }
    })
    .filter((x) => x.weight > 0)

  const total = weighted.reduce((sum, x) => sum + x.weight, 0)
  if (total <= 0) return null

  const r = Math.random() * total
  let acc = 0
  for (const x of weighted) {
    acc += x.weight
    if (r <= acc) return x.item
  }
  return weighted[weighted.length - 1]?.item ?? null
}

function pickThreat(params: { template?: CoopExpeditionMissionTemplate; range: { min: number; max: number } }): number {
  const min = Math.max(1, Math.floor(params.range.min))
  const max = Math.max(min, Math.floor(params.range.max))

  const base = params.template?.baseThreat
  if (typeof base === 'number' && Number.isFinite(base) && base > 0) {
    return clampInt(base, min, max)
  }

  const roll = Math.floor(Math.random() * (max - min + 1)) + min
  return clampInt(roll, min, max)
}

function makeDisplayTitle(params: { title: string; threatLevel: number; modifierLabel: string }): string {
  const threat = Math.max(1, Math.floor(params.threatLevel))
  const mod = params.modifierLabel ? params.modifierLabel.trim() : ''
  return mod ? `[T${threat}] ${params.title} — ${mod}` : `[T${threat}] ${params.title}`
}

export const COOP_EXPEDITION_STAGE_POOLS: Record<CoopExpeditionStagePoolId, CoopExpeditionStagePool> = {
  rift: {
    id: 'rift',
    defaultThreatRange: { min: 1, max: 3 },
    defaultModifiers: [
      { id: 'nightfall', label: 'Nightfall', weight: 1, scoreModifiers: { 'tag:visual': 0.8, 'tag:perception': 0.9 } },
      { id: 'toxic_mist', label: 'Toxic Mist', weight: 1, scoreModifiers: { 'tag:combat': 0.9, 'tag:reaction': 0.9 } },
      { id: 'static_noise', label: 'Static Noise', weight: 1, scoreModifiers: { 'tag:tech': 0.9, 'tag:analysis': 0.9 } },
    ],
    stages: [
      {
        id: 'rift_stage_1',
        hubNodeId: 'rift_clearing_hub',
        missionChoiceIds: ['hub_explore', 'hub_flora'],
        randomMissionCount: 1,
        uniqueMissions: [
          {
            id: 'unique_drone_shards',
            kind: 'sidequest',
            questId: 'drone_shards',
            entryNodeId: 'sq_drone_shards_start',
            title: 'Recover drone shards',
            baseThreat: 2,
            timeCost: 1,
          },
        ],
        randomMissions: [
          { id: 'random_flora', kind: 'node', nodeId: 'rift_flora_cut', title: 'Inspect alien flora', weight: 1, timeCost: 1 },
          {
            id: 'random_fog_song',
            kind: 'sidequest',
            questId: 'fog_song',
            entryNodeId: 'sq_fog_song_start',
            title: 'Follow the fog song',
            weight: 1,
            timeCost: 1,
          },
          {
            id: 'random_signal_cache',
            kind: 'sidequest',
            questId: 'signal_cache',
            entryNodeId: 'sq_signal_cache_start',
            title: 'Signal cache',
            weight: 1,
            timeCost: 1,
          },
        ],
        deadlineEvents: [
          { nodeId: 'rift_wave_1', kind: 'enemy', weight: 1 },
          { nodeId: 'rift_psi_wave_1', kind: 'check', weight: 1 },
        ],
        threatRange: { min: 1, max: 2 },
      },
      {
        id: 'rift_stage_2',
        hubNodeId: 'rift_clearing_hub',
        missionChoiceIds: ['hub_explore', 'hub_flora'],
        randomMissionCount: 2,
        uniqueMissions: [
          {
            id: 'unique_catacombs',
            kind: 'sidequest',
            questId: 'catacombs_shadows',
            entryNodeId: 'sq_catacombs_start',
            title: 'Catacombs shadows',
            baseThreat: 3,
            timeCost: 1,
          },
        ],
        randomMissions: [
          {
            id: 'random_mushroom_threat',
            kind: 'sidequest',
            questId: 'mushroom_threat',
            entryNodeId: 'sq_mushroom_threat_start',
            title: 'Mushroom threat',
            weight: 1,
            timeCost: 1,
          },
          {
            id: 'random_forgotten_bunker',
            kind: 'sidequest',
            questId: 'forgotten_bunker',
            entryNodeId: 'sq_forgotten_bunker_start',
            title: 'Forgotten bunker',
            weight: 1,
            timeCost: 1,
          },
          { id: 'random_flora', kind: 'node', nodeId: 'rift_flora_cut', title: 'Inspect alien flora', weight: 1, timeCost: 1 },
        ],
        deadlineEvents: [
          { nodeId: 'rift_wave_1', kind: 'enemy', weight: 2 },
          { nodeId: 'rift_psi_wave_1', kind: 'check', weight: 1 },
        ],
        threatRange: { min: 2, max: 3 },
        modifiers: [
          { id: 'nightfall', label: 'Nightfall', weight: 1, scoreModifiers: { 'tag:visual': 0.75, 'tag:perception': 0.85 } },
          { id: 'scanner_glitch', label: 'Scanner Glitch', weight: 1, applyStatuses: { scanner_overload: 1 } },
          { id: 'adrenaline_spike', label: 'Adrenaline Spike', weight: 1, applyStatuses: { adrenaline: 1 } },
        ],
      },
    ],
  },
}

export function getExpeditionStagePool(poolId: string | undefined): CoopExpeditionStagePool | null {
  if (!poolId) return null
  const key = poolId as CoopExpeditionStagePoolId
  return COOP_EXPEDITION_STAGE_POOLS[key] ?? null
}

export function generateExpeditionStageState(params: {
  poolId: CoopExpeditionStagePoolId
  stageIndex: number
  takenQuestIds: Set<string>
}): CoopGeneratedStageState {
  const pool = COOP_EXPEDITION_STAGE_POOLS[params.poolId]
  const safeStageIndex = Math.max(0, Math.floor(params.stageIndex))
  const stage = pool.stages[Math.min(safeStageIndex, pool.stages.length - 1)]

  const threatRange = stage.threatRange ?? pool.defaultThreatRange
  const modifiers = stage.modifiers && stage.modifiers.length > 0 ? stage.modifiers : pool.defaultModifiers

  const missionChoiceIds = stage.missionChoiceIds
  const missionsByChoiceId: Record<string, CoopGeneratedMissionInstance> = {}

  const allowQuest = (questId: string | undefined) => Boolean(questId && !params.takenQuestIds.has(questId))

  const pushMission = (choiceId: string, template: CoopExpeditionMissionTemplate, isUnique: boolean) => {
    const modifier = pickWeighted(modifiers) ?? { id: 'none', label: '' }
    const threatLevel = pickThreat({ template, range: threatRange })
    const timeCost = Math.max(0, Math.floor(template.timeCost ?? 1))
    const displayTitle = makeDisplayTitle({ title: template.title, threatLevel, modifierLabel: modifier.label })

    const instance: CoopGeneratedMissionInstance = {
      kind: template.kind,
      title: displayTitle,
      timeCost,
      threatLevel,
      modifierId: modifier.id,
      modifierLabel: modifier.label,
      isUnique,
      scoreModifiers: modifier.scoreModifiers,
      applyStatuses: modifier.applyStatuses,
    }

    if (template.kind === 'sidequest') {
      instance.questId = template.questId
      instance.entryNodeId = template.entryNodeId
    } else {
      instance.nodeId = template.nodeId
    }

    missionsByChoiceId[choiceId] = instance
  }

  const usedMissionIds = new Set<string>()
  const usedQuestIds = new Set<string>()

  const unique = stage.uniqueMissions ?? []
  const randomPool = stage.randomMissions

  // Fill with unique missions first (in order), skipping already taken quests.
  for (const template of unique) {
    if (Object.keys(missionsByChoiceId).length >= missionChoiceIds.length) break
    if (template.kind === 'sidequest') {
      if (!allowQuest(template.questId)) continue
      if (usedQuestIds.has(template.questId)) continue
      usedQuestIds.add(template.questId)
    }
    if (usedMissionIds.has(template.id)) continue
    usedMissionIds.add(template.id)

    const slot = missionChoiceIds.find((id) => !(id in missionsByChoiceId))
    if (!slot) break
    pushMission(slot, template, true)
  }

  // Fill remaining slots with random missions.
  const maxRandom = Math.max(0, Math.floor(stage.randomMissionCount))
  let randomAdded = 0

  while (randomAdded < maxRandom && Object.keys(missionsByChoiceId).length < missionChoiceIds.length) {
    const template = pickWeighted(randomPool)
    if (!template) break

    if (usedMissionIds.has(template.id)) {
      // Stop if we keep rolling duplicates (small pools).
      const remaining = randomPool.filter((t) => !usedMissionIds.has(t.id))
      const next = pickWeighted(remaining)
      if (!next) break
      // Use `next` instead of the duplicate.
      usedMissionIds.add(next.id)
      if (next.kind === 'sidequest') {
        if (!allowQuest(next.questId) || usedQuestIds.has(next.questId)) continue
        usedQuestIds.add(next.questId)
      }
      const slot = missionChoiceIds.find((id) => !(id in missionsByChoiceId))
      if (!slot) break
      pushMission(slot, next, false)
      randomAdded += 1
      continue
    }

    usedMissionIds.add(template.id)
    if (template.kind === 'sidequest') {
      if (!allowQuest(template.questId)) continue
      if (usedQuestIds.has(template.questId)) continue
      usedQuestIds.add(template.questId)
    }

    const slot = missionChoiceIds.find((id) => !(id in missionsByChoiceId))
    if (!slot) break
    pushMission(slot, template, false)
    randomAdded += 1
  }

  const deadlineEvents = stage.deadlineEvents ?? []

  return {
    poolId: pool.id,
    stageIndex: safeStageIndex,
    stageId: stage.id,
    hubNodeId: stage.hubNodeId,
    missionsByChoiceId,
    deadlineEvents,
  }
}

