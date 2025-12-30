import type { CoopRoleId } from '../shared/types/coop'

export type CoopExpeditionEventId = 'psi_wave' | 'injury_roll' | 'injury_treat'

export interface CoopExpeditionPlayerSnapshot {
  playerId: number
  role: CoopRoleId | null
  hp?: number | null
  maxHp?: number | null
  morale?: number | null
  maxMorale?: number | null
  stamina?: number | null
  maxStamina?: number | null
  skills?: Record<string, number> | null
}

export interface CoopExpeditionInjuryState {
  targetPlayerId: number
  needsTreatment: boolean
}

export interface CoopExpeditionEventPerPlayerResult {
  pass: boolean
  traitsAdded: string[]
}

export interface CoopExpeditionEventResolution {
  id: CoopExpeditionEventId
  success: boolean
  summary: string
  perPlayer: Record<string, CoopExpeditionEventPerPlayerResult>
  injury?: CoopExpeditionInjuryState
  targetPlayerId?: number
  actorPlayerId?: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function ratio(current: unknown, max: unknown): number {
  const cur = typeof current === 'number' && Number.isFinite(current) ? current : Number(current)
  const mx = typeof max === 'number' && Number.isFinite(max) ? max : Number(max)
  if (!Number.isFinite(cur) || !Number.isFinite(mx) || mx <= 0) return 1
  return clamp(cur / mx, 0, 1)
}

function readSkill(skills: Record<string, number> | null | undefined, skillId: string): number {
  if (!skills || typeof skills !== 'object') return 0
  const raw = (skills as any)[skillId]
  const n = typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw)
  return Number.isFinite(n) ? n : 0
}

function roll1d100(): number {
  return Math.floor(Math.random() * 100) + 1
}

function pickOne<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null
  return items[Math.floor(Math.random() * items.length)] ?? null
}

export function resolveExpeditionEvent(params: {
  id: CoopExpeditionEventId
  players: CoopExpeditionPlayerSnapshot[]
  actorRole?: CoopRoleId
  injury?: CoopExpeditionInjuryState
}): CoopExpeditionEventResolution {
  const players = params.players
  const perPlayer: Record<string, CoopExpeditionEventPerPlayerResult> = {}

  for (const p of players) {
    perPlayer[String(p.playerId)] = { pass: true, traitsAdded: [] }
  }

  if (params.id === 'psi_wave') {
    const traitPool = ['paranoia', 'sarcasm', 'psychosis', 'aggression'] as const
    let passCount = 0

    for (const p of players) {
      const moraleRatio = ratio(p.morale, p.maxMorale)
      const hpRatio = ratio(p.hp, p.maxHp)
      const courage = readSkill(p.skills ?? null, 'courage')

      const chanceRaw = 25 + moraleRatio * 45 + courage * 7 + (hpRatio - 0.5) * 20
      const chance = clamp(Math.round(chanceRaw), 5, 95)
      const roll = roll1d100()
      const pass = roll <= chance

      const traitsAdded = pass ? [] : ([pickOne(traitPool)].filter(Boolean) as string[])
      perPlayer[String(p.playerId)] = { pass, traitsAdded }
      if (pass) passCount += 1
    }

    const success = passCount === players.length
    return {
      id: 'psi_wave',
      success,
      summary: `Psi-wave: ${passCount}/${players.length} resisted`,
      perPlayer,
    }
  }

  if (params.id === 'injury_roll') {
    const target = pickOne(players)
    if (!target) {
      return {
        id: 'injury_roll',
        success: true,
        summary: 'Injury: no target',
        perPlayer,
      }
    }

    const hpRatio = ratio(target.hp, target.maxHp)
    const moraleRatio = ratio(target.morale, target.maxMorale)
    const endurance = readSkill(target.skills ?? null, 'endurance')

    const chanceRaw = 35 + hpRatio * 30 + moraleRatio * 15 + endurance * 7
    const chance = clamp(Math.round(chanceRaw), 5, 95)
    const roll = roll1d100()
    const pass = roll <= chance

    perPlayer[String(target.playerId)] = { pass, traitsAdded: [] }
    const needsTreatment = !pass

    return {
      id: 'injury_roll',
      success: pass,
      summary: needsTreatment ? 'Injury: needs treatment' : 'Injury: resisted',
      perPlayer,
      injury: { targetPlayerId: target.playerId, needsTreatment },
      targetPlayerId: target.playerId,
    }
  }

  if (params.id === 'injury_treat') {
    const injury = params.injury
    if (!injury || !injury.targetPlayerId) {
      return {
        id: 'injury_treat',
        success: false,
        summary: 'Treatment: no injury context',
        perPlayer,
      }
    }

    const actorRole = params.actorRole
    const actor = actorRole ? players.find((p) => p.role === actorRole) : null
    if (!actor) {
      perPlayer[String(injury.targetPlayerId)] = { pass: false, traitsAdded: ['injured'] }
      return {
        id: 'injury_treat',
        success: false,
        summary: 'Treatment failed (no actor)',
        perPlayer,
        targetPlayerId: injury.targetPlayerId,
      }
    }

    const skillByRole: Partial<Record<CoopRoleId, string>> = {
      valkyrie: 'empathy',
      vorschlag: 'analysis',
      ghost: 'perception',
      shustrya: 'solidarity',
    }
    const baseByRole: Partial<Record<CoopRoleId, number>> = {
      valkyrie: 55,
      vorschlag: 45,
      ghost: 40,
      shustrya: 35,
    }

    const skillId = (actorRole ? skillByRole[actorRole] : undefined) ?? 'empathy'
    const base = (actorRole ? baseByRole[actorRole] : undefined) ?? 40
    const actorMoraleRatio = ratio(actor.morale, actor.maxMorale)
    const skill = readSkill(actor.skills ?? null, skillId)

    const chanceRaw = base + actorMoraleRatio * 20 + skill * 7
    const chance = clamp(Math.round(chanceRaw), 5, 95)
    const roll = roll1d100()
    const pass = roll <= chance

    perPlayer[String(actor.playerId)] = { pass, traitsAdded: [] }
    if (!pass) {
      perPlayer[String(injury.targetPlayerId)] = { pass: false, traitsAdded: ['injured'] }
    }

    return {
      id: 'injury_treat',
      success: pass,
      summary: pass ? 'Treatment succeeded' : 'Treatment failed',
      perPlayer,
      targetPlayerId: injury.targetPlayerId,
      actorPlayerId: actor.playerId,
    }
  }

  return {
    id: params.id,
    success: true,
    summary: 'Event resolved',
    perPlayer,
  }
}
