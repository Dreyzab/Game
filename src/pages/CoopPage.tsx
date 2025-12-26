import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCoopStore, CoopLobby } from '@/features/coop'
import { Routes } from '@/shared/lib/utils/navigation'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'

const CoopPage: React.FC = () => {
  const navigate = useNavigate()
  const { roomCode } = useParams<{ roomCode?: string }>()
  const { room, isLoading, joinRoom } = useCoopStore()

  useEffect(() => {
    if (!roomCode) return
    if (room?.code === roomCode) return
    joinRoom(roomCode).catch(() => {
      // errors are exposed via the store
    })
  }, [joinRoom, room?.code, roomCode])

  useEffect(() => {
    if (!room) return
    if (room.status !== 'active') return
    navigate(`${Routes.VISUAL_NOVEL}/coop_briefing_intro`, { replace: true })
  }, [navigate, room])

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    )
  }

  return <CoopLobby />
}

export default CoopPage
