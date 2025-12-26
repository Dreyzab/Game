import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCoopStore, CoopLobby } from '@/features/coop'
import { Routes } from '@/shared/lib/utils/navigation'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { useMyPlayer } from '@/shared/hooks/useMyPlayer'

const CoopPage: React.FC = () => {
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!room) return
    if (room.status !== 'active') return
    navigate(`${Routes.VISUAL_NOVEL}/coop_briefing_intro`, { replace: true })
  }, [navigate, room])

  if (isLoading || myPlayerQuery.isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    )
  }

  return <CoopLobby />
}

export default CoopPage
