import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useCoopStore, CoopLobby } from '@/features/coop'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { useMyPlayer } from '@/shared/hooks/useMyPlayer'
import { CoopVisualNovelPage } from '@/pages/CoopVisualNovelPage'
import CoopBattlePage from '@/pages/CoopBattlePage'

const CoopPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode?: string }>()
  const myPlayerQuery = useMyPlayer()
  const myId = (myPlayerQuery.data as any)?.player?.id as number | undefined
  const isProfileReady = Boolean(myId)
  const { room, isLoading, joinRoom } = useCoopStore()
  const lastJoinAttempt = useRef<string | null>(null)

  useEffect(() => {
    if (!roomCode) return
    if (room?.code === roomCode) return
    if (!isProfileReady) return
    if (lastJoinAttempt.current === roomCode) return
    lastJoinAttempt.current = roomCode
    joinRoom(roomCode).catch(() => {
      // errors are exposed via the store
    })
  }, [isProfileReady, joinRoom, room?.code, roomCode])

  if (isLoading || myPlayerQuery.isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    )
  }

  if (room?.status === 'active') {
    if (room?.encounter && room.encounter.status === 'active') {
      return <CoopBattlePage />
    }
    return <CoopVisualNovelPage />
  }

  return <CoopLobby />
}

export default CoopPage
