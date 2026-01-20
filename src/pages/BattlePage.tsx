import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DreyzabBattle, type BattleSession } from '@/features/dreyzab-combat-simulator'
import { BattleEquipmentOverlay } from '@/widgets/battle-equipment'
import { Routes } from '@/shared/lib/utils/navigation'
import { SCENARIOS, type ScenarioId } from '@/entities/dreyzab-combat-simulator/model/scenarios'
import { sortTurnQueue } from '@/entities/dreyzab-combat-simulator/model/utils'
import { Side } from '@/entities/dreyzab-combat-simulator/model/types'
import { useAppAuth } from '@/shared/auth'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { authenticatedClient } from '@/shared/api/client'

export default function BattlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getToken } = useAppAuth()
  const { deviceId } = useDeviceId()

  const returnScene = searchParams.get('returnScene')
  const defeatScene = searchParams.get('defeatScene')
  const returnPathRaw = searchParams.get('returnPath')
  const sessionId = searchParams.get('sessionId')

  // Sanitize returnPath: MUST be relative (start with /), no external domains
  const returnPath = useMemo(() => {
    if (!returnPathRaw) return null
    if (!returnPathRaw.startsWith('/')) return null
    try {
      // Check for // or protocol
      if (returnPathRaw.includes('//') || returnPathRaw.includes(':')) return null
      return returnPathRaw
    } catch {
      return null
    }
  }, [returnPathRaw])
  const scenarioIdParam = searchParams.get('scenarioId') ?? searchParams.get('enemyKey') ?? 'default'
  const requestedHpRaw = searchParams.get('hp')
  const requestedMaxHpRaw = searchParams.get('maxHp')
  const requestedApRaw = searchParams.get('ap')
  const requestedMaxApRaw = searchParams.get('maxAp')
  const requestedMpRaw = searchParams.get('mp')
  const requestedMaxMpRaw = searchParams.get('maxMp')
  const equipmentParam = searchParams.get('equipment')

  const shouldAutoReturn = Boolean(returnScene || defeatScene || returnPath)

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
    requestedMpRaw,
    scenarioIdParam,
  ])

  const handleBattleEnd = useCallback(
    async (result: 'victory' | 'defeat', finalSession?: BattleSession) => {
      const finalHpRaw = finalSession?.players.find((p) => p.id === 'p1')?.resources.hp
      const finalHp =
        typeof finalHpRaw === 'number' && Number.isFinite(finalHpRaw) ? Math.trunc(finalHpRaw) : initialHp

      // If we have a sessionId, report the result to the survival server
      if (sessionId) {
        try {
          const token = await getToken()
          const client = authenticatedClient(token || undefined, deviceId)
          await client.survival.sessions({ id: sessionId })['complete-battle'].post({
            result: result === 'victory' ? 'victory' : 'defeat',
            hp: finalHp
          })
        } catch (err) {
          console.error('[Battle] Failed to report survival result', err)
        }
      }

      // Traditional VN-style return
      if (returnScene || defeatScene) {
        const targetScene = result === 'victory' ? returnScene : defeatScene ?? returnScene
        if (!targetScene) return

        const hpDelta = finalHp - initialHp
        const suffix = hpDelta !== 0 ? `?hpDelta=${encodeURIComponent(String(hpDelta))}` : ''
        navigate(`${Routes.VISUAL_NOVEL}/${targetScene}${suffix}`)
        return
      }

      // Generic returnPath support
      if (returnPath) {
        navigate(returnPath)
        return
      }
    },
    [deviceId, getToken, initialHp, navigate, returnPath, returnScene, defeatScene, sessionId]
  )

  return (
    <div className="relative">
      {shouldAutoReturn && (
        <button
          onClick={async () => {
            // Report flee to clear pendingBattle state
            if (sessionId) {
              try {
                const token = await getToken()
                const client = authenticatedClient(token || undefined, deviceId)
                await client.survival.sessions({ id: sessionId })['complete-battle'].post({
                  result: 'defeat', // Treat early exit as defeat/flee
                  hp: initialHp // No HP change if just fleeing immediately, or use current?
                })
              } catch (err) {
                console.error('[Battle] Failed to report flee', err)
              }
            }

            if (returnPath) {
              navigate(returnPath)
              return
            }
            const targetScene = returnScene ?? defeatScene
            navigate(targetScene ? `${Routes.VISUAL_NOVEL}/${targetScene}` : Routes.VISUAL_NOVEL)
          }}
          className="fixed top-3 right-3 z-[130] px-3 py-2 rounded-lg bg-black/70 backdrop-blur border border-zinc-800 text-zinc-200 text-xs hover:text-white transition-colors"
          type="button"
        >
          Exit
        </button>
      )}
      <DreyzabBattle
        onBattleEnd={shouldAutoReturn ? handleBattleEnd : undefined}
        scenarioId={scenarioId}
        initialSession={initialSession}
        renderEquipmentOverlay={(props) => <BattleEquipmentOverlay {...props} />}
      />

      {/* Fade In Overlay */}
      <div
        className="fixed inset-0 bg-black pointer-events-none z-[200] animate-fade-out"
        style={{ animationDuration: '1s', animationFillMode: 'forwards' }}
      />
    </div>
  )
}
