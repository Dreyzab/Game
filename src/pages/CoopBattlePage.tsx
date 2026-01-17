import React, { useCallback, useMemo, useRef } from 'react'
import { DreyzabBattle, type BattleSession } from '@/features/dreyzab-combat-simulator'
import { createCoopBattleSession, extractCoopBattleResults, useCoopStore } from '@/features/coop'
import { useMyPlayer } from '@/shared/hooks/useMyPlayer'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { BattleEquipmentOverlay } from '@/widgets/battle-equipment'

export const CoopBattlePage: React.FC = () => {
  const { room, resolveBattle } = useCoopStore()
  const myPlayerQuery = useMyPlayer()

  const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined
  const isHost = Boolean(myId && room?.hostId === myId)
  const encounter = room?.encounter ?? null

  const isResolvingRef = useRef(false)

  const initialSession = useMemo(() => {
    if (!room || !encounter || encounter.status !== 'active') return null
    return createCoopBattleSession({ encounter, participants: room.participants })
  }, [encounter, room])

  const handleBattleEnd = useCallback(
    async (result: 'victory' | 'defeat', finalSession?: BattleSession) => {
      if (!isHost) return
      if (!encounter || encounter.status !== 'active') return
      if (isResolvingRef.current) return
      isResolvingRef.current = true

      try {
        const session = finalSession ?? initialSession
        if (!session) throw new Error('Missing battle session')
        const players = extractCoopBattleResults(session).map((p) => ({
          playerId: p.playerId,
          hp: p.hp,
          morale: p.morale,
        }))

        await resolveBattle({ result, players })
      } finally {
        isResolvingRef.current = false
      }
    },
    [encounter, initialSession, isHost, resolveBattle]
  )

  if (!room || myPlayerQuery.isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    )
  }

  if (!encounter || encounter.status !== 'active') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={3}>No active battle</Heading>
          <Text variant="muted" size="sm">
            Return to the expedition.
          </Text>
        </div>
      </div>
    )
  }

  if (!isHost) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white p-6">
        <div className="max-w-xl text-center space-y-3">
          <Heading level={3}>Battle in progress</Heading>
          <Text variant="muted" size="sm">
            Waiting for the host to resolve the encounter.
          </Text>
          <Text variant="muted" size="sm">
            Threat: T{encounter.threatLevel}
          </Text>
        </div>
      </div>
    )
  }

  if (!initialSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="relative">
      <DreyzabBattle
        key={encounter.id}
        initialSession={initialSession}
        onBattleEnd={handleBattleEnd}
        renderEquipmentOverlay={(props) => <BattleEquipmentOverlay {...props} />}
      />
    </div>
  )
}

export default CoopBattlePage
