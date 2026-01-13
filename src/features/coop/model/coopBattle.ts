import type { CoopEncounterState, CoopParticipant } from './store'
import type { BattleSession, Combatant } from '@/features/dreyzab-combat-simulator/model/types'
import { Side } from '@/features/dreyzab-combat-simulator/model/types'
import { ENEMY_TEMPLATES } from '@/features/dreyzab-combat-simulator/model/constants'
import { generateDeckForCombatant } from '@/features/dreyzab-combat-simulator/model/cardGenerator'
import { sortTurnQueue } from '@/features/dreyzab-combat-simulator/model/utils'

function clampInt(value: unknown, min: number, max: number): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : Number(value)
  if (!Number.isFinite(num)) return min
  return Math.max(min, Math.min(max, Math.floor(num)))
}

const DEFAULT_COOP_EQUIPMENT: string[] = ['glock_19', 'knife']

function makeEnemy(params: { id: string; rank: number; templateIdx: number; threat: number; hpMult: number }): Combatant {
  const template = ENEMY_TEMPLATES[Math.min(Math.max(0, params.templateIdx), ENEMY_TEMPLATES.length - 1)]
  const maxHp = Math.max(1, Math.floor(template.hp * params.hpMult))
  const armor = Math.max(0, Math.floor(template.armor + (params.threat - 1) * 0.5))

  return {
    id: params.id,
    name: template.name,
    side: Side.ENEMY,
    rank: clampInt(params.rank, 1, 4),
    resources: { hp: maxHp, maxHp, ap: 1, maxAp: 1, mp: 0, maxMp: 0, wp: 10, maxWp: 10, pp: 0, maxPp: 100 },
    bonusAp: 0,
    initiative: template.initBase,
    armor,
    isDead: false,
    effects: [],
    weaponHeat: 0,
    isJammed: false,
    ammo: 0,
    threatLevel: `T${params.threat}`,
  }
}

function makeEnemies(params: { scenarioId?: string; threat: number }): Combatant[] {
  const threat = clampInt(params.threat, 1, 4)
  const hpMult = 1 + (threat - 1) * 0.25

  const templates =
    params.scenarioId === 'scorpion_nest'
      ? [
          { id: 'e_small_1', rank: 1, templateIdx: 2 },
          { id: 'e_small_2', rank: 2, templateIdx: 2 },
          { id: 'e_medium', rank: 3, templateIdx: 3 },
        ]
      : [{ id: 'e1', rank: 2, templateIdx: 0 }]

  return templates.map((e) => makeEnemy({ ...e, threat, hpMult }))
}

export function createCoopBattleSession(params: { encounter: CoopEncounterState; participants: CoopParticipant[] }): BattleSession {
  const encounter = params.encounter
  const threat = clampInt(encounter.threatLevel, 1, 4)

  const participantById = new Map<number, CoopParticipant>()
  for (const p of params.participants ?? []) participantById.set(p.id, p)

  const players: Combatant[] = encounter.players.map((snapshot, index) => {
    const participant = participantById.get(snapshot.playerId)
    const name = participant?.name ?? `Player ${snapshot.playerId}`

    const maxHp = Math.max(1, Math.floor(snapshot.maxHp))
    const maxWp = Math.max(1, Math.floor(snapshot.maxMorale))

    const hp = clampInt(snapshot.hp, 0, maxHp)
    const wp = clampInt(snapshot.morale, 0, maxWp)

    const maxAp = 3
    const ap = maxAp

    return {
      id: `p${snapshot.playerId}`,
      name,
      side: Side.PLAYER,
      rank: clampInt(index + 1, 1, 4),
      resources: { hp, maxHp, ap, maxAp, mp: 0, maxMp: 0, wp, maxWp, pp: 0, maxPp: 100 },
      equipment: DEFAULT_COOP_EQUIPMENT,
      bonusAp: 0,
      initiative: 0,
      armor: 3,
      isDead: hp <= 0,
      effects: [],
      weaponHeat: 0,
      isJammed: false,
      ammo: 100,
    }
  })

  const enemies = makeEnemies({ scenarioId: encounter.scenarioId, threat })
  const playerHand = players.flatMap((p) => generateDeckForCombatant(p))
  const turnQueue = sortTurnQueue(players, enemies)

  return {
    turnCount: 1,
    phase: 'PLAYER_TURN',
    logs: [`Encounter started (T${threat}).`],
    players,
    enemies,
    playerHand,
    stats: { damageTaken: 0, attacksInOneTurn: 0, turnCount: 1 },
    activeUnitId: turnQueue[0] ?? null,
    turnQueue,
    teamSP: 50,
    maxTeamSP: 100,
  }
}

export function extractCoopBattleResults(session: BattleSession): Array<{ playerId: number; hp: number; morale: number }> {
  const out: Array<{ playerId: number; hp: number; morale: number }> = []
  for (const p of session.players ?? []) {
    if (!p.id.startsWith('p')) continue
    const pid = Number(p.id.slice(1))
    if (!Number.isFinite(pid) || pid <= 0) continue
    out.push({
      playerId: pid,
      hp: clampInt(p.resources.hp, 0, Number.MAX_SAFE_INTEGER),
      morale: clampInt(p.resources.wp, 0, Number.MAX_SAFE_INTEGER),
    })
  }
  return out
}
