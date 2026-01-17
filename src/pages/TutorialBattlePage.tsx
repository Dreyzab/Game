import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DreyzabBattle, type BattleSession } from '@/features/dreyzab-combat-simulator'
import { BattleEquipmentOverlay } from '@/widgets/battle-equipment'
import { Routes } from '@/shared/lib/utils/navigation'
import { SCENARIOS, type ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'
import { sortTurnQueue } from '@/entities/dreyzab-combat-simulator/model/utils'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'

export default function TutorialBattlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const returnScene = searchParams.get('returnScene') || 'combat_tutorial_victory'
  const defeatScene = searchParams.get('defeatScene') || 'combat_tutorial_defeat'
  const scenarioIdParam = searchParams.get('scenarioId') ?? 'default'
  const requestedHpRaw = searchParams.get('hp')
  const requestedMaxHpRaw = searchParams.get('maxHp')
  const requestedApRaw = searchParams.get('ap')
  const requestedMaxApRaw = searchParams.get('maxAp')
  const requestedMpRaw = searchParams.get('mp')
  const requestedMaxMpRaw = searchParams.get('maxMp')
  const requestedWpRaw = searchParams.get('wp')
  const requestedMaxWpRaw = searchParams.get('maxWp')
  const equipmentParam = searchParams.get('equipment')

  const { initialSession, initialHp, scenarioId } = useMemo(() => {
    const resolvedScenarioId =
      Object.prototype.hasOwnProperty.call(SCENARIOS, scenarioIdParam) ? (scenarioIdParam as ScenarioId) : 'default'
    const baseSessionFactory = SCENARIOS[resolvedScenarioId] ?? SCENARIOS.default
    const parsedEquipment = equipmentParam ? equipmentParam.split(',').filter(Boolean) : undefined
    const baseSession = baseSessionFactory({ playerEquipment: parsedEquipment })
    const baseHp = baseSession.players.find((p) => p.id === 'p1')?.resources.hp ?? 0

    const nextPlayers = baseSession.players.map((player) => {
      if (player.id !== 'p1') return player

      const resources = { ...player.resources }

      const parseAndClamp = (valRaw: string | null, maxVal: number, defaultVal: number) => {
        const val = typeof valRaw === 'string' && valRaw.trim().length > 0 ? Number(valRaw) : null
        return typeof val === 'number' && Number.isFinite(val) ? Math.max(0, Math.min(maxVal, Math.trunc(val))) : defaultVal
      }

      const parseMax = (valRaw: string | null, defaultVal: number) => {
        const val = typeof valRaw === 'string' && valRaw.trim().length > 0 ? Number(valRaw) : null
        return typeof val === 'number' && Number.isFinite(val) ? Math.max(1, Math.trunc(val)) : defaultVal
      }

      resources.maxHp = parseMax(requestedMaxHpRaw, resources.maxHp)
      resources.hp = parseAndClamp(requestedHpRaw, resources.maxHp, resources.hp)

      resources.maxAp = parseMax(requestedMaxApRaw, resources.maxAp)
      resources.ap = parseAndClamp(requestedApRaw, resources.maxAp, resources.ap)

      resources.maxMp = parseMax(requestedMaxMpRaw, resources.maxMp)
      resources.mp = parseAndClamp(requestedMpRaw, resources.maxMp, resources.mp)

      resources.maxWp = parseMax(requestedMaxWpRaw, resources.maxWp)
      resources.wp = parseAndClamp(requestedWpRaw, resources.maxWp, resources.wp)

      return {
        ...player,
        resources,
        isDead: resources.hp <= 0,
      }
    })

    const turnQueue = sortTurnQueue(nextPlayers, baseSession.enemies)
    const activeUnitId = turnQueue[0] ?? null
    const activeUnit =
      activeUnitId != null ? [...nextPlayers, ...baseSession.enemies].find((unit) => unit.id === activeUnitId) ?? null : null

    const phase: BattleSession['phase'] =
      activeUnit?.side === Side.PLAYER
        ? 'PLAYER_TURN'
        : activeUnit?.side === Side.ENEMY
          ? 'ENEMY_TURN'
          : baseSession.phase

    const patchedSession: BattleSession = {
      ...baseSession,
      players: nextPlayers,
      turnQueue,
      activeUnitId,
      phase,
    }

    const patchedHp = patchedSession.players.find((p) => p.id === 'p1')?.resources.hp ?? baseHp
    return { scenarioId: resolvedScenarioId, initialSession: patchedSession, initialHp: Math.trunc(patchedHp) }
  }, [
    equipmentParam,
    requestedApRaw,
    requestedHpRaw,
    requestedMaxApRaw,
    requestedMaxHpRaw,
    requestedMaxMpRaw,
    requestedMaxWpRaw,
    requestedMpRaw,
    requestedWpRaw,
    scenarioIdParam,
  ])

  const handleComplete = useCallback(
    (result: 'victory' | 'defeat', finalSession?: BattleSession) => {
      const targetScene = result === 'victory' ? returnScene : defeatScene

      const finalHpRaw = finalSession?.players.find((p) => p.id === 'p1')?.resources.hp
      const finalHp =
        typeof finalHpRaw === 'number' && Number.isFinite(finalHpRaw) ? Math.trunc(finalHpRaw) : initialHp
      const hpDelta = finalHp - initialHp

      const suffix = hpDelta !== 0 ? `?hpDelta=${encodeURIComponent(String(hpDelta))}` : ''
      navigate(`${Routes.VISUAL_NOVEL}/${targetScene}${suffix}`)
    },
    [defeatScene, initialHp, navigate, returnScene]
  )

  const handleSkip = useCallback(() => {
    navigate(`${Routes.VISUAL_NOVEL}/${returnScene}`)
  }, [navigate, returnScene])

  return (
    <div className="relative">
      <button
        onClick={handleSkip}
        className="fixed top-3 right-3 z-[130] px-3 py-2 rounded-lg bg-black/70 backdrop-blur border border-zinc-800 text-zinc-200 text-xs hover:text-white transition-colors"
        type="button"
      >
        Skip
      </button>
      <DreyzabBattle
        onBattleEnd={handleComplete}
        scenarioId={scenarioId}
        initialSession={initialSession}
        renderEquipmentOverlay={(props) => <BattleEquipmentOverlay {...props} />}
      />
    </div>
  )
}
